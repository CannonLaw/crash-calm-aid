-- Leads table for the marketing campaign (Priority 1 of CAMPAIGN.md).
-- Captures email/phone submissions from the post-report screens and
-- carries the original UTM/click-ID attribution so it can be joined back
-- to ad spend.
--
-- INSERT is intentionally NOT exposed to the anon role. All inserts go
-- through the `submit-lead` edge function, which adds rate limiting and
-- server-side input validation and fires the Zapier forward server-side.

CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Contact captures (at least one required)
  email text,
  phone text,
  capture_channel text NOT NULL,

  -- Correlates rows from the same browsing session so a user who
  -- submits email on Screen A and phone on the post-download screen
  -- joins back to one underlying person.
  session_id uuid NOT NULL,

  -- Whether the user actually reached/saw the report
  report_flow_completed boolean NOT NULL DEFAULT false,

  -- Attribution (entry-session UTMs, not point-of-capture URL).
  -- Length-capped to prevent abuse via giant UTM values in URL params.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  gclid text,
  fbclid text,
  entry_timestamp timestamptz,

  -- Lightweight context for downstream review without exposing full PII
  report_summary_snapshot jsonb,

  CONSTRAINT leads_has_contact CHECK (email IS NOT NULL OR phone IS NOT NULL),
  CONSTRAINT leads_capture_channel_valid CHECK (
    capture_channel IN ('email-screen-a', 'phone-post-download')
  ),
  CONSTRAINT leads_email_length CHECK (email IS NULL OR length(email) <= 256),
  CONSTRAINT leads_phone_length CHECK (phone IS NULL OR length(phone) <= 32),
  CONSTRAINT leads_utm_source_length CHECK (utm_source IS NULL OR length(utm_source) <= 256),
  CONSTRAINT leads_utm_medium_length CHECK (utm_medium IS NULL OR length(utm_medium) <= 256),
  CONSTRAINT leads_utm_campaign_length CHECK (utm_campaign IS NULL OR length(utm_campaign) <= 256),
  CONSTRAINT leads_utm_content_length CHECK (utm_content IS NULL OR length(utm_content) <= 256),
  CONSTRAINT leads_utm_term_length CHECK (utm_term IS NULL OR length(utm_term) <= 256),
  CONSTRAINT leads_gclid_length CHECK (gclid IS NULL OR length(gclid) <= 512),
  CONSTRAINT leads_fbclid_length CHECK (fbclid IS NULL OR length(fbclid) <= 512)
);

CREATE INDEX leads_session_id_idx ON public.leads (session_id);
CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX leads_utm_campaign_idx ON public.leads (utm_campaign);
CREATE INDEX leads_gclid_idx ON public.leads (gclid) WHERE gclid IS NOT NULL;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- No INSERT policy for anon/authenticated. Only the service role
-- (i.e., the `submit-lead` edge function) can insert.
-- No UPDATE or DELETE policies for non-service roles either.

CREATE POLICY "Admins can view leads"
  ON public.leads
  FOR SELECT
  USING (is_user_admin());

