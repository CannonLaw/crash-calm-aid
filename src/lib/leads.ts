import { supabase } from '@/integrations/supabase/client';
import { getUtms } from './utm';

const SESSION_ID_KEY = 'cg_session_id';

export const getOrCreateSessionId = (): string => {
  try {
    const existing = sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
};

export type CaptureChannel = 'email-screen-a' | 'phone-post-download';

export interface SubmitLeadInput {
  email?: string;
  phone?: string;
  captureChannel: CaptureChannel;
  reportFlowCompleted: boolean;
  reportSummarySnapshot?: Record<string, unknown>;
}

export type SubmitLeadResult =
  | { ok: true; leadId: string }
  | { ok: false; error: string };

export const submitLead = async (
  input: SubmitLeadInput
): Promise<SubmitLeadResult> => {
  if (!input.email && !input.phone) {
    return { ok: false, error: 'Email or phone required' };
  }

  const utms = getUtms();
  const sessionId = getOrCreateSessionId();

  const payload = {
    email: input.email ?? null,
    phone: input.phone ?? null,
    capture_channel: input.captureChannel,
    session_id: sessionId,
    report_flow_completed: input.reportFlowCompleted,
    utm_source: utms.utm_source ?? null,
    utm_medium: utms.utm_medium ?? null,
    utm_campaign: utms.utm_campaign ?? null,
    utm_content: utms.utm_content ?? null,
    utm_term: utms.utm_term ?? null,
    gclid: utms.gclid ?? null,
    fbclid: utms.fbclid ?? null,
    entry_timestamp: utms.entry_timestamp ?? null,
    report_summary_snapshot: input.reportSummarySnapshot ?? null,
  };

  const { data, error } = await supabase.functions.invoke('submit-lead', {
    body: payload,
  });

  if (error) {
    console.error('submit-lead invocation failed', error);
    return { ok: false, error: error.message };
  }
  const result = data as { ok?: boolean; lead_id?: string; error?: string } | null;
  if (!result || !result.ok || !result.lead_id) {
    return { ok: false, error: result?.error ?? 'Submit failed' };
  }
  return { ok: true, leadId: result.lead_id };
};

export const sendReportByEmail = async (
  to: string,
  pdfBlob: Blob,
  filename: string,
  leadId: string
): Promise<{ ok: boolean; error?: string }> => {
  const pdfBase64 = await blobToBase64(pdfBlob);
  const { data, error } = await supabase.functions.invoke('send-report-email', {
    body: {
      to,
      pdf_base64: pdfBase64,
      filename,
      lead_id: leadId,
    },
  });

  if (error) {
    console.error('send-report-email failed', error);
    return { ok: false, error: error.message };
  }
  if (data && (data as { error?: string }).error) {
    return { ok: false, error: (data as { error: string }).error };
  }
  return { ok: true };
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',', 2)[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
