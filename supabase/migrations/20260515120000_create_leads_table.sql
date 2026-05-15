-- Leads table for the marketing campaign (Priority 1 of CAMPAIGN.md).
-- Captures email/phone submissions from the post-report screens and
-- carries the original UTM/click-ID attribution so it can be joined back
-- to ad spend.

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

  -- Attribution (entry-session UTMs, not point-of-capture URL)
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
  )
);

CREATE INDEX leads_session_id_idx ON public.leads (session_id);
CREATE INDEX leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX leads_utm_campaign_idx ON public.leads (utm_campaign);
CREATE INDEX leads_gclid_idx ON public.leads (gclid) WHERE gclid IS NOT NULL;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Anonymous and authenticated visitors can insert their own contact info.
-- No SELECT/UPDATE/DELETE policies exist for non-service roles, so only
-- the service role (admin dashboard, offline-conversion job) can read.
CREATE POLICY "Anyone can submit a lead"
  ON public.leads
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view leads"
  ON public.leads
  FOR SELECT
  USING (is_user_admin());
