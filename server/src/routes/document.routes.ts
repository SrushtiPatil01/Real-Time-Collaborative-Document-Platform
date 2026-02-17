import { Router } from "express";
import { documentController } from "../controllers/document.controller";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { z } from "zod";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1).max(200).default("Untitled Document"),
  workspace: z.string().min(1),
});

const updateSchema = z.object({
  title: z.string().max(200).optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

router.use(authenticate);

router.post("/", validate(createSchema), documentController.create);
router.get("/workspace/:workspaceId", documentController.getByWorkspace);
router.get("/:id", documentController.getById);
router.put("/:id", validate(updateSchema), documentController.update);
router.patch("/:id/archive", documentController.archive);
router.patch("/:id/restore", documentController.restore);
router.delete("/:id", documentController.remove);

export default router;