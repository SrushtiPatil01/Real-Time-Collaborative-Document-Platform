import { Response, NextFunction } from "express";
import { Workspace } from "../models/Workspace";
import { ApiError } from "../utils/ApiError";
import { AuthRequest, WorkspaceRole } from "../types";

const ROLE_HIERARCHY: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export function requireWorkspaceRole(...allowedRoles: WorkspaceRole[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      const workspaceId = req.params.workspaceId || req.body.workspace;
      if (!workspaceId) throw ApiError.badRequest("Workspace ID required");

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) throw ApiError.notFound("Workspace not found");

      const member = workspace.members.find(
        (m) => m.user.toString() === req.user!.id
      );
      if (!member) throw ApiError.forbidden("Not a member of this workspace");

      const userLevel = ROLE_HIERARCHY[member.role as WorkspaceRole];
      const minLevel = Math.min(...allowedRoles.map((r) => ROLE_HIERARCHY[r]));

      if (userLevel < minLevel) {
        throw ApiError.forbidden(`Requires role: ${allowedRoles.join(" or ")}`);
      }

      (req as any).workspaceRole = member.role;
      next();
    } catch (err) {
      next(err);
    }
  };
}