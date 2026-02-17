import { Response, NextFunction } from "express";
import { workspaceService } from "../services/workspace.service";
import { AuthRequest } from "../types";

export class WorkspaceController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { name, description } = req.body;
      const ws = await workspaceService.create(name, description, req.user!.id);
      res.status(201).json({ success: true, data: ws });
    } catch (err) {
      next(err);
    }
  }

  async getUserWorkspaces(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const workspaces = await workspaceService.getUserWorkspaces(req.user!.id);
      res.json({ success: true, data: workspaces });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ws = await workspaceService.getById(req.params.id, req.user!.id);
      res.json({ success: true, data: ws });
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ws = await workspaceService.update(req.params.id, req.body);
      res.json({ success: true, data: ws });
    } catch (err) {
      next(err);
    }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await workspaceService.remove(req.params.id);
      res.json({ success: true, message: "Workspace deleted" });
    } catch (err) {
      next(err);
    }
  }

  async addMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { userId, role } = req.body;
      const ws = await workspaceService.addMember(req.params.id, userId, role);
      res.json({ success: true, data: ws });
    } catch (err) {
      next(err);
    }
  }

  async removeMember(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const ws = await workspaceService.removeMember(req.params.id, req.params.userId);
      res.json({ success: true, data: ws });
    } catch (err) {
      next(err);
    }
  }

  async updateMemberRole(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { role } = req.body;
      const ws = await workspaceService.updateMemberRole(req.params.id, req.params.userId, role);
      res.json({ success: true, data: ws });
    } catch (err) {
      next(err);
    }
  }
}

export const workspaceController = new WorkspaceController();