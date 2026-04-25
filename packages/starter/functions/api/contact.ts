interface Env {
  RESEND_API_KEY: string;
  CONTACT_TO_EMAIL: string;
  CONTACT_FROM_EMAIL: string;
}

interface ContactPayload {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  website?: string;
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let payload: ContactPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { name = '', email = '', subject = '', message = '', website = '' } = payload;

  if (website.trim().length > 0) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!name.trim() || !email.trim() || !message.trim()) {
    return new Response(JSON.stringify({ error: '必須項目が未入力です' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!isEmail(email)) {
    return new Response(JSON.stringify({ error: 'メールアドレスの形式が不正です' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (message.length > 5000) {
    return new Response(JSON.stringify({ error: '本文が長すぎます' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.RESEND_API_KEY || !env.CONTACT_TO_EMAIL || !env.CONTACT_FROM_EMAIL) {
    return new Response(JSON.stringify({ error: 'メール設定が未構成です' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const html = `
    <h2>お問い合わせがありました</h2>
    <p><strong>お名前:</strong> ${escapeHtml(name)}</p>
    <p><strong>メール:</strong> ${escapeHtml(email)}</p>
    <p><strong>件名:</strong> ${escapeHtml(subject || '(なし)')}</p>
    <hr />
    <p style="white-space: pre-wrap">${escapeHtml(message)}</p>
  `;

  const resendRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.CONTACT_FROM_EMAIL,
      to: [env.CONTACT_TO_EMAIL],
      reply_to: email,
      subject: subject ? `[Contact] ${subject}` : '[Contact] お問い合わせ',
      html,
    }),
  });

  if (!resendRes.ok) {
    const detail = await resendRes.text();
    console.error('Resend error', resendRes.status, detail);
    return new Response(JSON.stringify({ error: '送信に失敗しました' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
