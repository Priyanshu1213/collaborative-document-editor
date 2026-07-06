import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    updatedContent: {
      type: String,
      default: "",
    },
    title: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    changeDescription: {
      type: String,
      default: "Version saved",
    },
    versionNumber: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
versionSchema.index({ documentId: 1, createdAt: -1 });

const Version = mongoose.model("Version", versionSchema);
export default Version;
