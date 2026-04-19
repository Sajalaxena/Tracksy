const { Router } = require('express');

const router = Router();

/**
 * POST /api/chat
 * Proxies a message to the OpenAI Chat Completions API.
 * Body: { messages: [{ role, content }] }
 * Returns: { reply: string }
 *
 * Requires OPENAI_API_KEY in server/.env
 */
router.post('/', async (req, res) => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      error: 'OpenAI API key not configured. Add OPENAI_API_KEY to server/.env',
    });
  }

  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful habit-coaching assistant for "Tracksy" habit tracker app. ' +
              'Help users build better habits, stay consistent, understand their analytics, ' +
              'and answer questions about habit formation, productivity, and wellness. ' +
              'Keep responses concise and encouraging. Use bullet points when listing steps.',
          },
          ...messages,
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: err?.error?.message || 'OpenAI request failed',
      });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'No response.';
    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to reach OpenAI: ' + err.message });
  }
});

module.exports = router;
