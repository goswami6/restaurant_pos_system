import crypto from 'crypto';

let cachedCookie = '';

async function fetchWithBypass(url, method = 'GET', body = null, clientHeaders = {}) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': clientHeaders['accept'] || '*/*',
    'Accept-Language': clientHeaders['accept-language'] || 'en-US,en;q=0.9',
  };

  if (cachedCookie) {
    headers['Cookie'] = `__test=${cachedCookie}`;
  }

  const fetchOptions = { method, headers };
  if (body) {
    fetchOptions.body = body;
    headers['Content-Type'] = clientHeaders['content-type'] || 'application/json';
  }

  let response = await fetch(url, fetchOptions);
  let responseText = await response.text();

  if (responseText.includes('toNumbers') && responseText.includes('slowAES.decrypt')) {
    console.log('[Bypass] Security challenge detected on Vercel backend. Decrypting cookie...');
    const matches = [...responseText.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
    if (matches.length >= 3) {
      const keyHex = matches[0][1];
      const ivHex = matches[1][1];
      const ciphertextHex = matches[2][1];

      const key = Buffer.from(keyHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const ciphertext = Buffer.from(ciphertextHex, 'hex');

      const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
      decipher.setAutoPadding(false);
      let decrypted = decipher.update(ciphertext);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      cachedCookie = decrypted.toString('hex');
      headers['Cookie'] = `__test=${cachedCookie}`;
      response = await fetch(url, { method, headers, body });
      responseText = await response.text();
    }
  }

  return {
    status: response.status,
    headers: response.headers,
    body: responseText
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const apiPath = req.url.replace(/^\/api/, '');
    const targetUrl = `https://restroadmin.free.nf/api${apiPath}`;

    let reqBody = null;
    if (req.method === 'POST' || req.method === 'PUT') {
      reqBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const result = await fetchWithBypass(targetUrl, req.method || 'GET', reqBody, req.headers);

    res.status(result.status);
    if (result.body.startsWith('{') || result.body.startsWith('[')) {
      res.setHeader('Content-Type', 'application/json');
    }
    return res.send(result.body);
  } catch (err) {
    console.error('[Vercel Proxy Error]:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
