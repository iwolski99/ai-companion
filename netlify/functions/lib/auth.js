/**
 * Optional password gate for personal deployments.
 * Set SITE_PASSWORD in Netlify env. Leave empty to disable.
 */

function getProvidedPassword(event) {
  const header =
    event.headers['x-search-password'] ||
    event.headers['X-Search-Password'] ||
    '';
  if (header) return String(header);

  const qs = event.queryStringParameters || {};
  if (qs.password) return String(qs.password);

  // Allow body password for POST
  if (event.body) {
    try {
      const body =
        typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      if (body && body.password) return String(body.password);
    } catch {
      /* ignore */
    }
  }
  return '';
}

/**
 * @param {object} event Netlify function event
 * @returns {{ ok: true } | { ok: false, statusCode: number, body: string }}
 */
function checkPassword(event) {
  const required = process.env.SITE_PASSWORD;
  if (!required) return { ok: true };

  const provided = getProvidedPassword(event);
  if (provided && provided === required) return { ok: true };

  return {
    ok: false,
    statusCode: 401,
    body: JSON.stringify({
      error: 'Unauthorized',
      message: 'Valid password required. Send X-Search-Password header or ?password=.',
    }),
  };
}

module.exports = { checkPassword, getProvidedPassword };
