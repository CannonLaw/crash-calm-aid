import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Settings, Download, Search, FileText, Users, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SavedReport {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  pdf_url?: string;
  collected_info: any;
}

interface ProfileData {
  user_id: string;
  email: string;
}

interface ReportWithProfile extends SavedReport {
  userEmail?: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReportWithProfile[]>([]);
  const [filteredReports, setFilteredReports] = useState<ReportWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
      fetchAllReports();
    }
  }, [user, isAdmin, adminLoading, navigate]);

  useEffect(() => {
    // Filter reports based on search term
    if (!searchTerm) {
      setFilteredReports(reports);
    } else {
      const filtered = reports.filter(report => {
        const userName = getUserName(report);
        const userEmail = report.userEmail || '';
        const location = report.collected_info?.accidentDetails?.location || '';
        const reportTitle = report.title;
        
        return (
          userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reportTitle.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredReports(filtered);
    }
  }, [searchTerm, reports]);

  const fetchAllReports = async () => {
    try {
      // Fetch all reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('saved_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch all profiles to match with user_ids
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, email');

      if (profilesError) throw profilesError;

      // Create lookup map for user emails
      const userEmailMap = new Map<string, string>();
      profilesData?.forEach((profile: ProfileData) => {
        userEmailMap.set(profile.user_id, profile.email);
      });

      // Combine reports with user emails
      const reportsWithEmails: ReportWithProfile[] = (reportsData || []).map(report => ({
        ...report,
        userEmail: userEmailMap.get(report.user_id)
      }));

      setReports(reportsWithEmails);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (report: ReportWithProfile) => {
    const userInfo = report.collected_info?.userInfo;
    if (userInfo?.name) return userInfo.name;
    if (userInfo?.firstName && userInfo?.lastName) {
      return `${userInfo.firstName} ${userInfo.lastName}`;
    }
    return report.userEmail || 'Unknown User';
  };

  const getUserContact = (report: ReportWithProfile) => {
    const userInfo = report.collected_info?.userInfo;
    const contacts = [];
    
    if (userInfo?.phone) contacts.push(userInfo.phone);
    if (userInfo?.email) contacts.push(userInfo.email);
    if (report.userEmail && !contacts.includes(report.userEmail)) {
      contacts.push(report.userEmail);
    }
    
    return contacts.join(', ') || 'No contact info';
  };

  const getAccidentLocation = (report: ReportWithProfile) => {
    return report.collected_info?.accidentDetails?.location || 'Not specified';
  };

  const handleDownloadReport = async (report: ReportWithProfile) => {
    if (!report.pdf_url) {
      toast.error('PDF not available for this report');
      return;
    }

    try {
      const response = await fetch(report.pdf_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  if (adminLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // This will redirect in useEffect
  }

  const totalReports = reports.length;
  const reportsWithPDF = reports.filter(r => r.pdf_url).length;
  const recentReports = reports.filter(r => {
    const reportDate = new Date(r.created_at);
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    return reportDate > oneDayAgo;
  }).length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Manage crash reports and system settings
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/settings')}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Notification Settings
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalReports}</div>
              <p className="text-xs text-muted-foreground">
                {reportsWithPDF} with PDF generated
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Reports</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{recentReports}</div>
              <p className="text-xs text-muted-foreground">
                Created in the last 24 hours
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(reports.map(r => r.user_id)).size}
              </div>
              <p className="text-xs text-muted-foreground">
                Unique users with reports
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>All Crash Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by user name, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Reports Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Date</TableHead>
                    <TableHead>User Name</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm ? 'No reports found matching your search.' : 'No reports found.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {format(new Date(report.created_at), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(report.created_at), 'h:mm a')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{getUserName(report)}</div>
                          <div className="text-sm text-muted-foreground">{report.title}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{getUserContact(report)}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{getAccidentLocation(report)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={report.pdf_url ? "default" : "secondary"}>
                            {report.pdf_url ? "PDF Ready" : "Processing"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {report.pdf_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadReport(report)}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;