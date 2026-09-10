/**
 * GET/PUT /api/vault — personal profile store keyed by a PIN.
 *
 * Not a real account system. A visitor without the PIN cannot read likes,
 * bookmarks, chats, or calendar data. Optional PROFILE_PIN (or SITE_PASSWORD)
 * rejects every other key so the site is a closed door.
 *
 * Header: X-Profile-Pin
 * Body (PUT): { prefs, chats, settings, updatedAt }
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, X-Profile-Pin, X-Search-Password',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8',
};

const MAX_BYTES = 1_500_000;
const FILE_STORE = path.join('/tmp', 'buddy-vault-store.json');

function json(statusCode, data) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(data),
  };
}

function normalizePin(raw) {
  return String(raw || '')
    .trim()
    .slice(0, 32);
}

function getPin(event) {
  const headers = event.headers || {};
  const header =
    headers['x-profile-pin'] ||
    headers['X-Profile-Pin'] ||
    headers['x-search-password'] ||
    '';
  if (header) return normalizePin(header);
  const qs = event.queryStringParameters || {};
  if (qs.pin) return normalizePin(qs.pin);
  if (event.body) {
    try {
      const body =
        typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      if (body && body.pin) return normalizePin(body.pin);
    } catch {
      /* ignore */
    }
  }
  return '';
}

function pinsEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) return false;
  if (!left.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function pinAllowed(pin, owner) {
  if (pin.length < 4) return false;
  const required = process.env.PROFILE_PIN;
  if (required) return pinsEqual(pin, required);
  if (owner && owner.hash) return pinsEqual(owner.hash, pinKey(pin));
  return true;
}

function pinKey(pin) {
  const salt = process.env.VAULT_SALT || 'buddy-vault-v1';
  return crypto.createHash('sha256').update(`${salt}\n${pin}`).digest('hex');
}

async function blobStore() {
  try {
    const { getStore } = require('@netlify/blobs');
    return getStore({ name: 'buddy-vault', consistency: 'strong' });
  } catch {
    return null;
  }
}

function readFileStore() {
  try {
    return JSON.parse(fs.readFileSync(FILE_STORE, 'utf8'));
  } catch {
    return {};
  }
}

async function vaultGet(key) {
  const store = await blobStore();
  if (store) {
    try {
      const data = await store.get(key, { type: 'json' });
      return data || null;
    } catch {
      return null;
    }
  }
  const all = readFileStore();
  return all[key] || null;
}

async function vaultSet(key, value) {
  const store = await blobStore();
  if (store) {
    await store.setJSON(key, value);
    return;
  }
  const all = readFileStore();
  all[key] = value;
  fs.writeFileSync(FILE_STORE, JSON.stringify(all));
}

function parseBody(event) {
  if (!event.body) return {};
  try {
    return typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch {
    return null;
  }
}

function sanitizePayload(input) {
  if (!input || typeof input !== 'object') return null;
  const prefs = input.prefs && typeof input.prefs === 'object' ? input.prefs : {};
  const chats = input.chats && typeof input.chats === 'object' ? input.chats : {};
  const settings =
    input.settings && typeof input.settings === 'object' ? input.settings : {};
  return {
    updatedAt: Number(input.updatedAt) || Date.now(),
    prefs,
    chats: {
      activeId: chats.activeId || null,
      chats: Array.isArray(chats.chats) ? chats.chats : [],
    },
    settings: {
      av_search_password: String(settings.av_search_password || ''),
      av_selected_sites: String(settings.av_selected_sites || ''),
      av_proxy_thumbs: String(settings.av_proxy_thumbs || ''),
      buddy_fy_hide_chips: String(settings.buddy_fy_hide_chips || ''),
    },
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'PUT') {
    return json(405, { error: 'Method not allowed' });
  }

  const pin = getPin(event);
  if (pin.length < 4) {
    return json(401, {
      error: 'Unauthorized',
      message: 'Wrong or missing profile key.',
    });
  }

  const owner = await vaultGet('buddy-owner');
  if (!pinAllowed(pin, owner)) {
    return json(401, {
      error: 'Unauthorized',
      message: 'Wrong or missing profile key.',
    });
  }

  const key = pinKey(pin);

  if (!owner || !owner.hash) {
    await vaultSet('buddy-owner', { hash: pinKey(pin), ts: Date.now() });
  }

  if (event.httpMethod === 'GET') {
    const data = await vaultGet(key);
    if (!data) return json(200, { empty: true, updatedAt: 0 });
    return json(200, { empty: false, ...data });
  }

  const parsed = parseBody(event);
  if (!parsed) return json(400, { error: 'Invalid JSON' });
  const payload = sanitizePayload(parsed);
  if (!payload) return json(400, { error: 'Invalid payload' });

  const encoded = JSON.stringify(payload);
  if (Buffer.byteLength(encoded, 'utf8') > MAX_BYTES) {
    return json(413, { error: 'Profile too large' });
  }

  await vaultSet(key, payload);
  return json(200, { ok: true, updatedAt: payload.updatedAt });
};
