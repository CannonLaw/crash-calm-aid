-- Create admin_notifications table to store admin contact preferences
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  notification_types TEXT[] NOT NULL DEFAULT ARRAY['email'],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_notifications
CREATE POLICY "Users can view their own notification settings" 
ON public.admin_notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings" 
ON public.admin_notifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings" 
ON public.admin_notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to notify admins when a report is saved
CREATE OR REPLACE FUNCTION public.notify_admins_on_report_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger to call the notification function
CREATE TRIGGER trigger_notify_admins_on_report_completion
AFTER INSERT ON public.saved_reports
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_report_completion();

-- Add trigger for automatic timestamp updates on admin_notifications
CREATE TRIGGER update_admin_notifications_updated_at
BEFORE UPDATE ON public.admin_notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();