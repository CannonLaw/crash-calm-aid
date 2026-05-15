import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const appOrigin = Deno.env.get("APP_ORIGIN");
const corsHeaders = {
  "Access-Control-Allow-Origin": appOrigin ?? "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Vary": "Origin",
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PDF_BYTES = 5 * 1024 * 1024;
const LEAD_MAX_AGE_MS = 10 * 60 * 1000;

interface RequestBody {
  to?: string;
  pdf_base64?: string;
  filename?: string;
  lead_id?: string;
}

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

// Base64-decoded size estimate without full decode. A base64 string of length N
// represents ~(N * 3 / 4) bytes; close enough for a size guard.
const estimateDecodedSize = (b64: string): number => Math.floor((b64.length * 3) / 4);

// Verify the first 5 decoded bytes are "%PDF-". Decoding a small prefix is
// enough to confirm the magic bytes without decoding multi-megabyte input.
const looksLikePdf = (b64: string): boolean => {
  try {
    const prefix = b64.slice(0, 12);
    const decoded = atob(prefix);
    return decoded.startsWith("%PDF-");
  } catch {
    return false;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("send-report-email: RESEND_API_KEY is not configured");
    return json({ error: "Email service is not configured" }, 503);
  }
  const fromEmail =
    Deno.env.get("RESEND_FROM_EMAIL") ??
    "Cannon Law Crash Genius <reports@cannonlaw.com>";

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const { to, pdf_base64, filename, lead_id } = body;

  if (!to || !pdf_base64 || !filename || !lead_id) {
    return json(
      { error: "Missing required fields: to, pdf_base64, filename, lead_id" },
      400
    );
  }
  if (!EMAIL_REGEX.test(to)) {
    return json({ error: "Invalid email format" }, 400);
  }
  if (!UUID_REGEX.test(lead_id)) {
    return json({ error: "Invalid lead_id" }, 400);
  }
  if (typeof filename !== "string" || filename.length > 128) {
    return json({ error: "Invalid filename" }, 400);
  }

  // Verify the lead exists, is recent, and the requested recipient matches
  // the email recorded on the lead. Without this gate, anyone with the
  // public anon key could send arbitrary emails from this domain.
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, email, created_at, capture_channel")
    .eq("id", lead_id)
    .single();

  if (leadError || !lead) {
    return json({ error: "Lead not found" }, 404);
  }
  if (lead.capture_channel !== "email-screen-a") {
    return json({ error: "Lead is not eligible for email send" }, 403);
  }
  if (
    typeof lead.email !== "string" ||
    lead.email.toLowerCase() !== to.toLowerCase()
  ) {
    return json({ error: "Recipient does not match lead" }, 403);
  }
  const leadAge = Date.now() - new Date(lead.created_at).getTime();
  if (leadAge > LEAD_MAX_AGE_MS) {
    return json({ error: "Lead is too old for email send" }, 403);
  }

  if (estimateDecodedSize(pdf_base64) > MAX_PDF_BYTES) {
    return json({ error: "PDF exceeds size limit" }, 413);
  }
  if (!looksLikePdf(pdf_base64)) {
    return json({ error: "Attachment is not a valid PDF" }, 400);
  }

  const emailPayload = {
    from: fromEmail,
    to: [to],
    subject: "Your Crash Genius Accident Report",
    html: buildHtml(),
    text: buildText(),
    attachments: [
      {
        filename,
        content: pdf_base64,
      },
    ],
    tags: [{ name: "lead_id", value: lead_id }],
  };

  const resp = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  if (!resp.ok) {
    // Log full error server-side; return a generic message to the client to
    // avoid leaking internal detail.
    const respText = await resp.text();
    console.error("send-report-email: Resend rejected the request", {
      status: resp.status,
      body: respText,
    });
    return json({ error: "Email send failed" }, 502);
  }

  return json({ ok: true }, 200);
};

serve(handler);
