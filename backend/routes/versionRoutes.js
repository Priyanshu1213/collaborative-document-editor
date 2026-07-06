import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  getVersions,
  getVersion,
  createVersion,
  restoreVersion,
  deleteVersion,
} from '../controllers/versionController.js';

const router = express.Router({ mergeParams: true });

// All routes require authentication
router.use(authenticate);

// Version operations
router.get('/', getVersions);
router.post('/', createVersion);
router.get('/:versionId', getVersion);
router.post('/:versionId/restore', restoreVersion);
router.delete('/:versionId', deleteVersion);

export default router;
