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
    const handleAutoSave = async () => {
      if (user && generatedPDFBlob && pendingSave && !saving) {
        console.log('Auto-saving report after authentication...');
        const success = await saveReportToAccount();
        if (success) {
          setPendingSave(false);
          // Clear the PDF blob after successful save to prevent duplicate saves
          setGeneratedPDFBlob(null);
        }
      }
    };

    handleAutoSave();
  }, [user, generatedPDFBlob, pendingSave, saving]);

  const generatePDF = async (): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      
      // Consistent margin system
      const margins = {
        top: 20,
        bottom: 35, // Reserve space for footer
        left: 15,
        right: 15
      };
      
      const contentWidth = pageWidth - margins.left - margins.right;
      const contentHeight = pageHeight - margins.top - margins.bottom;
      
      // Add header image to first page
      const img = new Image();
      img.onload = async () => {
        try {
          // Add header image (scaled to fit content width)
          const imgWidth = contentWidth;
          const imgHeight = (img.height / img.width) * imgWidth;
          pdf.addImage(headerImage, 'PNG', margins.left, margins.top, imgWidth, imgHeight);
          
          // Add report content
          let yPosition = margins.top + imgHeight + 20;

          // Helper function to add footer to current page
          const addFooter = () => {
            const footerY = pageHeight - 15;
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'italic');
            const disclaimer = "Crash Genius is a service provided by Cannon Law, a law firm based in Fort Collins, Colorado. No attorney-client relationship is formed through the use of this service. If you would like to contact us to discuss whether we are able to represent you on a no-win, no-fee basis, please visit us at www.cannonlaw.com or call (970) 471-7170.";
            const disclaimerLines = pdf.splitTextToSize(disclaimer, contentWidth);
            pdf.text(disclaimerLines, margins.left, footerY - (disclaimerLines.length * 3));
          };

          // Helper function to add new page if needed with improved logic
          const addNewPageIfNeeded = (requiredSpace: number, bufferSpace: number = 15) => {
            const availableSpace = margins.top + contentHeight - yPosition;
            if (availableSpace < requiredSpace + bufferSpace) {
              addFooter(); // Add footer to current page
              pdf.addPage();
              yPosition = margins.top;
              return true;
            }
            return false;
          };

          // Helper function to add section with better spacing
          const addSection = (title: string, content: string[]) => {
            const sectionHeight = 20 + (content.length * 6) + 10; // Title + content + spacing
            addNewPageIfNeeded(sectionHeight);
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, margins.left, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            
            content.forEach(line => {
              const lineHeight = 6;
              addNewPageIfNeeded(lineHeight);
              pdf.text(line, margins.left, yPosition);
              yPosition += lineHeight;
            });
            yPosition += 8; // Section spacing
          };
          
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Car Accident Report', margins.left, yPosition);
          yPosition += 15;
          
          // Accident details section
          const accidentDateTime = collectedInfo?.accidentDetails?.dateTime 
            ? new Date(collectedInfo.accidentDetails.dateTime).toLocaleString()
            : `${currentDate} ${currentTime}`;
          
          const accidentDetails = [
            `Date & Time: ${accidentDateTime}`,
            `Location: ${collectedInfo?.accidentDetails?.location || 'Not specified'}`
          ];
          
          if (collectedInfo?.accidentDetails?.description) {
            accidentDetails.push(`Description: ${collectedInfo.accidentDetails.description}`);
          }
          
          addSection('Accident Details', accidentDetails);
          
          // Your information section
          const userInfo = collectedInfo?.userInfo || {};
          const userDetails = [];
          if (userInfo.name) userDetails.push(`Name: ${userInfo.name}`);
          if (userInfo.phone) userDetails.push(`Phone: ${userInfo.phone}`);
          if (userInfo.license) userDetails.push(`License: ${userInfo.license}`);
          if (userInfo.insurance) userDetails.push(`Insurance: ${userInfo.insurance}`);
          if (userInfo.policy) userDetails.push(`Policy: ${userInfo.policy}`);
          
          if (userDetails.length > 0) {
            addSection('Your Information', userDetails);
          }
          
          // Vehicles section
          const vehicles = collectedInfo?.vehicles?.filter((v: any) => v.make || v.model) || [];
          const vehicleDetails = [];
          
          if (vehicles.length === 0) {
            vehicleDetails.push('No vehicle information recorded');
          } else {
            vehicles.forEach((vehicle: any, index: number) => {
              const vehicleInfo = `${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.color || ''}`.trim();
              vehicleDetails.push(`Vehicle ${index + 1}: ${vehicleInfo}`);
              if (vehicle.plate) vehicleDetails.push(`  License Plate: ${vehicle.plate}`);
              if (vehicle.associatedDriver) vehicleDetails.push(`  Driver: ${vehicle.associatedDriver}`);
            });
          }
          
          addSection('Vehicles Involved', vehicleDetails);
          
          // Other drivers section
          const otherDrivers = collectedInfo?.otherDrivers?.filter((d: any) => d.name) || [];
          const driverDetails = [];
          
          if (collectedInfo?.noOtherDrivers) {
            driverDetails.push('Single car accident - no other drivers involved');
          } else if (otherDrivers.length === 0) {
            driverDetails.push('No other driver information recorded');
          } else {
            otherDrivers.forEach((driver: any, index: number) => {
              driverDetails.push(`Driver ${index + 1}: ${driver.name}`);
              if (driver.phone) driverDetails.push(`  Phone: ${driver.phone}`);
              if (driver.license) driverDetails.push(`  License: ${driver.license}`);
              if (driver.insurance) driverDetails.push(`  Insurance: ${driver.insurance}`);
              if (driver.policy) driverDetails.push(`  Policy: ${driver.policy}`);
            });
          }
          
          addSection('Other Drivers Involved', driverDetails);
          
          // Witnesses section
          const witnesses = collectedInfo?.witnesses?.filter((w: any) => w.name) || [];
          const witnessDetails = [];
          
          if (collectedInfo?.noWitnesses) {
            witnessDetails.push('No witnesses present');
          } else if (witnesses.length === 0) {
            witnessDetails.push('No witness information recorded');
          } else {
            witnesses.forEach((witness: any, index: number) => {
              witnessDetails.push(`Witness ${index + 1}: ${witness.name}`);
              if (witness.contact) witnessDetails.push(`  Contact: ${witness.contact}`);
              if (witness.description) witnessDetails.push(`  Description: ${witness.description}`);
            });
          }
          
          addSection('Witnesses', witnessDetails);
          
          // Photos section
          const photos = collectedInfo?.photos?.filter((p: any) => p.dataUrl) || [];
          if (photos.length > 0) {
            // Add photos header
            addNewPageIfNeeded(30);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Photos', margins.left, yPosition);
            yPosition += 15;
            
            // Process photos asynchronously to get proper dimensions
            for (let i = 0; i < photos.length; i++) {
              const photo = photos[i];
              
              // Add photo description
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'normal');
              const photoTitle = photo.description || `${photo.type.replace('-', ' ')} photo`;
              
              if (photo.dataUrl) {
                try {
                  // Get proper image dimensions asynchronously
                  const { width: photoWidth, height: photoHeight } = await new Promise<{width: number, height: number}>((resolve) => {
                    const tempImg = new Image();
                    tempImg.onload = () => {
                      const maxWidth = contentWidth;
                      const maxHeight = 80; // Reasonable height constraint
                      
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
                      resolve({ width: contentWidth, height: 60 });
                    };
                    tempImg.src = photo.dataUrl;
                  });
                  
                  // Check if we need a new page for this photo (title + photo + spacing)
                  const totalPhotoSpace = 8 + photoHeight + 10;
                  addNewPageIfNeeded(totalPhotoSpace);
                  
                  pdf.text(`${i + 1}. ${photoTitle}`, margins.left, yPosition);
                  yPosition += 8;
                  
                  pdf.addImage(photo.dataUrl, 'JPEG', margins.left, yPosition, photoWidth, photoHeight);
                  yPosition += photoHeight + 10;
                  
                } catch (error) {
                  console.error('Error adding photo to PDF:', error);
                  addNewPageIfNeeded(15);
                  pdf.text(`${i + 1}. ${photoTitle} (Photo could not be included)`, margins.left, yPosition);
                  yPosition += 10;
                }
              }
            }
          }
          
          // Add footer to the last page
          addFooter();
          
          // Return the PDF blob
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
              <PrimaryActionButton onClick={handleGenerateReport} disabled={saving}>
                {saving ? (
                  <>
                    <Clock className="w-5 h-5 mr-2 animate-spin" />
                    Saving Report...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Generate PDF Report
                  </>
                )}
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