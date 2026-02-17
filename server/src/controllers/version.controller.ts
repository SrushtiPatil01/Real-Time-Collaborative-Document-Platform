import { Response, NextFunction } from "express";
import { Version } from "../models/Version";
import { Doc } from "../models/Document";
import { ApiError } from "../utils/ApiError";
import { AuthRequest } from "../types";

export class VersionController {
  async getVersions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { docId } = req.params;
      const versions = await Version.find({ document: docId })
        .populate("editedBy", "username email avatar")
        .sort({ version: -1 })
        .limit(50);
      res.json({ success: true, data: versions });
    } catch (err) {
      next(err);
    }
  }

  async getVersion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { docId, versionNum } = req.params;
      const version = await Version.findOne({
        document: docId,
        version: parseInt(versionNum),
      }).populate("editedBy", "username email avatar");
      if (!version) throw ApiError.notFound("Version not found");
      res.json({ success: true, data: version });
    } catch (err) {
      next(err);
    }
  }

  async restoreVersion(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { docId, versionNum } = req.params;
      const version = await Version.findOne({
        document: docId,
        version: parseInt(versionNum),
      });
      if (!version) throw ApiError.notFound("Version not found");

      const doc = await Doc.findById(docId);
      if (!doc) throw ApiError.notFound("Document not found");

      await Version.create({
        document: doc._id,
        content: doc.content,
        version: doc.version,
        editedBy: req.user!.id,
        changeSummary: `Before restoring to v${versionNum}`,
      });

      doc.content = version.content;
      doc.version += 1;
      doc.lastEditedBy = req.user!.id as any;
      await doc.save();

      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }
}

export const versionController = new VersionController();