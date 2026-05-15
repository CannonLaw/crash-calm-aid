import { useState, useEffect } from "react";
import { ProgressIndicator } from "@/components/CrashApp/ProgressIndicator";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  FileText,
  Mail,
  MessageSquare,
  CheckCircle,
  Clock,
  MapPin,
  UserPlus,
  LogIn,
} from "lucide-react";
import { jsPDF } from "jspdf";
import headerImage from "@/assets/crash-genius-header.png";
import { supabase } from "@/integrations/supabase/client";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { formatForPDF, formatLocalDateTimeForPDF } from "@/lib/dateUtils";
import { trackEvent } from "@/lib/analytics";
import { submitLead, sendReportByEmail } from "@/lib/leads";
import { EmailCaptureScreen } from "@/components/CrashApp/EmailCaptureScreen";
import { DownloadOnlyScreen } from "@/components/CrashApp/DownloadOnlyScreen";
import { PhoneCaptureScreen } from "@/components/CrashApp/PhoneCaptureScreen";

interface ReportGenerationProps {
  collectedInfo: any;
  onComplete: () => void;
  onGoBack: () => void;
}

const stepTitles = ["Safety Check", "Emergency Contacts", "Authorities", "Information", "Report"];

type Step = 'choose' | 'screen-b' | 'generating' | 'phone-capture' | 'completed';
type CapturePath = 'auth-save' | 'email-screen-a' | 'screen-b-bypass' | null;

