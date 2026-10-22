// Cloudflare Worker: приймає заявку з форми сайту і пересилає її в Telegram.
// Токен бота та chat_id зберігаються як секрети Cloudflare (BOT_TOKEN, CHAT_ID), а не в коді сайту.

const ALLOWED_ORIGIN = 'https://polishchuksite67.github.io';

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
};

function reply(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

function clean(value, max) {
  return String(value ?? '').trim().slice(0, max);
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return reply(405, { ok: false });

    let data;
    try {
      data = await request.json();
    } catch {
      return reply(400, { ok: false });
    }

    const name = clean(data.name, 80);
    const age = clean(data.child_age, 3);
    const phone = clean(data.phone, 20);
    const group = clean(data.group, 40);

    if (!name || !age || !/^\+?[\d\s()-]{9,20}$/.test(phone)) return reply(400, { ok: false });

    const text = [
      '🏀 Нова заявка на пробне тренування',
      '',
      `Ім’я: ${name}`,
      `Вік дитини: ${age}`,
      `Телефон: ${phone}`,
      `Група: ${group || 'не вказано'}`,
    ].join('\n');

    const tg = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text }),
    });

    return tg.ok ? reply(200, { ok: true }) : reply(502, { ok: false });
  },
};
