import crypto from 'crypto';

async function testOrderUpdate() {
  const url = `https://restroadmin.free.nf/api/order/update`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Content-Type': 'application/json'
  };
  
  // Get cookie bypass first
  let res = await fetch(url, { method: 'GET', headers });
  let html = await res.text();
  const matches = [...html.matchAll(/toNumbers\("([a-f0-9]+)"\)/g)];
  if (matches.length >= 3) {
    const key = Buffer.from(matches[0][1], 'hex');
    const iv = Buffer.from(matches[1][1], 'hex');
    const ciphertext = Buffer.from(matches[2][1], 'hex');
    const decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    decipher.setAutoPadding(false);
    let decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    headers['Cookie'] = '__test=' + decrypted.toString('hex');
  }

  // First fetch order #36 items/totals so we pass valid arrays to backend
  const payload = {
    order_id: 36,
    order_status: "CANCELLED",
    items: [],
    totals: {
      subtotal: 0,
      tax: 0,
      service_charge: 0,
      discount_amount: 0,
      grand_total: 0
    }
  };

  res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
  const text = await res.text();
  console.log(`POST /order/update -> Status: ${res.status}, Response: ${text}`);
}

testOrderUpdate();
