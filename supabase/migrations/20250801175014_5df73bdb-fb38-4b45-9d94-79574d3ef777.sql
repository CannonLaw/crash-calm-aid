-- Remove the trigger that's causing the "net" schema errors
-- This will stop the auto-save errors but disable admin notifications
DROP TRIGGER IF EXISTS saved_reports_notify_admins ON public.saved_reports;

-- Also drop the function since it uses net.http_post which isn't available
DROP FUNCTION IF EXISTS public.notify_admins_on_report_completion();