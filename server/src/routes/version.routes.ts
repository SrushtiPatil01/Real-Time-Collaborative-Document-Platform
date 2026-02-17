import { Router } from "express";
import { versionController } from "../controllers/version.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
router.use(authenticate);

router.get("/:docId", versionController.getVersions);
router.get("/:docId/:versionNum", versionController.getVersion);
router.post("/:docId/:versionNum/restore", versionController.restoreVersion);

export default router;