export const ReportGeneration = ({ collectedInfo, onComplete, onGoBack }: ReportGenerationProps) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'signup' | 'signin'>('signup');
  const [generatedPDFBlob, setGeneratedPDFBlob] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<Step>('choose');
  const [capturePath, setCapturePath] = useState<CapturePath>(null);
  const [reportSaved, setReportSaved] = useState(false);
  const [saveAfterDownload, setSaveAfterDownload] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    trackEvent('report_summary_viewed');
  }, []);

  // Handle authentication success and save report
  useEffect(() => {
    const handleAuthAndSave = async () => {
      // For sign-in: user is immediately available and can proceed with saving
      // For sign-up: user might not be immediately available due to email confirmation
      if (user && !saving && step === 'generating' && capturePath === 'auth-save') {
        console.log('User authenticated, generating and saving report...');
        setSaving(true);
        
        try {
          let pdfBlob = generatedPDFBlob;
          
          // If we don't have a PDF yet or if we're saving after download, generate it
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
              const fileName = `accident-report-${currentDate.replace(/[,\s]+/g, '-')}.pdf`;
              const url = URL.createObjectURL(pdfBlob);
              const a = document.createElement('a');
              a.href = url;
              a.download = fileName;
              a.click();
              URL.revokeObjectURL(url);
              trackEvent('report_downloaded', { path: 'authenticated-save' });
            }
          }
        } catch (error) {
          console.error('Error generating/saving report:', error);
          setStep('choose');
          setSaveAfterDownload(false);
        } finally {
          setSaving(false);
        }
      }
    };

    handleAuthAndSave();
  }, [user, saving, step, saveAfterDownload, capturePath]);

  const buildFileName = (): string => {
    const currentDate = formatForPDF(new Date()).split(' at ')[0];
    return `accident-report-${currentDate.replace(/[,\s]+/g, '-')}.pdf`;
  };

  const triggerLocalDownload = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const reportSummarySnapshot = () => ({
    accidentLocation: collectedInfo?.accidentDetails?.location ?? null,
    accidentDateTime: collectedInfo?.accidentDetails?.dateTime ?? null,
    vehicleCount: collectedInfo?.vehicles?.filter((v: any) => v.make || v.model).length ?? 0,
    otherDriverCount: collectedInfo?.otherDrivers?.filter((d: any) => d.name).length ?? 0,
    witnessCount: collectedInfo?.witnesses?.filter((w: any) => w.name).length ?? 0,
    photoCount: collectedInfo?.photos?.filter((p: any) => p.dataUrl).length ?? 0,
  });

  const generatePDF = async (): Promise<Blob> => {
    // eslint-disable-next-line no-async-promise-executor
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

          // Helper function to add section with text wrapping
          const addSection = (title: string, content: string[]) => {
            // Estimate section height for page break check
            addNewPageIfNeeded(30);

            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text(title, margins.left, yPosition);
            yPosition += 8;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');

            content.forEach(line => {
              const lineHeight = 5;
              // Wrap long lines to fit within content width
              const wrappedLines = pdf.splitTextToSize(line, contentWidth);
              wrappedLines.forEach((wrappedLine: string) => {
                addNewPageIfNeeded(lineHeight);
                pdf.text(wrappedLine, margins.left, yPosition);
                yPosition += lineHeight;
              });
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

          if (collectedInfo?.noOtherVehicles) {
            vehicleDetails.push('Single car accident - only the reporting driver\'s vehicle was involved');
          } else if (vehicles.length === 0) {
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
          
          // TODO(what-to-do-content): final copy to be supplied by Cannon Law.
          const whatToDoBlocks: Array<{ heading: string; bullets: string[] }> = [
            {
              heading: 'Within 24 hours',
              bullets: [
                'See a doctor or visit an urgent care center, even if you feel fine. Some accident injuries take hours or days to appear.',
                'Notify your insurance company that you were in an accident.',
                'If you can safely return to the scene, take additional photos of the location, your vehicle, and any injuries.',
                'Write down everything you remember about the crash while it is still fresh.',
              ],
            },
            {
              heading: 'Within 7 days',
              bullets: [
                'Follow up on any medical advice you received. Keep copies of every appointment, prescription, and bill.',
                'Request a copy of the police report if one was filed.',
                'Save repair estimates and any out-of-pocket costs in one place.',
                "Be cautious about giving a recorded statement to the other driver's insurance company. Many people consult an attorney before doing so.",
              ],
            },
            {
              heading: 'Ongoing',
              bullets: [
                'Keep filling in the 7-day symptom log on the next page.',
                'Keep all correspondence with insurance companies in writing or by email.',
                'If you are considering whether you need an attorney, most personal injury firms offer free consultations.',
              ],
            },
          ];

          const addWhatToDoNext = () => {
            addNewPageIfNeeded(40);
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('What to Do Next', margins.left, yPosition);
            yPosition += 8;

            whatToDoBlocks.forEach((block, blockIndex) => {
              addNewPageIfNeeded(12);
              pdf.setFontSize(10);
              pdf.setFont('helvetica', 'bold');
              pdf.text(block.heading, margins.left, yPosition);
              yPosition += 6;

              pdf.setFont('helvetica', 'normal');
              block.bullets.forEach((bullet) => {
                const bulletLines = pdf.splitTextToSize(`• ${bullet}`, contentWidth - 4);
                bulletLines.forEach((line: string, idx: number) => {
                  addNewPageIfNeeded(5);
                  const x = idx === 0 ? margins.left : margins.left + 3;
                  pdf.text(line, x, yPosition);
                  yPosition += 5;
                });
              });

              if (blockIndex < whatToDoBlocks.length - 1) {
                yPosition += 3;
              }
            });
            yPosition += 8;
          };

          const addSymptomLog = () => {
            // Title block + 7 rows + spacing ≈ 165mm. Force a fresh page so it
            // prints clean and there's enough room to write in each row.
            addNewPageIfNeeded(165);

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text('7-Day Symptom Log', margins.left, yPosition);
            yPosition += 7;

            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'italic');
            const subtitle = pdf.splitTextToSize(
              'Fill in over the days after your accident. Tracking symptoms helps your doctor and any attorney you consult.',
              contentWidth
            );
            subtitle.forEach((line: string) => {
              pdf.text(line, margins.left, yPosition);
              yPosition += 5;
            });
            yPosition += 4;

            const tableWidth = contentWidth;
            const colWidths = [25, 60, 22, tableWidth - 25 - 60 - 22];
            const colX = [
              margins.left,
              margins.left + colWidths[0],
              margins.left + colWidths[0] + colWidths[1],
              margins.left + colWidths[0] + colWidths[1] + colWidths[2],
            ];
            const headerHeight = 8;
            const bodyRowHeight = 18;
            const padX = 2;

            pdf.setDrawColor(120, 120, 120);
            pdf.setLineWidth(0.2);

            // Header row
            pdf.setFillColor(245, 245, 245);
            pdf.rect(margins.left, yPosition, tableWidth, headerHeight, 'F');
            pdf.rect(margins.left, yPosition, tableWidth, headerHeight, 'S');
            for (let i = 1; i < 4; i++) {
              pdf.line(colX[i], yPosition, colX[i], yPosition + headerHeight);
            }
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            const headers = ['Date', 'Symptoms', 'Severity (1–10)', 'Notes'];
            const headerTextY = yPosition + 5.5;
            headers.forEach((h, i) => {
              pdf.text(h, colX[i] + padX, headerTextY);
            });
            yPosition += headerHeight;

            // Body rows
            pdf.setFont('helvetica', 'normal');
            for (let r = 0; r < 7; r++) {
              pdf.rect(margins.left, yPosition, tableWidth, bodyRowHeight, 'S');
              for (let i = 1; i < 4; i++) {
                pdf.line(colX[i], yPosition, colX[i], yPosition + bodyRowHeight);
              }
              yPosition += bodyRowHeight;
            }
            yPosition += 6;
          };

          addWhatToDoNext();
          addSymptomLog();

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
    setCapturePath('auth-save');
    if (user) {
      setStep('generating');
    } else {
      setAuthModalTab('signup');
      setShowAuthModal(true);
    }
  };

  const handleSignInAndSave = () => {
    setCapturePath('auth-save');
    if (user) {
      setStep('generating');
    } else {
      setAuthModalTab('signin');
      setShowAuthModal(true);
    }
  };

  const handleAuthModalSuccess = () => {
    setShowAuthModal(false);
    setStep('generating');
  };

  const handleEmailSubmit = async (email: string) => {
    setSubmitting(true);
    setCapturePath('email-screen-a');
    setStep('generating');

    try {
      const pdfBlob = await generatePDF();
      setGeneratedPDFBlob(pdfBlob);
      const fileName = buildFileName();

      // Download immediately — "Send & Download" promises both, no waiting on the network.
      triggerLocalDownload(pdfBlob, fileName);
      trackEvent('report_downloaded', { path: 'email-screen-a' });

      // Persist the lead and send the email in the background; UI transitions immediately.
      (async () => {
        try {
          const leadResult = await submitLead({
            email,
            captureChannel: 'email-screen-a',
            reportFlowCompleted: true,
            reportSummarySnapshot: reportSummarySnapshot(),
          });

          if (!leadResult.ok) {
            toast({
              title: "Couldn't save your email",
              description: "Your PDF was downloaded to this device. We weren't able to email a copy.",
              variant: "destructive",
            });
            return;
          }

          trackEvent('email_captured', { lead_id: leadResult.leadId });

          const emailResult = await sendReportByEmail(email, pdfBlob, fileName, leadResult.leadId);
          if (!emailResult.ok) {
            toast({
              title: "Email send failed",
              description: "Your report downloaded to this device, but we couldn't email a copy.",
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error('Background lead/email submission failed', err);
          toast({
            title: "Couldn't deliver your report by email",
            description: "Your PDF is on this device. Please try again or call us at (970) 471-7170.",
            variant: "destructive",
          });
        }
      })();

      setStep('phone-capture');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Error generating PDF report. Please try again.",
        variant: "destructive",
      });
      setStep('choose');
      setCapturePath(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBypass = () => {
    trackEvent('bypass_to_download');
    setStep('screen-b');
  };

  const handleScreenBDownload = async () => {
    setSubmitting(true);
    setCapturePath('screen-b-bypass');
    setStep('generating');

    try {
      const pdfBlob = await generatePDF();
      setGeneratedPDFBlob(pdfBlob);
      const fileName = buildFileName();
      triggerLocalDownload(pdfBlob, fileName);
      trackEvent('report_downloaded', { path: 'screen-b-bypass' });
      setStep('phone-capture');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Error generating PDF report. Please try again.",
        variant: "destructive",
      });
      setStep('screen-b');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScreenBBack = () => {
    setStep('choose');
    setCapturePath(null);
  };

  const handlePhoneSubmit = async (phone: string) => {
    setSubmitting(true);
    const result = await submitLead({
      phone,
      captureChannel: 'phone-post-download',
      reportFlowCompleted: true,
      reportSummarySnapshot: reportSummarySnapshot(),
    });
    if (result.ok) {
      trackEvent('phone_captured', { lead_id: result.leadId });
    } else {
      toast({
        title: "Couldn't save your number",
        description: "Please call us at (970) 471-7170 if you'd like to talk.",
        variant: "destructive",
      });
    }
    setSubmitting(false);
    setStep('completed');
  };

  const handlePhoneSkip = () => {
    trackEvent('callback_skipped');
    setStep('completed');
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
      trackEvent('share_email');
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
      trackEvent('share_text');
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

              {/* Primary: email capture (Screen A) */}
              <EmailCaptureScreen
                onSubmitEmail={handleEmailSubmit}
                onBypass={handleBypass}
                busy={submitting}
              />

              {/* Secondary: account options */}
              {user ? (
                <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-sm text-muted-foreground pt-1">
                  <span>Signed in as {user.email}.</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-1 h-auto"
                    onClick={handleCreateAccountAndSave}
                  >
                    Also save this report to your account
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-1 text-sm text-muted-foreground pt-1">
                  <span>Want to save reports to an account?</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-1 h-auto"
                    onClick={handleCreateAccountAndSave}
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Create account
                  </Button>
                  <span className="text-muted-foreground/60">·</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="px-1 h-auto"
                    onClick={handleSignInAndSave}
                  >
                    <LogIn className="w-4 h-4 mr-1" />
                    Sign in
                  </Button>
                </div>
              )}
            </>
          )}

          {step === 'screen-b' && (
            <DownloadOnlyScreen
              onDownload={handleScreenBDownload}
              onBack={handleScreenBBack}
              busy={submitting}
            />
          )}

          {step === 'phone-capture' && (
            <PhoneCaptureScreen
              onSubmitPhone={handlePhoneSubmit}
              onSkip={handlePhoneSkip}
              busy={submitting}
            />
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
          setCapturePath(null);
          setStep('choose');
        }}
        onSuccess={handleAuthModalSuccess}
        initialTab={authModalTab}
      />
    </div>
  );
};