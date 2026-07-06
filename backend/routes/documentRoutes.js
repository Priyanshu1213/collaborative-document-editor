import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  shareDocument,
  removeCollaborator,
} from "../controllers/documentController.js";
import { updatePermission } from "../controllers/permissionController.js";
import versionRoutes from "./versionRoutes.js";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Document CRUD
router.get("/", getDocuments);
router.post("/", createDocument);
router.get("/:id", getDocument);
router.put("/:id", updateDocument);
router.delete("/:id", deleteDocument);

// Sharing
router.post("/:id/share", shareDocument);
router.put("/:id/permissions", updatePermission);
router.delete("/:id/collaborators/:collaboratorId", removeCollaborator);

// Version history
router.use("/:id/versions", versionRoutes);

export default router;
