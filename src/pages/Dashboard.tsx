import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/Header';
import { Download, Share2, Calendar, FileText, LogOut, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface SavedReport {
  id: string;
  title: string;
  created_at: string;
  pdf_url?: string;
  collected_info: any;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useIsAdmin();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchReports();
  }, [user, navigate]);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('saved_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (pdfUrl: string, title: string) => {
    if (!pdfUrl) return;
    
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  const handleShare = (pdfUrl: string, title: string) => {
    if (!pdfUrl) return;
    
    const subject = encodeURIComponent(`Crash Report: ${title}`);
    const body = encodeURIComponent(
      `Please find attached my crash report.\n\nReport: ${pdfUrl}\n\nGenerated using Crash Genius`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Reports</h1>
            <p className="text-muted-foreground mt-2">
              Access and manage your saved crash reports
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => navigate('/')} className="bg-primary hover:bg-primary/90">
              Start a New Report
            </Button>
            {isAdmin && (
              <Button variant="outline" onClick={() => navigate('/admin')}>
                Admin Dashboard
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to App
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {user && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                <strong>Email:</strong> {user.email}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {reports.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't saved any crash reports yet.
                </p>
                <Button onClick={() => navigate('/')}>
                  Create Your First Report
                </Button>
              </CardContent>
            </Card>
          ) : (
            reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{report.title}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(report.created_at), 'MMM dd, yyyy at h:mm a')}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">
                      {report.pdf_url ? 'Ready' : 'Processing'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.collected_info && (
                      <div>
                        <h4 className="font-medium mb-2">Report Summary</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {report.collected_info.accidentDetails?.date && (
                            <p><strong>Date:</strong> {report.collected_info.accidentDetails.date}</p>
                          )}
                          {report.collected_info.accidentDetails?.location && (
                            <p><strong>Location:</strong> {report.collected_info.accidentDetails.location}</p>
                          )}
                          {report.collected_info.photos && (
                            <p><strong>Photos:</strong> {report.collected_info.photos.length} attached</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex gap-2">
                      {report.pdf_url && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(report.pdf_url!, report.title)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleShare(report.pdf_url!, report.title)}
                          >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share via Email
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;