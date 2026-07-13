/* global Buffer */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import crypto from 'node:crypto'

let cachedCookie = '';

async function fetchWithBypass(url, method = 'GET', body = null, clientHeaders = {}) {
  const headers = {
    'User-Agent': clientHeaders['user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': clientHeaders['accept'] || '*/*',
    'Accept-Language': clientHeaders['accept-language'] || 'en-US,en;q=0.9',
  };

  if (clientHeaders['authorization']) {
    headers['Authorization'] = clientHeaders['authorization'];
  }

  let clientCookie = clientHeaders['cookie'] || '';
  if (cachedCookie) {
    if (clientCookie) {
      if (!clientCookie.includes('__test=')) {
        clientCookie += `; __test=${cachedCookie}`;
      }
    } else {
      clientCookie = `__test=${cachedCookie}`;
    }
  }
  if (clientCookie) {
    headers['Cookie'] = clientCookie;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  const fetchOptions = { method, headers, signal: controller.signal };
  if (body) {
    fetchOptions.body = body;
    headers['Content-Type'] = clientHeaders['content-type'] || 'application/json';
  }

  let response;
  try {
    response = await fetch(url, fetchOptions);
  } finally {
    clearTimeout(timeoutId);
  }
  let responseText = await response.text();

  if (responseText.includes('toNumbers') && responseText.includes('slowAES.decrypt')) {
    console.log('[Bypass] Security challenge detected. Decrypting cookie...');
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
      console.log(`[Bypass] Automatically solved cookie: __test=${cachedCookie}`);

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

// https://vite.dev/config/
export default defineConfig({
  server: {
    watch: {
      ignored: []
    }
  },
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'api-bypass-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url.startsWith('/api')) {
            let reqBody = null;
            if (req.method === 'POST' || req.method === 'PUT') {
              reqBody = await new Promise((resolve) => {
                let bodyStr = '';
                req.on('data', chunk => bodyStr += chunk);
                req.on('end', () => resolve(bodyStr));
              });
            }

            try {
              const targetUrl = `https://restroadmin.free.nf${req.url}`;
              console.log(`[Proxy] Request: ${req.method} ${req.url} -> Routing to ${targetUrl}`);
              let result;
              try {
                result = await fetchWithBypass(targetUrl, req.method, reqBody, req.headers);
              } catch (fetchErr) {
                console.error(`[Proxy Fetch Error] for ${targetUrl}:`, fetchErr.message);
                result = {
                  status: 404,
                  headers: new Map(),
                  body: ''
                };
              }

              res.statusCode = result.status;
              for (const [key, val] of result.headers.entries()) {
                const lowerKey = key.toLowerCase();
                if (
                  lowerKey !== 'transfer-encoding' &&
                  lowerKey !== 'content-encoding' &&
                  lowerKey !== 'content-length'
                ) {
                  res.setHeader(key, val);
                }
              }

              if (result.body.startsWith('{') || result.body.startsWith('[')) {
                res.setHeader('content-type', 'application/json');
              }
              res.end(result.body);
            } catch (err) {
              console.error('[Proxy Error]:', err.message);
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ]
})
