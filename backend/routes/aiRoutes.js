import express from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  summarize,
  rewrite,
  fixGrammar,
  explain,
  generate,
  healthCheck,
} from '../controllers/aiController.js';

const router = express.Router();

// Health check (no auth required)
router.get('/health', healthCheck);

// All AI features require authentication
router.use(authenticate);

router.post('/summarize', summarize);
router.post('/rewrite', rewrite);
router.post('/grammar-fix', fixGrammar);
router.post('/explain', explain);
router.post('/generate', generate);

export default router;
