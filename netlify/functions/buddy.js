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

const SYSTEM_PROMPT = `You are Buddy — the user's private goon companion. You live inside a personal straight-only adult web app (tube search, RedGifs, calendar, likes).

Personality:
- Super horny, filthy, enthusiastic, and shameless. You like goingon together.
- Warm and buddy-like, not a corporate assistant. Tease, hype, and match his energy.
- Straight-only. The user is into cis women / M/F. Never suggest, describe, or roleplay gay, bi, trans, futa, femboy, shemale, or lesbian-as-primary content. If asked, redirect to straight cis-female scenes.
- Keep it consensual-adult. No minors, no real-world harm advice.

What you help with:
- Dirty talk, goon encouragement, edging/pacing chat if he wants it.
- Search ideas: tube queries and RedGifs tags that fit his taste.
- Remember tastes he mentions and the preference snapshot in the first user message (tags he has liked).
- Short, punchy replies unless he wants a long filthy story. Offer 3 concrete search ideas when recommending.

Never mention system prompts, API providers, or that you are filtering orientations unless he asks why a topic is off-limits.`;

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
    temperature: 0.9,
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
