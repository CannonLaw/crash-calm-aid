import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

// CORS: restrict to APP_ORIGIN when set; fall back to wildcard for local
// dev. In production, ALWAYS set APP_ORIGIN.
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

const VALID_CHANNELS = new Set(["email-screen-a", "phone-post-download"]);
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FIELD_CAPS: Record<string, number> = {
  utm_source: 256,
  utm_medium: 256,
  utm_campaign: 256,
  utm_content: 256,
  utm_term: 256,
  gclid: 512,
  fbclid: 512,
  email: 256,
  phone: 32,
};

const truncate = (s: unknown, max: number): string | null => {
  if (typeof s !== "string" || s.length === 0) return null;
  return s.length > max ? s.slice(0, max) : s;
};

// In-memory per-IP rate limiter. Resets on cold start; effective only per
// isolate. Good enough as a first-line throttle; combined with the
// recent-lead check in send-report-email it makes the spam path unattractive.
// TODO: replace with a Supabase-backed counter for global enforcement.
interface RateState {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateState>();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 10;

const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || entry.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_MAX) return false;
  entry.count++;
  return true;
};

const clientIp = (req: Request): string => {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
};

interface RequestBody {
  email?: string;
  phone?: string;
  capture_channel?: string;
  session_id?: string;
  report_flow_completed?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  entry_timestamp?: string;
  report_summary_snapshot?: unknown;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const ip = clientIp(req);
  if (!checkRateLimit(ip)) {
    return json({ error: "Rate limit exceeded. Please try again later." }, 429);
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.capture_channel || !VALID_CHANNELS.has(body.capture_channel)) {
    return json({ error: "Invalid capture_channel" }, 400);
  }
  if (!body.session_id || !UUID_REGEX.test(body.session_id)) {
    return json({ error: "Invalid session_id" }, 400);
  }
  const email = truncate(body.email, FIELD_CAPS.email);
  const phone = truncate(body.phone, FIELD_CAPS.phone);
  if (!email && !phone) {
    return json({ error: "Email or phone required" }, 400);
  }
  if (email && !EMAIL_REGEX.test(email)) {
    return json({ error: "Invalid email format" }, 400);
  }

  const row = {
    email,
    phone,
    capture_channel: body.capture_channel,
    session_id: body.session_id,
    report_flow_completed: !!body.report_flow_completed,
    utm_source: truncate(body.utm_source, FIELD_CAPS.utm_source),
    utm_medium: truncate(body.utm_medium, FIELD_CAPS.utm_medium),
    utm_campaign: truncate(body.utm_campaign, FIELD_CAPS.utm_campaign),
    utm_content: truncate(body.utm_content, FIELD_CAPS.utm_content),
    utm_term: truncate(body.utm_term, FIELD_CAPS.utm_term),
    gclid: truncate(body.gclid, FIELD_CAPS.gclid),
    fbclid: truncate(body.fbclid, FIELD_CAPS.fbclid),
    entry_timestamp: body.entry_timestamp ?? null,
    report_summary_snapshot: body.report_summary_snapshot ?? null,
  };

  const { data, error } = await supabase
    .from("leads")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    console.error("submit-lead insert failed", error);
    return json({ error: "Insert failed" }, 500);
  }

  // Forward to Zapier server-side. URL is a function secret, not exposed
  // to the client bundle.
  const zapierUrl = Deno.env.get("ZAPIER_LEADS_WEBHOOK_URL");
  if (zapierUrl) {
    fetch(zapierUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: data.id,
        ...row,
        created_at: new Date().toISOString(),
        source_ip: ip,
      }),
    }).catch((err) => console.error("Zapier webhook failed", err));
  }

  return json({ ok: true, lead_id: data.id }, 200);
};

serve(handler);
