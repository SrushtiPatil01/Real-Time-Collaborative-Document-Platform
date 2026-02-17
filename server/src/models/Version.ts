import mongoose, { Schema, Document } from "mongoose";
import { IVersion } from "../types";

export interface VersionDocument extends Omit<IVersion, "_id">, Document {}

const versionSchema = new Schema<VersionDocument>(
  {
    document: { type: Schema.Types.ObjectId, ref: "Document", required: true, index: true },
    content: { type: String, required: true },
    version: { type: Number, required: true },
    editedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    changeSummary: { type: String, maxlength: 200 },
  },
  { timestamps: true }
);

versionSchema.index({ document: 1, version: -1 });

export const Version = mongoose.model<VersionDocument>("Version", versionSchema);