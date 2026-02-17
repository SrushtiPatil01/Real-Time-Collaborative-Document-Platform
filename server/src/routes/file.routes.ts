import { Router } from "express";
import multer from "multer";
import { fileController } from "../controllers/file.controller";
import { authenticate } from "../middleware/auth";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain", "text/csv",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(authenticate);

router.post("/:workspaceId/:docId/upload", upload.single("file"), fileController.upload);
router.get("/download/:key(*)", fileController.getDownloadUrl);
router.post("/:workspaceId/:docId/presign", fileController.getUploadUrl);
router.delete("/:docId/attachments/:attachmentId", fileController.remove);

export default router;