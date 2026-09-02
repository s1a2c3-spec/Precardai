// /api/generate.js
// Vercel serverless function — this is the ONLY place the Gemini API key
// is used. It never reaches the browser. Set GEMINI_API_KEY in Vercel's
// Project Settings -> Environment Variables (get a free key from
// aistudio.google.com), then redeploy.

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: 'Server is missing GEMINI_API_KEY. Add it in Vercel Project Settings -> Environment Variables, then redeploy.'
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  const {
    occasion = 'birthday',
    relation = 'a friend',
    tone = 'emotional',
    language = 'Hinglish'
  } = body || {};

  const prompt = `Write exactly 3 short, warm greeting-card messages for a ${occasion} card, meant for ${relation}. ` +
    `Tone: ${tone}. ` +
    `Language: write in ${language} — if Hinglish, use Roman/English letters with natural Hindi words mixed in (not Devanagari script); ` +
    `if Hindi, use Devanagari script; if English, use plain English. ` +
    `Keep each message under 25 words, warm and suitable to print on a card. No quotation marks, no numbering, no emojis.`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: 'object',
              properties: {
                suggestions: {
                  type: 'array',
                  items: { type: 'string' },
                  minItems: 3,
                  maxItems: 3
                }
              },
              required: ['suggestions']
            }
          }
        })
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      res.status(502).json({ error: 'Gemini API error', detail: errText.slice(0, 500) });
      return;
    }

    const data = await geminiRes.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      res.status(502).json({ error: 'No response from Gemini' });
      return;
    }

    const parsed = JSON.parse(rawText);
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];

    if (suggestions.length === 0) {
      res.status(502).json({ error: 'Gemini returned no suggestions' });
      return;
    }

    res.status(200).json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err).slice(0, 300) });
  }
};
