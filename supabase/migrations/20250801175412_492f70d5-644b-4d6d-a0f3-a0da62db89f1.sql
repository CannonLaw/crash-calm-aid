-- First drop the trigger, then the function
DROP TRIGGER IF EXISTS trigger_notify_admins_on_report_completion ON public.saved_reports;
DROP FUNCTION IF EXISTS public.notify_admins_on_report_completion();