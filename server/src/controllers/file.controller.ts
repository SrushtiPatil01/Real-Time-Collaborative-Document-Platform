import { Response, NextFunction } from "express";
import { s3Service } from "../services/s3.service";
import { Doc } from "../models/Document";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../types";

export class FileController {
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { workspaceId, docId } = req.params;
      if (!req.file) throw ApiError.badRequest("No file provided");

      const doc = await Doc.findById(docId);
      if (!doc) throw ApiError.notFound("Document not found");

      const { key, filename } = await s3Service.uploadFile(req.file, workspaceId, docId);

      doc.attachments.push({
        filename,
        originalName: req.file.originalname,
        s3Key: key,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.user!.id as any,
        uploadedAt: new Date(),
      });
      await doc.save();

      res.status(201).json({
        success: true,
        data: { key, filename, originalName: req.file.originalname },
      });
    } catch (err) {
      next(err);
    }
  }

  async getDownloadUrl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const url = await s3Service.getSignedDownloadUrl(decodeURIComponent(key));
      res.json({ success: true, data: { url } });
    } catch (err) {
      next(err);
    }
  }

  async getUploadUrl(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { workspaceId, docId } = req.params;
      const { filename, contentType } = req.body;
      const result = await s3Service.getSignedUploadUrl(workspaceId, docId, filename, contentType);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { docId, attachmentId } = req.params;
      const doc = await Doc.findById(docId);
      if (!doc) throw ApiError.notFound("Document not found");

      const att = (doc.attachments as any).id(attachmentId);
      if (!att) throw ApiError.notFound("Attachment not found");

      await s3Service.deleteFile(att.s3Key);
      (doc.attachments as any).pull(attachmentId);
      await doc.save();

      res.json({ success: true, message: "File deleted" });
    } catch (err) {
      next(err);
    }
  }
}

export const fileController = new FileController();