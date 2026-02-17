import { Router } from "express";
import { workspaceController } from "../controllers/workspace.controller";
import { authenticate } from "../middleware/auth";
import { requireWorkspaceRole } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import { z } from "zod";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

const updateRoleSchema = z.object({
  role: z.enum(["admin", "editor", "viewer"]),
});

router.use(authenticate);

router.post("/", validate(createSchema), workspaceController.create);
router.get("/", workspaceController.getUserWorkspaces);
router.get("/:id", workspaceController.getById);
router.put("/:id", requireWorkspaceRole("owner", "admin"), workspaceController.update);
router.delete("/:id", requireWorkspaceRole("owner"), workspaceController.remove);

// Members
router.post("/:id/members", requireWorkspaceRole("owner", "admin"), validate(addMemberSchema), workspaceController.addMember);
router.delete("/:id/members/:userId", requireWorkspaceRole("owner", "admin"), workspaceController.removeMember);
router.patch("/:id/members/:userId/role", requireWorkspaceRole("owner", "admin"), validate(updateRoleSchema), workspaceController.updateMemberRole);

export default router;
