import { Request } from "express";
import { Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  username: string;
  password: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspace {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: IWorkspaceMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkspaceMember {
  user: Types.ObjectId;
  role: "owner" | "admin" | "editor" | "viewer";
  joinedAt: Date;
}

export interface IDocument {
  _id: Types.ObjectId;
  title: string;
  content: string;
  workspace: Types.ObjectId;
  createdBy: Types.ObjectId;
  lastEditedBy: Types.ObjectId;
  collaborators: Types.ObjectId[];
  isArchived: boolean;
  version: number;
  tags: string[];
  attachments: IAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IAttachment {
  filename: string;
  originalName: string;
  s3Key: string;
  mimeType: string;
  size: number;
  uploadedBy: Types.ObjectId;
  uploadedAt: Date;
}

export interface IVersion {
  _id: Types.ObjectId;
  document: Types.ObjectId;
  content: string;
  version: number;
  editedBy: Types.ObjectId;
  changeSummary?: string;
  createdAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  username: string;
}

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export interface OTOperation {
  type: "insert" | "delete" | "retain";
  position: number;
  content?: string;
  length?: number;
  userId: string;
  version: number;
  timestamp: number;
}

export interface WSMessage {
  type: string;
  payload: any;
  documentId?: string;
  userId?: string;
}

export interface PresenceInfo {
  userId: string;
  username: string;
  avatar?: string;
  cursor?: { line: number; ch: number };
  selection?: { anchor: { line: number; ch: number }; head: { line: number; ch: number } };
  color: string;
  lastActive: number;
}