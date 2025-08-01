-- Update the handle_new_user function to also notify admins of new user registrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Insert into profiles as before
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  
  -- Notify admins of new user registration
  PERFORM net.http_post(
    url := 'https://azzxusfzwhskgoioikmt.supabase.co/functions/v1/notify-admin',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6enh1c2Z6d2hza2dvaW9pa210Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk4NjE2OSwiZXhwIjoyMDY5NTYyMTY5fQ.Z85zY_qlKmL_DFoYUaDLh7j7k0G-2ew9DuQwCwGAuKU"}'::jsonb,
    body := json_build_object(
      'notification_type', 'new_user',
      'user_id', NEW.id::text,
      'user_email', NEW.email,
      'created_at', NEW.created_at::text,
      'user_metadata', NEW.raw_user_meta_data
    )::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Create function to notify admins when new reports are saved
CREATE OR REPLACE FUNCTION public.notify_admin_new_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Notify admins of new crash report
  PERFORM net.http_post(
    url := 'https://azzxusfzwhskgoioikmt.supabase.co/functions/v1/notify-admin',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6enh1c2Z6d2hza2dvaW9pa210Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk4NjE2OSwiZXhwIjoyMDY5NTYyMTY5fQ.Z85zY_qlKmL_DFoYUaDLh7j7k0G-2ew9DuQwCwGAuKU"}'::jsonb,
    body := json_build_object(
      'notification_type', 'new_report',
      'report_id', NEW.id::text,
      'title', NEW.title,
      'user_id', NEW.user_id::text,
      'created_at', NEW.created_at::text,
      'collected_info', NEW.collected_info
    )::jsonb
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new reports
CREATE TRIGGER on_report_created
  AFTER INSERT ON public.saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_report();

-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;