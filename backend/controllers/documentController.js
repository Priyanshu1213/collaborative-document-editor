import Document from "../models/Document.js";
import Version from "../models/Version.js";
import User from "../models/User.js";

import {
  buildVersionSnapshot,
  describeVersionChange,
} from "./versionController.js";
import { getSocket } from "../socket.js";
// Get all documents for user
export const getDocuments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const documents = await Document.find({
      $or: [{ ownerId: userId }, { "collaborators.userId": userId }],
      isArchived: false,
    })
      .populate("ownerId", "name email")
      .populate("collaborators.userId", "name email")
      .sort({ updatedAt: -1 });

    res.json(documents);
  } catch (error) {
    console.error("[Get Documents Error]:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
};

// Get single document
export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Try real database first, fall back to mock
    let document;

    try {
      document = await Document.findById(id)
        .populate("ownerId", "name email")
        .populate("collaborators.userId", "name email");
    } catch (dbError) {
      // Fall back to mock database
      document = null;
    }

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission
    const isOwner = document.ownerId._id.toString() === userId;
    const isCollaborator = document.collaborators.some(
      (c) => c.userId._id.toString() === userId,
    );

    if (!isOwner && !isCollaborator && !document.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(document);
  } catch (error) {
    console.error("[Get Document Error]:", error);
    res.status(500).json({ error: "Failed to fetch document" });
  }
};

// Create document
export const createDocument = async (req, res) => {
  try {
    const { title = "Untitled Document", content = "" } = req.body;
    const userId = req.user.userId;

    let document;

    document = new Document({
      title,
      content,
      ownerId: userId,
    });
    await document.save();
    await document.populate("ownerId", "name email");

    res.status(201).json(document);
  } catch (error) {
    console.error("[Create Document Error]:", error);
    res.status(500).json({ error: "Failed to create document" });
  }
};

// Update document
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags } = req.body;
    const userId = req.user.userId;

    let document;

    try {
      document = await Document.findById(id);
    } catch (dbError) {
      document = null;
    }

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission for real database
    const isOwner = document.ownerId.toString() === userId;
    const collaborator = document.collaborators.find(
      (c) => c.userId.toString() === userId,
    );
    const canEdit =
      isOwner || (collaborator && collaborator.permission === "edit");

    if (!canEdit) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const previousContent = document.content;
    const previousTitle = document.title;

    // Update fields
    if (title !== undefined) document.title = title;
    if (content !== undefined) document.content = content;
    if (tags !== undefined) document.tags = tags;

    const titleChanged = title !== undefined && title !== previousTitle;
    const contentChanged = content !== undefined && content !== previousContent;

    if (titleChanged || contentChanged) {
      const version = new Version(
        buildVersionSnapshot({
          documentId: document._id,
          userId,
          previousContent,
          previousTitle,
          versionNumber:
            (await Version.countDocuments({ documentId: document._id })) + 1,
          updatedContent: content ?? previousContent,
          changeDescription: describeVersionChange({
            titleChanged,
            contentChanged,
            previousTitle,
            previousContent,
          }),
        }),
      );
      await version.save();
    }

    await document.save();
    await document.populate("ownerId", "name email");
    await document.populate("collaborators.userId", "name email");

    const io = getSocket();
    if (io && document._id) {
      io.to(`doc_${document._id}`).emit("remote_content_change", {
        documentId: document._id.toString(),
        content: document.content,
        userId,
      });
    }

    res.json(document);
  } catch (error) {
    console.error("[Update Document Error]:", error);
    res.status(500).json({ error: "Failed to update document" });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Check permission
    if (document.ownerId.toString() !== userId) {
      return res.status(403).json({ error: "Only owner can delete" });
    }

    // Archive document instead of deleting
    document.isArchived = true;
    await document.save();

    res.json({ message: "Document archived" });
  } catch (error) {
    console.error("[Delete Document Error]:", error);
    res.status(500).json({ error: "Failed to delete document" });
  }
};

// Share document
export const shareDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, permission = "edit" } = req.body;
    const userId = req.user.userId;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.ownerId.toString() !== userId) {
      return res.status(403).json({ error: "Only owner can share" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already collaborator
    const exists = document.collaborators.some(
      (c) => c.userId.toString() === user._id.toString(),
    );
    if (exists) {
      return res.status(400).json({ error: "User already has access" });
    }

    document.collaborators.push({
      userId: user._id,
      permission,
    });

    await document.save();
    await document.populate("collaborators.userId", "name email");

    // Broadcast collaborator added event
    const io = getSocket();
    if (io) {
      // Notify users in document room
      io.to(`doc_${id}`).emit("collaborator_added", {
        documentId: id,
        collaborators: document.collaborators,
      });
      // Notify new collaborator to refresh dashboard
      io.to(`user_${user._id}_updates`).emit("documents:updated", {
        message: "You have been added to a new document",
      });
    }

    res.json(document);
  } catch (error) {
    console.error("[Share Document Error]:", error);
    res.status(500).json({ error: "Failed to share document" });
  }
};

// Remove collaborator
export const removeCollaborator = async (req, res) => {
  try {
    const { id, collaboratorId } = req.params;
    const userId = req.user.userId;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.ownerId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only owner can remove collaborators" });
    }

    document.collaborators = document.collaborators.filter(
      (c) => c.userId.toString() !== collaboratorId,
    );

    await document.save();
    await document.populate("collaborators.userId", "name email");

    // Broadcast collaborator removed event
    const io = getSocket();
    if (io) {
      // Notify users in document room
      io.to(`doc_${id}`).emit("collaborator_removed", {
        documentId: id,
        collaborators: document.collaborators,
      });
      // Notify removed collaborator to refresh dashboard
      io.to(`user_${collaboratorId}_updates`).emit("documents:updated", {
        message: "You have been removed from a document",
      });
    }

    res.json(document);
  } catch (error) {
    console.error("[Remove Collaborator Error]:", error);
    res.status(500).json({ error: "Failed to remove collaborator" });
  }
};
