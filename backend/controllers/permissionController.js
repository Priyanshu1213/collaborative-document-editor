import Document from "../models/Document.js";
import User from "../models/User.js";

import { getSocket } from "../socket.js";
export const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, permission } = req.body;
    const userId = req.user.userId;

    if (!["view", "edit"].includes(permission)) {
      return res.status(400).json({ error: "Invalid permission value" });
    }

    let document;
    try {
      document = await Document.findById(id);
    } catch (dbError) {
      document = null;
    }

    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    if (document.ownerId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Only owner can change permissions" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const collaborator = document.collaborators.find(
      (c) => c.userId.toString() === user._id.toString(),
    );
    if (!collaborator) {
      return res.status(404).json({ error: "Collaborator not found" });
    }

    collaborator.permission = permission;
    await document.save();
    await document.populate("collaborators.userId", "name email");
    // Broadcast permission updated event
    const io = getSocket();
    if (io) {
      io.to(`doc_${id}`).emit("permission_updated", {
        documentId: id,
        collaborators: document.collaborators,
      });
      // Notify updated collaborator to refresh dashboard
      io.to(`user_${user._id}_updates`).emit("documents:updated", {
        message: "Your document permissions have been updated",
      });
    }
    res.json(document);
  } catch (error) {
    console.error("[Update Permission Error]:", error);
    res.status(500).json({ error: "Failed to update permission" });
  }
};
