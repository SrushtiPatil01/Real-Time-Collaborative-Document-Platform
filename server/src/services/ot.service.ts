import { OTOperation } from "../types";

export class OTService {
  private pendingOps: Map<string, OTOperation[]> = new Map();
  private docVersions: Map<string, number> = new Map();

  getVersion(docId: string): number {
    return this.docVersions.get(docId) || 0;
  }

  setVersion(docId: string, version: number) {
    this.docVersions.set(docId, version);
  }

  applyOperation(docId: string, op: OTOperation, currentContent: string): string {
    let result = currentContent;

    switch (op.type) {
      case "insert":
        if (op.content && op.position >= 0 && op.position <= result.length) {
          result = result.slice(0, op.position) + op.content + result.slice(op.position);
        }
        break;

      case "delete":
        if (op.length && op.position >= 0 && op.position + op.length <= result.length) {
          result = result.slice(0, op.position) + result.slice(op.position + op.length);
        }
        break;

      case "retain":
        break;
    }

    const version = this.getVersion(docId) + 1;
    this.setVersion(docId, version);

    return result;
  }

  transformOperation(op1: OTOperation, op2: OTOperation): OTOperation {
    const transformed = { ...op1 };

    if (op2.type === "insert" && op2.content) {
      if (op1.position > op2.position) {
        transformed.position += op2.content.length;
      } else if (op1.position === op2.position && op1.userId > op2.userId) {
        transformed.position += op2.content.length;
      }
    }

    if (op2.type === "delete" && op2.length) {
      if (op1.position > op2.position) {
        transformed.position = Math.max(op2.position, op1.position - op2.length);
      }
    }

    return transformed;
  }

  addPendingOp(docId: string, op: OTOperation) {
    const ops = this.pendingOps.get(docId) || [];
    ops.push(op);
    this.pendingOps.set(docId, ops);
  }

  getPendingOps(docId: string): OTOperation[] {
    return this.pendingOps.get(docId) || [];
  }

  clearPendingOps(docId: string) {
    this.pendingOps.delete(docId);
  }

  cleanup(docId: string) {
    this.pendingOps.delete(docId);
    this.docVersions.delete(docId);
  }
}

export const otService = new OTService();