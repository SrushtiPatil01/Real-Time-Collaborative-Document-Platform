import { Server as HTTPServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import url from "url";
import { verifyAccessToken } from "../utils/jwt";
import { handleConnection } from "./handlers";
import { logger } from "../utils/logger";

export function setupWebSocket(server: HTTPServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req) => {
    try {
      const params = url.parse(req.url || "", true).query;
      const token = params.token as string;

      if (!token) {
        ws.close(4001, "Authentication required");
        return;
      }

      const payload = verifyAccessToken(token);
      handleConnection(ws, payload.id, payload.username);
    } catch (err) {
      logger.error("WS auth failed:", err);
      ws.close(4003, "Authentication failed");
    }
  });

  wss.on("error", (err) => logger.error("WSS error:", err));

  logger.info("WebSocket server initialized on /ws");
  return wss;
}
