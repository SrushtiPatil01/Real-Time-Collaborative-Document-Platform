import mongoose, { Schema, Document } from "mongoose";
import { IWorkspace } from "../types";

export interface WorkspaceDocument extends Omit<IWorkspace, "_id">, Document {}

const workspaceMemberSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "admin", "editor", "viewer"],
      default: "editor",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceSchema = new Schema<WorkspaceDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: [workspaceMemberSchema],
  },
  { timestamps: true }
);

workspaceSchema.index({ "members.user": 1 });

export const Workspace = mongoose.model<WorkspaceDocument>("Workspace", workspaceSchema);