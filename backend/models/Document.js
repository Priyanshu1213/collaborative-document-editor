import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      default: 'Untitled Document',
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      default: '',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        permission: {
          type: String,
          enum: ['view', 'edit', 'admin'],
          default: 'edit',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    tags: [String],
    isPublic: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
documentSchema.index({ ownerId: 1 });
documentSchema.index({ 'collaborators.userId': 1 });
documentSchema.index({ createdAt: -1 });

const Document = mongoose.model('Document', documentSchema);
export default Document;
