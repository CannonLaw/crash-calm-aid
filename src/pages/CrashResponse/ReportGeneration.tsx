import { useState, useEffect } from "react";
import { ProgressIndicator } from "@/components/CrashApp/ProgressIndicator";
import { PrimaryActionButton } from "@/components/CrashApp/PrimaryActionButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { 
  FileText, 
  Download, 
  Mail, 
  MessageSquare, 
  CheckCircle, 
  Clock,
  MapPin,
  UserPlus,
  AlertTriangle,
  LogIn
} from "lucide-react";
import { jsPDF } from "jspdf";
import headerImage from "@/assets/crash-genius-header.png";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatForPDF, formatLocalDateTimeForPDF } from "@/lib/dateUtils";

interface ReportGenerationProps {
  collectedInfo: any;
  onComplete: () => void;
  onGoBack: () => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

export const ReportGeneration = ({ collectedInfo, onComplete, onGoBack }: ReportGenerationProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signup' | 'signin'>('signup');
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [generatedPDFBlob, setGeneratedPDFBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<'choose' | 'generating' | 'completed'>('choose');
  const [reportSaved, setReportSaved] = useState(false);
  const [saveAfterDownload, setSaveAfterDownload] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Handle authentication success and save report
  useEffect(() => {
    const handleAuthAndSave = async () => {
      // For sign-in: user is immediately available and can proceed with saving
      // For sign-up: user might not be immediately available due to email confirmation
      if (user && !saving && (step === 'generating' || saveAfterDownload)) {
        console.log('User authenticated, generating and saving report...');
        try {
          let pdfBlob = generatedPDFBlob;
          
          // If we don't have a PDF yet (normal flow) or if we're saving after download, generate it
          if (!pdfBlob || saveAfterDownload) {
            pdfBlob = await generatePDF();
            setGeneratedPDFBlob(pdfBlob);
          }
          
          const success = await saveReportToAccount(pdfBlob);
          if (success) {
            setReportSaved(true);
            const wasAfterDownload = saveAfterDownload;
            setSaveAfterDownload(false); // Reset the flag
            
            // If this was a save after download, redirect to dashboard
            if (wasAfterDownload) {
              toast({
                title: "Report Saved!",
                description: "Redirecting to your dashboard...",
              });
              setTimeout(() => {
                navigate('/dashboard');
              }, 1500);
            } else {
              // Normal flow - stay on current page and download
              setStep('completed');
              const currentDate = formatForPDF(new Date()).split(' at ')[0];
              const fileName = `accident-report-${currentDate.replace(/[,\s]/g, '-')}.pdf`;
              const url = URL.createObjectURL(pdfBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              a.click();
              URL.revokeObjectURL(url);
            }
          }
        } catch (error) {
          console.error('Error generating/saving report:', error);
          setStep('choose');
          setSaveAfterDownload(false);
        }
      }
    };

    handleAuthAndSave();
  }, [user, saving, step, saveAfterDownload]);

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
            ? formatLocalDateTimeForPDF(collectedInfo.accidentDetails.dateTime)
            : formatForPDF(new Date());
          
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

  const handleCreateAccountAndSave = () => {
    setStep('generating');
    if (user) {
      // User already logged in, proceed directly
      handleGenerateAndSave();
    } else {
      // Show auth modal with signup tab
      setAuthModalTab('signup');
      setShowAuthModal(true);
    }
  };

  const handleSignInAndSave = () => {
    setStep('generating');
    if (user) {
      // User already logged in, proceed directly
      handleGenerateAndSave();
    } else {
      // Show auth modal with signin tab
      setAuthModalTab('signin');
      setShowAuthModal(true);
    }
  };

  const handleGenerateAndSave = async () => {
    try {
      const pdfBlob = await generatePDF();
      setGeneratedPDFBlob(pdfBlob);
      
      const success = await saveReportToAccount(pdfBlob);
      if (success) {
        setReportSaved(true);
        setStep('completed');
        
        // Also download for user convenience
        const currentDate = formatForPDF(new Date()).split(' at ')[0];
        const fileName = `accident-report-${currentDate.replace(/[,\s]/g, '-')}.pdf`;
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        setStep('choose');
      }
    } catch (error) {
      console.error('Error generating/saving report:', error);
      setStep('choose');
    }
  };

  const handleDownloadOnly = () => {
    setShowDownloadConfirm(true);
  };

  const confirmDownloadOnly = async () => {
    setShowDownloadConfirm(false);
    setStep('generating');
    
    try {
      const pdfBlob = await generatePDF();
      setGeneratedPDFBlob(pdfBlob);
      
      const currentDate = formatForPDF(new Date()).split(' at ')[0];
      const fileName = `accident-report-${currentDate.replace(/[,\s]/g, '-')}.pdf`;
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      
      setStep('completed');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Error generating PDF report. Please try again.",
        variant: "destructive",
      });
      setStep('choose');
    }
  };

  const saveReportToAccount = async (pdfBlob?: Blob) => {
    const blobToSave = pdfBlob || generatedPDFBlob;
    if (!blobToSave) return false;

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
      const pdfUrl = await uploadPDFAndGetLink(blobToSave);
      
      // Save report to database using the session user ID
      const reportDate = formatForPDF(new Date()).split(' at ')[0];
      const { error } = await supabase
        .from('saved_reports')
        .insert({
          user_id: session.user.id,
          title: `Crash Report - ${reportDate}`,
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
    // The useEffect will handle the rest
    toast({
      title: "Welcome!",
      description: "Generating and saving your report...",
    });
  };

  const uploadPDFAndGetLink = async (pdfBlob?: Blob) => {
    try {
      const blobToUpload = pdfBlob || generatedPDFBlob || await generatePDF();
      const fileName = `accident-reports/accident-report-${Date.now()}.pdf`;
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('crash-reports')
        .upload(fileName, blobToUpload, {
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
      const reportDate = formatForPDF(new Date()).split(' at ')[0];
      const reportTime = formatForPDF(new Date()).split(' at ')[1];
      const subject = encodeURIComponent('Car Accident Report - ' + reportDate);
      const body = encodeURIComponent(`Please find my car accident report generated by Cannon Law Crash Genius on ${reportDate} at ${reportTime}.\n\nYou can view and download the report here: ${reportUrl}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
    } catch (error) {
      console.error('Error sharing via email:', error);
      alert('Error creating shareable link. Please try again.');
    }
  };

  const handleShareText = async () => {
    try {
      const reportUrl = await uploadPDFAndGetLink();
      const reportDate = formatForPDF(new Date()).split(' at ')[0];
      const message = encodeURIComponent(`I've completed my accident report using Cannon Law Crash Genius. Report generated on ${reportDate}.\n\nView report: ${reportUrl}`);
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
        <div className="max-w-2xl mx-auto space-y-6">
          {step === 'choose' && (
            <>
              {/* Summary of collected information */}
              <Card>
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Report Summary
                  </h3>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <h4 className="font-medium">Accident Details</h4>
                      <p className="text-muted-foreground">
                        {collectedInfo?.accidentDetails?.location || 'Location not specified'} - {
                          collectedInfo?.accidentDetails?.dateTime 
                            ? formatForPDF(collectedInfo.accidentDetails.dateTime)
                            : formatForPDF(new Date())
                        }
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Your Information</h4>
                      <p className="text-muted-foreground">
                        {collectedInfo?.userInfo?.name || 'Name not provided'} - {collectedInfo?.userInfo?.phone || 'Phone not provided'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Vehicles</h4>
                      <p className="text-muted-foreground">
                        {collectedInfo?.vehicles?.filter((v: any) => v.make || v.model).length || 0} vehicle(s) recorded
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Other Drivers</h4>
                      <p className="text-muted-foreground">
                        {collectedInfo?.noOtherDrivers ? 'Single car accident' : 
                         `${collectedInfo?.otherDrivers?.filter((d: any) => d.name).length || 0} other driver(s)`}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Witnesses</h4>
                      <p className="text-muted-foreground">
                        {collectedInfo?.noWitnesses ? 'No witnesses' : 
                         `${collectedInfo?.witnesses?.filter((w: any) => w.name).length || 0} witness(es)`}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium">Photos</h4>
                      <p className="text-muted-foreground">
                        {collectedInfo?.photos?.filter((p: any) => p.dataUrl).length || 0} photo(s) attached
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Edit Report Button */}
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={onGoBack}
                  className="flex items-center gap-2"
                >
                  <span>←</span>
                  Go Back to Edit Report
                </Button>
              </div>

              {/* Choose how to proceed */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Choose how to proceed with your report:</h3>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="cursor-pointer border-2 border-primary/40 bg-primary/8 hover:bg-primary/15 hover:border-primary/60 transition-all duration-200" onClick={handleCreateAccountAndSave}>
                    <CardHeader>
                      <CardTitle className="flex items-center text-primary text-base">
                        <UserPlus className="w-5 h-5 mr-2" />
                        Create Account & Save
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-sm">
                        New users: Create account and save report
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>• Create new account</li>
                        <li>• Save automatically</li>
                        <li>• Access from anywhere</li>
                        <li>• Share with links</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer border-2 border-primary/40 bg-primary/8 hover:bg-primary/15 hover:border-primary/60 transition-all duration-200" onClick={handleSignInAndSave}>
                    <CardHeader>
                      <CardTitle className="flex items-center text-primary text-base">
                        <LogIn className="w-5 h-5 mr-2" />
                        Sign In & Save
                      </CardTitle>
                      <CardDescription className="text-muted-foreground text-sm">
                        Existing users: Sign in and save report
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>• Use existing account</li>
                        <li>• Save automatically</li>
                        <li>• View in dashboard</li>
                        <li>• Download anytime</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer border-2 border-primary/40 bg-primary/8 hover:bg-primary/15 hover:border-primary/60 transition-all duration-200" onClick={handleDownloadOnly}>
                    <CardHeader>
                      <CardTitle className="flex items-center text-primary text-base">
                        <Download className="w-5 h-5 mr-2" />
                        Download Only
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Quick download without account
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        <li>• No account needed</li>
                        <li>• Instant download</li>
                        <li className="flex items-center text-orange-600">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Won't be saved
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}

          {step === 'generating' && (
            <Card>
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Generating Your Report</h3>
                <p className="text-muted-foreground">
                  {saving ? 'Saving to your account...' : 'Creating your PDF report...'}
                </p>
              </div>
            </Card>
          )}

          {step === 'completed' && (
            <>
              <Card>
                <div className="p-6">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <h3 className="text-lg font-semibold">Report Complete!</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    {reportSaved 
                      ? "Your report has been saved to your account and downloaded to your device."
                      : "Your report has been downloaded to your device."
                    }
                  </p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-600" />
                      <span>Consider sharing this report with your insurance company</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                      <span>Keep a copy for your records and any potential legal proceedings</span>
                    </div>
                  </div>
                </div>
              </Card>

              {generatedPDFBlob && (
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleShareEmail} 
                      variant="outline" 
                      className="flex-1"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Share via Email
                    </Button>
                    <Button 
                      onClick={handleShareText} 
                      variant="outline" 
                      className="flex-1"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Share via Text
                    </Button>
                  </div>

                  {reportSaved && (
                    <Button 
                      onClick={() => navigate('/dashboard')} 
                      variant="outline" 
                      className="w-full"
                    >
                      View in Dashboard
                    </Button>
                  )}

                  {!reportSaved && !user && (
                    <Card>
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground mb-3">
                          Want to save this report for later access?
                        </p>
                        <Button 
                          onClick={() => {
                            setSaveAfterDownload(true);
                            setAuthModalTab('signup');
                            setShowAuthModal(true);
                          }} 
                          variant="outline" 
                          className="w-full"
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Create Account Now
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              )}

              {/* Navigation */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => window.location.href = '/'} className="flex-1">
                  Back to Home
                </Button>
                <Button onClick={onComplete} className="flex-1">
                  Complete Process
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          setStep('choose');
        }} 
        onSuccess={handleAuthSuccess}
        initialTab={authModalTab}
      />

      <AlertDialog open={showDownloadConfirm} onOpenChange={setShowDownloadConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
              Download Without Saving?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                If you download the report without creating an account, you won't be able to:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Access the report from other devices</li>
                <li>Share the report with a link</li>
                <li>Retrieve the report if you lose the file</li>
                <li>Keep an organized record of your reports</li>
              </ul>
              <p className="font-medium">
                Are you sure you want to proceed with download only?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Create Account Instead</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDownloadOnly}>
              Yes, Download Only
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};