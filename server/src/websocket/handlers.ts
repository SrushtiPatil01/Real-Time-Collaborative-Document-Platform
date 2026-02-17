import WebSocket from "ws";
import { Doc } from "../models/Document";
import { otService } from "../services/ot.service";
import { presenceManager } from "./presence";
import { WSMessage, OTOperation } from "../types";
import { logger } from "../utils/logger";

interface ClientInfo {
  ws: WebSocket;
  userId: string;
  username: string;
  documentId?: string;
}

const clients: Map<WebSocket, ClientInfo> = new Map();
const documentClients: Map<string, Set<WebSocket>> = new Map();

export function handleConnection(ws: WebSocket, userId: string, username: string) {
  clients.set(ws, { ws, userId, username });
  logger.info(`WS connected: ${username} (${userId})`);

  ws.on("message", (raw) => {
    try {
      const msg: WSMessage = JSON.parse(raw.toString());
      handleMessage(ws, msg);
    } catch (err) {
      logger.error("WS message parse error:", err);
      send(ws, { type: "error", payload: { message: "Invalid message format" } });
    }
  });

  ws.on("close", () => handleDisconnect(ws));
  ws.on("error", (err) => {
    logger.error("WS error:", err);
    handleDisconnect(ws);
  });
}

function handleMessage(ws: WebSocket, msg: WSMessage) {
  const client = clients.get(ws);
  if (!client) return;

  switch (msg.type) {
    case "join-document":
      handleJoinDocument(ws, client, msg.payload.documentId);
      break;
    case "leave-document":
      handleLeaveDocument(ws, client);
      break;
    case "operation":
      handleOperation(ws, client, msg.payload);
      break;
    case "cursor-update":
      handleCursorUpdate(client, msg.payload);
      break;
    case "content-sync":
      handleContentSync(ws, client, msg.payload);
      break;
    default:
      send(ws, { type: "error", payload: { message: `Unknown type: ${msg.type}` } });
  }
}

async function handleJoinDocument(ws: WebSocket, client: ClientInfo, docId: string) {
  // Leave previous doc
  if (client.documentId) handleLeaveDocument(ws, client);

  client.documentId = docId;

  if (!documentClients.has(docId)) documentClients.set(docId, new Set());
  documentClients.get(docId)!.add(ws);

  const presence = presenceManager.join(docId, client.userId, client.username);

  // Load doc
  try {
    const doc = await Doc.findById(docId);
    if (doc) {
      otService.setVersion(docId, doc.version);
      send(ws, {
        type: "document-loaded",
        payload: {
          content: doc.content,
          version: doc.version,
          title: doc.title,
        },
      });
    }
  } catch (err) {
    logger.error("Error loading doc for WS:", err);
  }

  // Broadcast presence
  const allPresence = presenceManager.getDocumentPresence(docId);
  broadcastToDocument(docId, {
    type: "presence-update",
    payload: { users: allPresence },
  });

  // Notify join
  broadcastToDocument(
    docId,
    {
      type: "user-joined",
      payload: { user: presence },
    },
    ws
  );
}

function handleLeaveDocument(ws: WebSocket, client: ClientInfo) {
  const docId = client.documentId;
  if (!docId) return;

  documentClients.get(docId)?.delete(ws);
  if (documentClients.get(docId)?.size === 0) {
    documentClients.delete(docId);
    otService.cleanup(docId);
  }

  presenceManager.leave(docId, client.userId);
  client.documentId = undefined;

  broadcastToDocument(docId, {
    type: "user-left",
    payload: { userId: client.userId },
  });

  const allPresence = presenceManager.getDocumentPresence(docId);
  broadcastToDocument(docId, {
    type: "presence-update",
    payload: { users: allPresence },
  });
}

async function handleOperation(ws: WebSocket, client: ClientInfo, payload: any) {
  const docId = client.documentId;
  if (!docId) return;

  const op: OTOperation = {
    ...payload,
    userId: client.userId,
    timestamp: Date.now(),
  };

  try {
    const doc = await Doc.findById(docId);
    if (!doc) return;

    const newContent = otService.applyOperation(docId, op, doc.content);
    doc.content = newContent;
    doc.lastEditedBy = client.userId as any;
    await doc.save();

    // Ack to sender
    send(ws, {
      type: "operation-ack",
      payload: { version: otService.getVersion(docId), operation: op },
    });

    // Broadcast to others
    broadcastToDocument(
      docId,
      {
        type: "remote-operation",
        payload: {
          operation: op,
          version: otService.getVersion(docId),
          userId: client.userId,
          username: client.username,
        },
      },
      ws
    );
  } catch (err) {
    logger.error("Operation error:", err);
    send(ws, { type: "operation-error", payload: { message: "Failed to apply operation" } });
  }
}

function handleCursorUpdate(client: ClientInfo, payload: any) {
  const docId = client.documentId;
  if (!docId) return;

  presenceManager.updateCursor(docId, client.userId, payload.cursor, payload.selection);

  broadcastToDocument(docId, {
    type: "cursor-update",
    payload: {
      userId: client.userId,
      username: client.username,
      cursor: payload.cursor,
      selection: payload.selection,
      color: presenceManager.getDocumentPresence(docId).find((p) => p.userId === client.userId)?.color,
    },
  });
}

async function handleContentSync(_ws: WebSocket, client: ClientInfo, payload: any) {
  const docId = client.documentId;
  if (!docId) return;

  try {
    const doc = await Doc.findById(docId);
    if (doc) {
      doc.content = payload.content;
      doc.lastEditedBy = client.userId as any;
      doc.version += 1;
      await doc.save();

      broadcastToDocument(docId, {
        type: "content-sync",
        payload: {
          content: payload.content,
          version: doc.version,
          userId: client.userId,
        },
      });
    }
  } catch (err) {
    logger.error("Content sync error:", err);
  }
}

function handleDisconnect(ws: WebSocket) {
  const client = clients.get(ws);
  if (client) {
    if (client.documentId) handleLeaveDocument(ws, client);
    presenceManager.removeUser(client.userId);
    clients.delete(ws);
    logger.info(`WS disconnected: ${client.username}`);
  }
}

function send(ws: WebSocket, msg: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

function broadcastToDocument(docId: string, msg: any, exclude?: WebSocket) {
  const sockets = documentClients.get(docId);
  if (!sockets) return;
  const data = JSON.stringify(msg);
  for (const ws of sockets) {
    if (ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}