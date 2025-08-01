import { useState, useEffect } from "react";
import { ProgressIndicator } from "@/components/CrashApp/ProgressIndicator";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  FileText, 
  Download, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  Clock,
  MapPin
} from "lucide-react";
import { jsPDF } from "jspdf";
import headerImage from "@/assets/crash-genius-header.png";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ReportGenerationProps {
  collectedInfo: any;
  onComplete: () => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

export const ReportGeneration = ({ collectedInfo, onComplete }: ReportGenerationProps) => {
  const currentDate = new Date().toLocaleDateString();
  const currentTime = new Date().toLocaleTimeString();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [generatedPDFBlob, setGeneratedPDFBlob] = useState<Blob | null>(null);
  const [pendingSave, setPendingSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-save report when user logs in and we have a generated PDF
  useEffect(() => {
    if (user && generatedPDFBlob && pendingSave) {
      saveReportToAccount();
      setPendingSave(false);
    }
  }, [user, generatedPDFBlob, pendingSave]);

  const generatePDF = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 10;
      
      // Add header image to first page
      const img = new Image();
      img.onload = async () => {
        try {
          // Add header image (scaled to fit page width)
          const imgWidth = pageWidth - 20; // 10mm margin on each side
          const imgHeight = (img.height / img.width) * imgWidth;
          pdf.addImage(headerImage, 'PNG', 10, 10, imgWidth, imgHeight);
          
          // Add report content
          let yPosition = imgHeight + 30;
          
          pdf.setFontSize(20);
          pdf.text('Car Accident Report', margin, yPosition);
          yPosition += 15;
          
          // Accident details section
          pdf.setFontSize(14);
          pdf.text('Accident Details', margin, yPosition);
          yPosition += 10;
          pdf.setFontSize(10);
          
          const accidentDateTime = collectedInfo?.accidentDetails?.dateTime 
            ? new Date(collectedInfo.accidentDetails.dateTime).toLocaleString()
            : `${currentDate} ${currentTime}`;
          pdf.text(`Date & Time: ${accidentDateTime}`, margin, yPosition);
          yPosition += 6;
          pdf.text(`Location: ${collectedInfo?.accidentDetails?.location || 'Not specified'}`, margin, yPosition);
          yPosition += 6;
          
          if (collectedInfo?.accidentDetails?.description) {
            yPosition += 3;
            pdf.text('Description:', margin, yPosition);
            yPosition += 6;
            const descriptionLines = pdf.splitTextToSize(collectedInfo.accidentDetails.description, pageWidth - 40);
            pdf.text(descriptionLines, margin + 5, yPosition);
            yPosition += descriptionLines.length * 6;
          }
          yPosition += 10;
          
          // Your information section
          pdf.setFontSize(14);
          pdf.text('Your Information', margin, yPosition);
          yPosition += 10;
          pdf.setFontSize(10);
          
          const userInfo = collectedInfo?.userInfo || {};
          if (userInfo.name) pdf.text(`Name: ${userInfo.name}`, margin, yPosition), yPosition += 6;
          if (userInfo.phone) pdf.text(`Phone: ${userInfo.phone}`, margin, yPosition), yPosition += 6;
          if (userInfo.license) pdf.text(`License: ${userInfo.license}`, margin, yPosition), yPosition += 6;
          if (userInfo.insurance) pdf.text(`Insurance: ${userInfo.insurance}`, margin, yPosition), yPosition += 6;
          if (userInfo.policy) pdf.text(`Policy: ${userInfo.policy}`, margin, yPosition), yPosition += 6;
          yPosition += 8;
          
          // Check if we need a new page
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Vehicles section
          pdf.setFontSize(14);
          pdf.text('Vehicles Involved', margin, yPosition);
          yPosition += 10;
          pdf.setFontSize(10);
          
          const vehicles = collectedInfo?.vehicles?.filter((v: any) => v.make || v.model) || [];
          if (vehicles.length === 0) {
            pdf.text('No vehicle information recorded', margin, yPosition);
            yPosition += 8;
          } else {
            vehicles.forEach((vehicle: any, index: number) => {
              const vehicleInfo = `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.color || ''}`.trim();
              pdf.text(`Vehicle ${index + 1}: ${vehicleInfo}`, margin, yPosition);
              yPosition += 6;
              if (vehicle.plate) {
                pdf.text(`License Plate: ${vehicle.plate}`, margin + 5, yPosition);
                yPosition += 6;
              }
              if (vehicle.associatedDriver) {
                pdf.text(`Associated Driver: ${vehicle.associatedDriver}`, margin + 5, yPosition);
                yPosition += 6;
              }
              yPosition += 4;
            });
          }
          
          // Other drivers section
          yPosition += 5;
          pdf.setFontSize(14);
          pdf.text('Other Drivers Involved', margin, yPosition);
          yPosition += 10;
          pdf.setFontSize(10);
          
          const otherDrivers = collectedInfo?.otherDrivers?.filter((d: any) => d.name) || [];
          if (collectedInfo?.noOtherDrivers) {
            pdf.text('Single car accident - no other drivers involved', margin, yPosition);
            yPosition += 8;
          } else if (otherDrivers.length === 0) {
            pdf.text('No other driver information recorded', margin, yPosition);
            yPosition += 8;
          } else {
            otherDrivers.forEach((driver: any, index: number) => {
              pdf.text(`Driver ${index + 1}: ${driver.name}`, margin, yPosition);
              yPosition += 6;
              if (driver.phone) {
                pdf.text(`Phone: ${driver.phone}`, margin + 5, yPosition);
                yPosition += 6;
              }
              if (driver.license) {
                pdf.text(`License: ${driver.license}`, margin + 5, yPosition);
                yPosition += 6;
              }
              if (driver.insurance) {
                pdf.text(`Insurance: ${driver.insurance}`, margin + 5, yPosition);
                yPosition += 6;
              }
              if (driver.policy) {
                pdf.text(`Policy: ${driver.policy}`, margin + 5, yPosition);
                yPosition += 6;
              }
              yPosition += 4;
            });
          }
          
          // Check if we need a new page
          if (yPosition > pageHeight - 80) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Witnesses section
          yPosition += 5;
          pdf.setFontSize(14);
          pdf.text('Witnesses', margin, yPosition);
          yPosition += 10;
          pdf.setFontSize(10);
          
          const witnesses = collectedInfo?.witnesses?.filter((w: any) => w.name) || [];
          if (collectedInfo?.noWitnesses) {
            pdf.text('No witnesses present', margin, yPosition);
            yPosition += 8;
          } else if (witnesses.length === 0) {
            pdf.text('No witness information recorded', margin, yPosition);
            yPosition += 8;
          } else {
            witnesses.forEach((witness: any, index: number) => {
              pdf.text(`Witness ${index + 1}: ${witness.name}`, margin, yPosition);
              yPosition += 6;
              if (witness.contact) {
                pdf.text(`Contact: ${witness.contact}`, margin + 5, yPosition);
                yPosition += 6;
              }
              if (witness.description) {
                pdf.text(`Description: ${witness.description}`, margin + 5, yPosition);
                yPosition += 6;
              }
              yPosition += 4;
            });
          }
          
          // Photos section
          const photos = collectedInfo?.photos?.filter((p: any) => p.dataUrl) || [];
          if (photos.length > 0) {
            yPosition += 10;
            
            // Check if we need a new page for photos
            if (yPosition > pageHeight - 100) {
              pdf.addPage();
              yPosition = 20;
            }
            
            pdf.setFontSize(14);
            pdf.text('Photos', margin, yPosition);
            yPosition += 10;
            
            // Process photos asynchronously to get proper dimensions
            for (let i = 0; i < photos.length; i++) {
              const photo = photos[i];
              
              // Check if we need a new page
              if (yPosition > pageHeight - 120) {
                pdf.addPage();
                yPosition = 20;
              }
              
              // Add photo description
              pdf.setFontSize(10);
              const photoTitle = photo.description || `${photo.type.replace('-', ' ')} photo`;
              pdf.text(`${i + 1}. ${photoTitle}`, margin, yPosition);
              yPosition += 8;
              
              // Add photo if dataUrl exists
              if (photo.dataUrl) {
                try {
                  // Get proper image dimensions asynchronously
                  const { width: photoWidth, height: photoHeight } = await new Promise<{width: number, height: number}>((resolve) => {
                    const tempImg = new Image();
                    tempImg.onload = () => {
                      const maxWidth = pageWidth - 40; // Leave margins
                      const maxHeight = 100; // Maximum height constraint
                      
                      let width = maxWidth;
                      let height = maxHeight;
                      
                      if (tempImg.naturalWidth && tempImg.naturalHeight) {
                        const aspectRatio = tempImg.naturalWidth / tempImg.naturalHeight;
                        
                        if (aspectRatio > 1) {
                          // Landscape: fit to width
                          height = width / aspectRatio;
                          if (height > maxHeight) {
                            height = maxHeight;
                            width = height * aspectRatio;
                          }
                        } else {
                          // Portrait: fit to height
                          width = height * aspectRatio;
                          if (width > maxWidth) {
                            width = maxWidth;
                            height = width / aspectRatio;
                          }
                        }
                      }
                      
                      resolve({ width, height });
                    };
                    tempImg.onerror = () => {
                      // Fallback to default dimensions if image fails to load
                      resolve({ width: pageWidth - 40, height: 100 });
                    };
                    tempImg.src = photo.dataUrl;
                  });
                  
                  // Check if we need a new page for this photo
                  if (yPosition + photoHeight > pageHeight - 30) {
                    pdf.addPage();
                    yPosition = 20;
                    // Re-add photo title on new page
                    pdf.setFontSize(10);
                    pdf.text(`${i + 1}. ${photoTitle}`, margin, yPosition);
                    yPosition += 8;
                  }
                  
                  pdf.addImage(photo.dataUrl, 'JPEG', margin, yPosition, photoWidth, photoHeight);
                  yPosition += photoHeight + 10;
                  
                } catch (error) {
                  console.error('Error adding photo to PDF:', error);
                  pdf.text('Photo could not be included', margin + 5, yPosition);
                  yPosition += 10;
                }
              }
            }
          }
          
          // Add footer disclaimer
          const disclaimer = "Crash Genius is a service provided by Cannon Law, a law firm based in Fort Collins, Colorado. No attorney-client relationship is formed through the use of this service. If you would like to contact us to discuss whether we are able to represent you on a no-win, no-fee basis, please visit us at www.cannonlaw.com or call (970) 471-7170.";
          
          pdf.setFontSize(8);
          const disclaimerLines = pdf.splitTextToSize(disclaimer, pageWidth - 20);
          const disclaimerHeight = disclaimerLines.length * 3;
          pdf.text(disclaimerLines, 10, pageHeight - disclaimerHeight - 10);
          
          // Return the PDF blob instead of saving
          const blob = pdf.output('blob');
          resolve(blob);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = headerImage;
    });
  };

  const handleGenerateReport = async () => {
    try {
      const pdfBlob = await generatePDF();
      const fileName = `accident-report-${currentDate.replace(/\//g, '-')}.pdf`;
      
      // Store the PDF blob for potential saving
      setGeneratedPDFBlob(pdfBlob);
      
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      // If user is logged in, save immediately
      if (user) {
        await saveReportToAccount();
      } else {
        // Show auth modal for potential saving
        setPendingSave(true);
        setShowAuthModal(true);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Error generating PDF report. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveReportToAccount = async () => {
    if (!generatedPDFBlob) return false;

    try {
      // Get current session to ensure we have a valid user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('No valid session found:', sessionError);
        toast({
          title: "Authentication Required",
          description: "Please log in to save your report.",
          variant: "destructive",
        });
        setShowAuthModal(true);
        return false;
      }

      setSaving(true);
      
      // Upload PDF and get URL
      const pdfUrl = await uploadPDFAndGetLink();
      
      // Save report to database using the session user ID
      const { error } = await supabase
        .from('saved_reports')
        .insert({
          user_id: session.user.id,
          title: `Crash Report - ${currentDate}`,
          collected_info: collectedInfo,
          pdf_url: pdfUrl,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your report has been saved to your account!",
      });

      return true;
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: "Error",
        description: "Failed to save report to your account.",
        variant: "destructive",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    // The useEffect will handle saving automatically when user state updates
    toast({
      title: "Welcome!",
      description: "Your account has been created and your report will be saved.",
    });
  };

  const uploadPDFAndGetLink = async () => {
    try {
      const pdfBlob = generatedPDFBlob || await generatePDF();
      const fileName = `accident-reports/accident-report-${Date.now()}.pdf`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('crash-reports')
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf'
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('crash-reports')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      throw error;
    }
  };

  const handleShareEmail = async () => {
    try {
      const reportUrl = await uploadPDFAndGetLink();
      const subject = encodeURIComponent('Car Accident Report - ' + currentDate);
      const body = encodeURIComponent(`Please find my car accident report generated by Cannon Law Crash Genius on ${currentDate} at ${currentTime}.\n\nYou can view and download the report here: ${reportUrl}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert('Error creating shareable link. Please try again.');
    }
  };

  const handleShareText = async () => {
    try {
      const reportUrl = await uploadPDFAndGetLink();
      const message = encodeURIComponent(`I've completed my accident report using Cannon Law Crash Genius. Report generated on ${currentDate}.\n\nView report: ${reportUrl}`);
      window.open(`sms:?body=${message}`);
    } catch (error) {
      console.error('Error sharing via text:', error);
      alert('Error creating shareable link. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ProgressIndicator 
        currentStep={5} 
        totalSteps={5} 
        stepTitles={stepTitles}
      />
      
      <div className="p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8 pt-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Generate Report
            </h1>
            <p className="text-muted-foreground">
              Create your comprehensive accident report
            </p>
          </div>

          {/* Report Summary */}
          <Card className="p-6 mb-6">
            <h3 className="font-semibold text-lg mb-4">Report Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="font-medium">
                  {collectedInfo?.accidentDetails?.dateTime 
                    ? new Date(collectedInfo.accidentDetails.dateTime).toLocaleString()
                    : `${currentDate} ${currentTime}`
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-medium">
                  {collectedInfo?.accidentDetails?.location || 'Not specified'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Your Info:</span>
                <span className="font-medium">
                  {collectedInfo?.userInfo?.name ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vehicles:</span>
                <span className="font-medium">
                  {collectedInfo?.vehicles?.filter((v: any) => v.make || v.model).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Other Drivers:</span>
                <span className="font-medium">
                  {collectedInfo?.noOtherDrivers ? 'None (single car)' : 
                   collectedInfo?.otherDrivers?.filter((d: any) => d.name).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Witnesses:</span>
                <span className="font-medium">
                  {collectedInfo?.noWitnesses ? 'None' :
                   collectedInfo?.witnesses?.filter((w: any) => w.name).length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Photos:</span>
                <span className="font-medium">
                  {collectedInfo?.photos?.filter((p: any) => p.dataUrl).length || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Report Actions */}
          <div className="space-y-4 mb-8">
            {/* Generate Report */}
            <Card className="p-6 bg-primary/5 border-primary/20">
              <div className="text-center mb-4">
                <Download className="w-8 h-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-lg">Generate PDF Report</h3>
                <p className="text-sm text-muted-foreground">
                  Create a comprehensive PDF document with all collected information
                </p>
              </div>
              <PrimaryActionButton onClick={handleGenerateReport}>
                <Download className="w-5 h-5 mr-2" />
                Generate PDF Report
              </PrimaryActionButton>
            </Card>

            {/* Share Options */}
            <Card className="p-6">
              <h3 className="font-semibold text-lg mb-4">Share Report</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleShareEmail}
                  variant="outline"
                  className="w-full justify-start h-12"
                >
                  <Mail className="w-5 h-5 mr-3" />
                  Share via Email
                </Button>
                
                <Button
                  onClick={handleShareText}
                  variant="outline"
                  className="w-full justify-start h-12"
                >
                  <MessageSquare className="w-5 h-5 mr-3" />
                  Share via Text
                </Button>
              </div>
            </Card>
          </div>

          {/* Completion Actions */}
          <div className="space-y-4">
            <Card className="p-4 bg-secondary">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Report Complete</p>
                  <p className="text-muted-foreground">
                    You've successfully documented the accident. Keep this report for your insurance claim.
                  </p>
                </div>
              </div>
            </Card>

            {user && (
              <Button 
                onClick={() => navigate('/dashboard')}
                className="w-full h-12"
              >
                View My Reports
              </Button>
            )}

            <Button 
              onClick={onComplete}
              variant="outline" 
              className="w-full h-12"
            >
              Return to Home
            </Button>
          </div>

          {/* Additional Resources */}
          <Card className="mt-6 p-4 bg-secondary">
            <div className="text-sm">
              <p className="font-medium mb-2">Next Steps:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Contact your insurance company</li>
                <li>• Follow up with medical care if needed</li>
                <li>• Keep all documentation together</li>
                <li>• Monitor for any delayed symptoms</li>
              </ul>
            </div>
          </Card>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};