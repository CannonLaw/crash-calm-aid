import posthog from 'posthog-js';
import { getUtms } from './utm';

let initialized = false;

export const initAnalytics = (): void => {
  if (initialized) return;
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;

  const host = import.meta.env.VITE_POSTHOG_HOST ?? 'https://us.i.posthog.com';

  posthog.init(key, {
    api_host: host,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    // localStorage-only — avoids first-party cookies that could trip cookie
    // consent rules in some jurisdictions. Trade-off: PostHog can't track
    // the same user across subdomains, which we don't need.
    persistence: 'localStorage',
  });

  initialized = true;
};

export type EventName =
  | 'app_entry'
  | 'step_1_safety_started'
  | 'step_2_emergency_started'
  | 'step_3_authorities_started'
  | 'step_4_information_started'
  | 'step_4_information_completed'
  | 'report_summary_viewed'
  | 'email_captured'
  | 'bypass_to_download'
  | 'report_downloaded'
  | 'phone_captured'
  | 'callback_skipped'
  | 'account_created'
  | 'share_email'
  | 'share_text';

export const trackEvent = (name: EventName, props: Record<string, unknown> = {}): void => {
  if (!initialized) return;
  const utms = getUtms();
  posthog.capture(name, { ...utms, ...props });
};

export const identifyUser = (userId: string, traits: Record<string, unknown> = {}): void => {
  if (!initialized) return;
  posthog.identify(userId, traits);
};

export const resetAnalyticsIdentity = (): void => {
  if (!initialized) return;
  posthog.reset();
};
