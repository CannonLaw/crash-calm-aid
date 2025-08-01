import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

interface NotificationRequest {
  notification_type: 'new_report' | 'new_user';
  report_id?: string;
  title?: string;
  user_id: string;
  created_at: string;
  collected_info?: any;
  user_email?: string;
  user_metadata?: any;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Admin notification triggered');
    
    const notificationData: NotificationRequest = await req.json();
    console.log('Report data received:', notificationData);

    // Get all active admin notifications
    const { data: adminNotifications, error: adminError } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('is_active', true);

    if (adminError) {
      console.error('Error fetching admin notifications:', adminError);
      throw adminError;
    }

    console.log(`Found ${adminNotifications?.length || 0} active admin notifications`);

    // If we have the Resend API key, send email notifications
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (resendApiKey && adminNotifications && adminNotifications.length > 0) {
      console.log('Sending email notifications...');
      
      // Import Resend dynamically
      const { Resend } = await import('npm:resend@4.0.0');
      const resend = new Resend(resendApiKey);

      // Send notification to each admin
      for (const admin of adminNotifications) {
        if (admin.notification_types.includes('email')) {
          try {
            let subject: string;
            let html: string;
            
            if (notificationData.notification_type === 'new_report') {
              // Extract user name from collected info
              const userName = notificationData.collected_info?.yourInfo?.name || 'Unknown User';
              const userContact = notificationData.collected_info?.yourInfo?.phone || 
                                notificationData.collected_info?.yourInfo?.email || 'No contact provided';
              
              subject = `New Crash Report: ${notificationData.title}`;
              html = `
                <h2>New Crash Report Submitted</h2>
                <p><strong>Report Title:</strong> ${notificationData.title}</p>
                <p><strong>Report ID:</strong> ${notificationData.report_id}</p>
                <p><strong>Submitted:</strong> ${new Date(notificationData.created_at).toLocaleString()}</p>
                
                <h3>User Information</h3>
                <p><strong>Name:</strong> ${userName}</p>
                <p><strong>Contact:</strong> ${userContact}</p>
                
                <h3>Accident Details</h3>
                <p><strong>Location:</strong> ${notificationData.collected_info?.location || 'Not specified'}</p>
                <p><strong>Date/Time:</strong> ${notificationData.collected_info?.datetime || 'Not specified'}</p>
                <p><strong>Injuries:</strong> ${notificationData.collected_info?.injuries || 'Not specified'}</p>
                <p><strong>Vehicle Count:</strong> ${notificationData.collected_info?.vehicleInfo?.length || 0}</p>
                <p><strong>Witness Count:</strong> ${notificationData.collected_info?.witnesses?.length || 0}</p>
                
                <p>Please log into the admin dashboard to review the full report details.</p>
                
                <hr>
                <p style="color: #666; font-size: 12px;">This is an automated notification from Crash Genius.</p>
              `;
            } else if (notificationData.notification_type === 'new_user') {
              // New user notification
              const userDisplayName = notificationData.user_metadata?.full_name || 
                                    notificationData.user_metadata?.name || 
                                    notificationData.user_email || 'New User';
              
              subject = `New User Registration: ${userDisplayName}`;
              html = `
                <h2>New User Account Created</h2>
                <p><strong>User Email:</strong> ${notificationData.user_email}</p>
                <p><strong>Registration Date:</strong> ${new Date(notificationData.created_at).toLocaleString()}</p>
                
                <h3>User Details</h3>
                <p><strong>Name:</strong> ${userDisplayName}</p>
                ${notificationData.user_metadata?.phone ? `<p><strong>Phone:</strong> ${notificationData.user_metadata.phone}</p>` : ''}
                
                <p>A new user has registered for Crash Genius. Please log into the admin dashboard to review the user details.</p>
                
                <hr>
                <p style="color: #666; font-size: 12px;">This is an automated notification from Crash Genius.</p>
              `;
            } else {
              // Fallback for unknown notification types
              subject = 'Crash Genius Admin Notification';
              html = `
                <h2>Admin Notification</h2>
                <p>A new notification was triggered but the type was not recognized.</p>
                <p><strong>Notification Type:</strong> ${notificationData.notification_type}</p>
                <p><strong>User ID:</strong> ${notificationData.user_id}</p>
                <p><strong>Date:</strong> ${new Date(notificationData.created_at).toLocaleString()}</p>
              `;
            }

            const emailResponse = await resend.emails.send({
              from: 'Crash Genius Alerts <alerts@resend.dev>',
              to: [admin.email],
              subject,
              html,
            });

            console.log(`Email sent to ${admin.email}:`, emailResponse);
          } catch (emailError) {
            console.error(`Failed to send email to ${admin.email}:`, emailError);
          }
        }
      }
    } else {
      console.log('No Resend API key configured or no active admin notifications');
    }

    // Log the notification attempt
    console.log('Admin notification process completed');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Admin notifications sent for ${notificationData.notification_type}`,
        notification_type: notificationData.notification_type,
        notified_admins: adminNotifications?.length || 0
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in notify-admin function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);