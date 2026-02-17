import { PresenceInfo } from "../types";

class PresenceManager {
  // documentId -> Map<userId, PresenceInfo>
  private presence: Map<string, Map<string, PresenceInfo>> = new Map();

  private readonly COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F0B27A", "#82E0AA",
  ];

  private colorIndex = 0;

  private getColor(): string {
    const c = this.COLORS[this.colorIndex % this.COLORS.length];
    this.colorIndex++;
    return c;
  }

  join(docId: string, userId: string, username: string, avatar?: string): PresenceInfo {
    if (!this.presence.has(docId)) {
      this.presence.set(docId, new Map());
    }

    const info: PresenceInfo = {
      userId,
      username,
      avatar,
      color: this.getColor(),
      lastActive: Date.now(),
    };

    this.presence.get(docId)!.set(userId, info);
    return info;
  }

  leave(docId: string, userId: string) {
    this.presence.get(docId)?.delete(userId);
    if (this.presence.get(docId)?.size === 0) {
      this.presence.delete(docId);
    }
  }

  updateCursor(
    docId: string,
    userId: string,
    cursor: { line: number; ch: number },
    selection?: { anchor: { line: number; ch: number }; head: { line: number; ch: number } }
  ) {
    const info = this.presence.get(docId)?.get(userId);
    if (info) {
      info.cursor = cursor;
      info.selection = selection;
      info.lastActive = Date.now();
    }
  }

  getDocumentPresence(docId: string): PresenceInfo[] {
    const map = this.presence.get(docId);
    return map ? Array.from(map.values()) : [];
  }

  getUserDocuments(userId: string): string[] {
    const docs: string[] = [];
    for (const [docId, users] of this.presence) {
      if (users.has(userId)) docs.push(docId);
    }
    return docs;
  }

  removeUser(userId: string) {
    for (const [docId] of this.presence) {
      this.leave(docId, userId);
    }
  }

  getActiveCount(docId: string): number {
    return this.presence.get(docId)?.size || 0;
  }
}

export const presenceManager = new PresenceManager();