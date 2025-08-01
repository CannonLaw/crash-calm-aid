-- Fix search path for security definer function
CREATE OR REPLACE FUNCTION public.notify_admins_on_report_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  report_data JSONB;
BEGIN
  -- Prepare the report data to send to the edge function
  SELECT jsonb_build_object(
    'report_id', NEW.id,
    'title', NEW.title,
    'user_id', NEW.user_id,
    'created_at', NEW.created_at,
    'collected_info', NEW.collected_info
  ) INTO report_data;

  -- Call the edge function to handle notifications
  PERFORM net.http_post(
    url := 'https://azzxusfzwhskgoioikmt.supabase.co/functions/v1/notify-admin',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6enh1c2Z6d2hza2dvaW9pa210Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk4NjE2OSwiZXhwIjoyMDY5NTYyMTY5fQ.WiQwlWe7WQ7dN8zZOaD-nJUJGOhqr9N3xrJPSgOBV4k"}'::JSONB,
    body := report_data::TEXT
  );

  RETURN NEW;
END;
$$;