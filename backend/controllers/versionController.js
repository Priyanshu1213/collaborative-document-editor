import Version from "../models/Version.js";
import Document from "../models/Document.js";

export const buildVersionSnapshot = ({
  documentId,
  userId,
  previousContent,
  previousTitle,
  versionNumber,
  updatedContent,
  changeDescription = "Version saved",
}) => ({
  documentId,
  content: previousContent ?? "",
  title: previousTitle ?? "",
  updatedContent: updatedContent ?? previousContent ?? "",
  createdBy: userId,
  changeDescription,
  versionNumber,
});

export const describeVersionChange = ({
  titleChanged,
  contentChanged,
  previousTitle,
  previousContent,
}) => {
  const titleSummary = titleChanged
    ? `Title changed from "${previousTitle || "Untitled Document"}"`
    : null;
  const contentSummary = contentChanged
    ? `Content updated (${(previousContent || "").trim().length > 0 ? "text modified" : "new content added"})`
    : null;

  if (titleSummary && contentSummary) {
    return `${titleSummary} and ${contentSummary.toLowerCase()}`;
  }

  return titleSummary || contentSummary || "Document updated";
};

// Get document versions
export const getVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Check document access
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId.toString() === userId;
    const isCollaborator = document.collaborators.some(
      (c) => c.userId.toString() === userId,
    );

    if (!isOwner && !isCollaborator && !document.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get versions
    const versions = await Version.find({ documentId: id })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json(versions);
  } catch (error) {
    console.error("[Get Versions Error]:", error);
    res.status(500).json({ error: "Failed to fetch versions" });
  }
};

// Get specific version
export const getVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.userId;

    // Check document access
    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId.toString() === userId;
    const isCollaborator = document.collaborators.some(
      (c) => c.userId.toString() === userId,
    );

    if (!isOwner && !isCollaborator && !document.isPublic) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Get version
    const version = await Version.findById(versionId).populate(
      "createdBy",
      "name email",
    );

    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    res.json(version);
  } catch (error) {
    console.error("[Get Version Error]:", error);
    res.status(500).json({ error: "Failed to fetch version" });
  }
};

// Save version (automatically called when updating document)
export const createVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title, changeDescription } = req.body;
    const userId = req.user.userId;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    const isOwner = document.ownerId.toString() === userId;
    const collaborator = document.collaborators.find(
      (c) => c.userId.toString() === userId,
    );
    const canEdit =
      isOwner || (collaborator && collaborator.permission === "edit");

    if (!canEdit) {
      return res.status(403).json({ error: "Permission denied" });
    }

    const versionCount = await Version.countDocuments({ documentId: id });
    const version = new Version({
      documentId: id,
      content: content ?? "",
      title: title || document.title || "",
      createdBy: userId,
      changeDescription: changeDescription || "Version saved",
      versionNumber: versionCount + 1,
    });

    await version.save();
    await version.populate("createdBy", "name email");

    res.status(201).json(version);
  } catch (error) {
    console.error("[Create Version Error]:", error);
    res.status(500).json({ error: "Failed to create version" });
  }
};

// Restore version
export const restoreVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.userId;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only owner can restore versions
    if (document.ownerId.toString() !== userId) {
      return res.status(403).json({ error: "Only owner can restore versions" });
    }

    const version = await Version.findById(versionId);
    if (!version) {
      return res.status(404).json({ error: "Version not found" });
    }

    // Save current version as new version
    const currentVersionCount = await Version.countDocuments({
      documentId: id,
    });
    const newVersion = new Version(
      buildVersionSnapshot({
        documentId: id,
        userId,
        previousContent: document.content,
        previousTitle: document.title,
        versionNumber: currentVersionCount + 1,
        changeDescription: `Restored from version ${version.versionNumber}`,
      }),
    );

    await newVersion.save();

    // Update document with restored content
    document.content = version.content;
    document.title = version.title;
    await document.save();

    res.json({
      message: "Version restored successfully",
      document,
      newVersion,
    });
  } catch (error) {
    console.error("[Restore Version Error]:", error);
    res.status(500).json({ error: "Failed to restore version" });
  }
};

// Delete version
export const deleteVersion = async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.userId;

    const document = await Document.findById(id);
    if (!document) {
      return res.status(404).json({ error: "Document not found" });
    }

    // Only owner can delete versions
    if (document.ownerId.toString() !== userId) {
      return res.status(403).json({ error: "Only owner can delete versions" });
    }

    await Version.findByIdAndDelete(versionId);

    res.json({ message: "Version deleted" });
  } catch (error) {
    console.error("[Delete Version Error]:", error);
    res.status(500).json({ error: "Failed to delete version" });
  }
};
