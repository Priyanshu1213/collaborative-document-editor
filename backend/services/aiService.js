// AI Service for document enhancement features
// Supports multiple AI providers (Gemini, OpenAI, etc.)

class AIService {
  constructor() {
    this.providers = {
      gemini: this.callGeminiAPI,
      openai: this.callOpenAIAPI,
    };
  }

  async summarize(text) {
    const prompt = `Provide a concise summary of the following text in 2-3 sentences:

${text}`;

    return this.callAI(prompt, 'summarize');
  }

  async rewrite(text, tone = 'professional') {
    const prompt = `Rewrite the following text in a ${tone} tone:

${text}`;

    return this.callAI(prompt, 'rewrite');
  }

  async fixGrammar(text) {
    const prompt = `Fix any grammar, spelling, and punctuation errors in the following text. Return only the corrected text:

${text}`;

    return this.callAI(prompt, 'grammar_fix');
  }

  async explainText(text) {
    const prompt = `Explain the following text in simple terms:

${text}`;

    return this.callAI(prompt, 'explain');
  }

  async callAI(prompt, feature) {
    try {
      const provider = process.env.AI_PROVIDER || 'gemini';

      if (provider === 'gemini') {
        return await this.callGeminiAPI(prompt);
      } else if (provider === 'openai') {
        return await this.callOpenAIAPI(prompt);
      } else {
        throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`[AI ${feature} Error]:`, error);
      throw new Error(`AI feature failed: ${error.message}`);
    }
  }

  async callGeminiAPI(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate response';

    return text;
  }

  async callOpenAIAPI(prompt) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Unable to generate response';

    return text;
  }
}

export const aiService = new AIService();
