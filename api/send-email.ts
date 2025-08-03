// INSTRUCTIONS FOR THE USER:
// 1. Sign up for a Resend account at https://resend.com
// 2. Create an API key in your Resend dashboard.
// 3. Add the API key as a secret in your Supabase project:
//    - Go to your Supabase project > Settings > Secrets
//    - Add a new secret named `RESEND_API_KEY` with your Resend API key as the value.
// 4. Update the 'from' address in the `resend.emails.send` call below to an email
//    address that you have verified with Resend.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'resend';

// NOTE: The RESEND_API_KEY should be set in your Supabase project's secrets.
const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { to, subject, html, attachment } = await req.json();

    if (!to || !subject || !html || !attachment) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Replace with your "from" address
      to: [to],
      subject: subject,
      html: html,
      attachments: [
        {
          filename: 'etat-des-lieux.pdf',
          content: attachment,
          encoding: 'base64',
        },
      ],
    });

    if (error) {
      console.error({ error });
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(String(err?.message ?? err), { status: 500 });
  }
});
