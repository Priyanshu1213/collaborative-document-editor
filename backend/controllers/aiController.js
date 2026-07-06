import { aiService } from '../services/aiService.js';

// Summarize document content
export const summarize = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    if (content.length < 100) {
      return res.status(400).json({ error: 'Content too short to summarize' });
    }

    const summary = await aiService.summarize(content);

    res.json({ summary });
  } catch (error) {
    console.error('[Summarize Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to summarize' });
  }
};

// Rewrite content in different tone
export const rewrite = async (req, res) => {
  try {
    const { content, tone = 'professional' } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const validTones = ['professional', 'casual', 'formal', 'creative', 'simple'];
    if (!validTones.includes(tone)) {
      return res.status(400).json({ error: `Invalid tone: ${validTones.join(', ')}` });
    }

    const rewritten = await aiService.rewrite(content, tone);

    res.json({ rewritten });
  } catch (error) {
    console.error('[Rewrite Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to rewrite' });
  }
};

// Fix grammar and spelling
export const fixGrammar = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const fixed = await aiService.fixGrammar(content);

    res.json({ fixed });
  } catch (error) {
    console.error('[Grammar Fix Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to fix grammar' });
  }
};

// Explain text in simpler terms
export const explain = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const explanation = await aiService.explainText(content);

    res.json({ explanation });
  } catch (error) {
    console.error('[Explain Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to explain' });
  }
};

// Generate new content from a prompt
export const generate = async (req, res) => {
  try {
    const { prompt, tone, format } = req.body;

    if (!prompt || prompt.trim().length < 3) {
      return res.status(400).json({ error: 'A prompt of at least 3 characters is required' });
    }

    const content = await aiService.generateContent(prompt.trim(), { tone, format });

    res.json({ content });
  } catch (error) {
    console.error('[Generate Error]:', error);
    res.status(500).json({ error: error.message || 'Failed to generate content' });
  }
};

// Health check for AI service
export const healthCheck = async (req, res) => {
  try {
    const provider = process.env.AI_PROVIDER || 'gemini';
    const hasApiKey = provider === 'gemini' ? !!process.env.GEMINI_API_KEY : !!process.env.OPENAI_API_KEY;

    res.json({
      status: hasApiKey ? 'ready' : 'not_configured',
      provider,
      message: hasApiKey ? 'AI service is ready' : 'AI service not configured',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check AI service' });
  }
};
