import mongoose, { Schema, Document as MongoDocument } from "mongoose";
import { IDocument } from "../types";

export interface DocDocument extends Omit<IDocument, "_id">, MongoDocument {}

const attachmentSchema = new Schema(
  {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    s3Key: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const documentSchema = new Schema<DocDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200, default: "Untitled Document" },
    content: { type: String, default: "" },
    workspace: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastEditedBy: { type: Schema.Types.ObjectId, ref: "User" },
    collaborators: [{ type: Schema.Types.ObjectId, ref: "User" }],
    isArchived: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    tags: [{ type: String, trim: true }],
    attachments: [attachmentSchema],
  },
  { timestamps: true }
);

documentSchema.index({ workspace: 1, isArchived: 1 });
documentSchema.index({ title: "text", tags: "text" });

export const Doc = mongoose.model<DocDocument>("Document", documentSchema);
