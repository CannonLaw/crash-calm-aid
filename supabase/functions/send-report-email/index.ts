import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  to: string;
  pdf_base64: string;
  filename: string;
  lead_id?: string;
}

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const buildHtml = () => `
  <div style="font-family: Helvetica, Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
    <h2 style="color: #fe5200;">Your Crash Genius Accident Report</h2>
    <p>Your accident report is attached to this email as a PDF.</p>
    <p>This report is a record of what you entered in the Crash Genius app. Keep
    a copy for your insurance company and for your own records.</p>
    <p>The report also includes guidance for the days after your accident and a
    7-day symptom log you can fill in.</p>
    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
    <p style="font-size: 12px; color: #545454;">
      Crash Genius is a service provided by Cannon Law, a law firm based in Fort
      Collins, Colorado. No attorney-client relationship is formed through the
      use of this service. If you would like to discuss whether we are able to
      represent you on a no-win, no-fee basis, please visit
      <a href="https://www.cannonlaw.com" style="color: #fe5200;">cannonlaw.com</a>
      or call (970) 471-7170.
    </p>
  </div>
`;

const buildText = () => `
Your Crash Genius Accident Report

Your accident report is attached to this email as a PDF.

This report is a record of what you entered in the Crash Genius app. Keep a
copy for your insurance company and for your own records.

The report also includes guidance for the days after your accident and a
7-day symptom log you can fill in.

---

Crash Genius is a service provided by Cannon Law, a law firm based in Fort
Collins, Colorado. No attorney-client relationship is formed through the use
of this service. If you would like to discuss whether we are able to
represent you on a no-win, no-fee basis, please visit cannonlaw.com or call
(970) 471-7170.
`.trim();

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) {
    console.error('send-report-email: RESEND_API_KEY is not configured');
    return new Response(
      JSON.stringify({ error: 'Email service is not configured' }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const fromEmail =
    Deno.env.get('RESEND_FROM_EMAIL') ??
    'Cannon Law Crash Genius <reports@cannonlaw.com>';

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { to, pdf_base64, filename, lead_id } = body;

  if (!to || !pdf_base64 || !filename) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: to, pdf_base64, filename' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const emailPayload = {
    from: fromEmail,
    to: [to],
    subject: 'Your Crash Genius Accident Report',
    html: buildHtml(),
    text: buildText(),
    attachments: [
      {
        filename,
        content: pdf_base64,
      },
    ],
    tags: lead_id ? [{ name: 'lead_id', value: lead_id }] : undefined,
  };

  const resp = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  });

  const respText = await resp.text();

  if (!resp.ok) {
    console.error('send-report-email: Resend rejected the request', {
      status: resp.status,
      body: respText,
    });
    return new Response(
      JSON.stringify({ error: 'Email send failed', detail: respText }),
      {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(respText, {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

serve(handler);
