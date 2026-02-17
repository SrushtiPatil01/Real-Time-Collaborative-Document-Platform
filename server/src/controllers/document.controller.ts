import { Response, NextFunction } from "express";
import { documentService } from "../services/document.service";
import { AuthRequest } from "../types";

export class DocumentController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { title, workspace } = req.body;
      const doc = await documentService.create(title, workspace, req.user!.id);
      res.status(201).json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  async getByWorkspace(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { workspaceId } = req.params;
      const { search, tags, archived } = req.query;
      const docs = await documentService.getByWorkspace(workspaceId, {
        search: search as string,
        tags: tags ? (tags as string).split(",") : undefined,
        archived: archived === "true",
      });
      res.json({ success: true, data: docs });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doc = await documentService.getById(req.params.id);
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doc = await documentService.update(req.params.id, req.user!.id, req.body);
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  async archive(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doc = await documentService.archive(req.params.id);
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  async restore(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const doc = await documentService.restore(req.params.id);
      res.json({ success: true, data: doc });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await documentService.remove(req.params.id);
      res.json({ success: true, message: "Document deleted" });
    } catch (err) {
      next(err);
    }
  }
}

export const documentController = new DocumentController();