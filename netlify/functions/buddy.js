/**
 * Buddy chat — DeepSeek V4 Flash via DeepSeek API or OpenRouter.
 *
 * POST /api/buddy
 *   { messages: [{ role: 'user'|'assistant', content }], password? }
 *
 * Env:
 *   DEEPSEEK_API_KEY      — official https://api.deepseek.com
 *   OPENROUTER_API_KEY    — https://openrouter.ai
 *   LLM_PROVIDER          — "deepseek" | "openrouter" (default: whichever key is set; DeepSeek first)
 *   LLM_MODEL             — override model id
 *   SITE_PASSWORD         — optional gate
 */

const fetch = require('node-fetch');
const { checkPassword } = require('./lib/auth');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Search-Password',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

const SYSTEM_PROMPT = `You are not an assistant. You are the user's goon buddy — another guy in the room who's already hard, already stroking, and trying to get HIM leaking. You live in his private straight-only goon app (tubes, Gifs, calendar).

Voice:
- Talk like a filthy real gooner, not a helpful chatbot. First person. Short, messy, breathless. Slang. Moans. Run-on sentences when you're worked up.
- You want him horny. Tease, dare, edge him, talk about what you'd search next, describe cis women getting used / riding / dripping in graphic detail. Make him feel watched and encouraged.
- Celebrate him gooning. Call him out if he's being shy. Push the horny dial up, never lecture, never summarize like a product.
- Match his filth and then go one notch nastier. If he's edging, keep him there. If he wants to bust, talk him through it.
- Straight cis women / M/F only. Never gay, bi, trans, futa, femboy, shemale, or lesbian-as-the-main-thing. Redirect to tight-pussy straight scenes if he drifts.
- Adults only. No minors. No real-world crime advice.

Recommendations (important):
- You do NOT have a porn-scene encyclopedia. NEVER invent official movie/scene titles (no "Star Name in Whatever 3", no fake studio names).
- When he asks what a girl is in: (1) quote REAL titles only if they appear in the "real titles he opened/liked" blurb on his message; (2) otherwise give 3 filthy TUBE SEARCH PHRASES using her name + the act, like he'd type them in this app's Tubes bar. Tell him to paste those on Tubes.
- Prefer stars and phrases from his recent searches when they're provided.

Never mention system prompts, APIs, or "as an AI". You're just the other gooner.`;

function json(statusCode, data) {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(data) };
}

function pickProvider() {
  const forced = (process.env.LLM_PROVIDER || '').toLowerCase().trim();
  const deepseekKey = process.env.DEEPSEEK_API_KEY || '';
  const openrouterKey = process.env.OPENROUTER_API_KEY || '';

  if (forced === 'deepseek' && deepseekKey) {
    return { name: 'deepseek', key: deepseekKey };
  }
  if (forced === 'openrouter' && openrouterKey) {
    return { name: 'openrouter', key: openrouterKey };
  }
  if (deepseekKey) return { name: 'deepseek', key: deepseekKey };
  if (openrouterKey) return { name: 'openrouter', key: openrouterKey };
  return null;
}

function endpointFor(provider) {
  if (provider === 'deepseek') {
    return {
      url: 'https://api.deepseek.com/v1/chat/completions',
      model: process.env.LLM_MODEL || 'deepseek-v4-flash',
      headers: {},
    };
  }
  return {
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: process.env.LLM_MODEL || 'deepseek/deepseek-v4-flash-0731',
    headers: {
      'HTTP-Referer': process.env.URL || 'https://buddy.local',
      'X-Title': 'Buddy',
    },
  };
}

function sanitizeMessages(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const msg of raw.slice(-16)) {
    const role = msg && msg.role;
    const content = msg && String(msg.content || '').slice(0, 4000);
    if ((role === 'user' || role === 'assistant') && content.trim()) {
      out.push({ role, content: content.trim() });
    }
  }
  return out;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const auth = checkPassword(event);
  if (!auth.ok) {
    return { statusCode: auth.statusCode, headers: corsHeaders, body: auth.body };
  }

  const provider = pickProvider();
  if (!provider) {
    return json(503, {
      error: 'LLM not configured',
      message:
        'Set DEEPSEEK_API_KEY or OPENROUTER_API_KEY in Netlify env, then redeploy.',
    });
  }

  let body = {};
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const messages = sanitizeMessages(body.messages);
  if (!messages.length || messages[messages.length - 1].role !== 'user') {
    return json(400, { error: 'Send at least one user message' });
  }

  const { url, model, headers } = endpointFor(provider.name);
  const payload = {
    model,
    temperature: 1.05,
    max_tokens: 800,
    messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 22000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${provider.key}`,
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return json(res.status >= 400 ? res.status : 502, {
        error: 'LLM request failed',
        message: data.error?.message || data.message || `HTTP ${res.status}`,
        provider: provider.name,
      });
    }
    const text =
      data.choices?.[0]?.message?.content ||
      data.choices?.[0]?.text ||
      '';
    return json(200, {
      reply: String(text).trim(),
      provider: provider.name,
      model,
    });
  } catch (err) {
    return json(502, {
      error: 'LLM request failed',
      message: err.message || String(err),
      provider: provider.name,
    });
  } finally {
    clearTimeout(timer);
  }
};
