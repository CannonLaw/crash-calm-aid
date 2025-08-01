import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Bell, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';

interface AdminNotification {
  id: string;
  email: string;
  notification_types: string[];
  is_active: boolean;
}

const AdminNotificationSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newNotificationTypes, setNewNotificationTypes] = useState(['email']);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!adminLoading && !isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      navigate('/dashboard');
      return;
    }

    if (user && isAdmin) {
      fetchAdminNotifications();
    }
  }, [user, isAdmin, adminLoading, navigate]);

  const fetchAdminNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAdminNotifications(data || []);
    } catch (error: any) {
      console.error('Error fetching admin notifications:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNewNotification = async () => {
    if (!newEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          user_id: user?.id,
          email: newEmail.trim(),
          notification_types: newNotificationTypes,
          is_active: true
        });

      if (error) throw error;

      toast.success('Admin notification added successfully');
      setNewEmail('');
      setNewNotificationTypes(['email']);
      await fetchAdminNotifications();
    } catch (error: any) {
      console.error('Error saving admin notification:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Notification ${!isActive ? 'enabled' : 'disabled'}`);
      await fetchAdminNotifications();
    } catch (error: any) {
      console.error('Error updating notification:', error);
      toast.error('Failed to update notification');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Admin notification deleted');
      await fetchAdminNotifications();
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin settings...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // This will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold">Admin Notification Settings</h1>
          </div>
        </div>

        {/* Add New Admin Notification */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add Admin Notification</CardTitle>
            <CardDescription>
              Configure email addresses to receive notifications when new crash reports are submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@company.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Notification Types</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-notifications"
                  checked={newNotificationTypes.includes('email')}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setNewNotificationTypes([...newNotificationTypes, 'email']);
                    } else {
                      setNewNotificationTypes(newNotificationTypes.filter(type => type !== 'email'));
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="email-notifications">Email Notifications</Label>
              </div>
            </div>

            <Button 
              onClick={handleSaveNewNotification} 
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Add Notification'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Admin Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Current Admin Notifications</CardTitle>
            <CardDescription>
              Manage existing notification settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {adminNotifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No admin notifications configured yet. Add one above to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {adminNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={notification.is_active}
                        onCheckedChange={() => handleToggleActive(notification.id, notification.is_active)}
                        className="h-4 w-4"
                      />
                      <div>
                        <p className="font-medium">{notification.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Types: {notification.notification_types.join(', ')}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Email Setup Required</CardTitle>
            <CardDescription>
              To enable email notifications, you need to configure Resend in your Supabase project.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Setup Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Sign up for a free account at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">resend.com</a></li>
                <li>Create an API key in your Resend dashboard</li>
                <li>Add the RESEND_API_KEY secret to your Supabase project</li>
                <li>Test by creating a new crash report</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotificationSettings;
