import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowLeft } from "lucide-react";

interface DownloadOnlyScreenProps {
  onDownload: () => void;
  onBack: () => void;
  busy?: boolean;
}

export const DownloadOnlyScreen = ({
  onDownload,
  onBack,
  busy = false,
}: DownloadOnlyScreenProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-xl font-semibold mb-2 flex items-center">
        <Download className="w-5 h-5 mr-2" />
        Download your report
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        Your report will be saved to this device only.
      </p>

      <Button
        type="button"
        className="w-full text-base py-6"
        onClick={onDownload}
        disabled={busy}
      >
        {busy ? "Preparing..." : "Download Report"}
      </Button>

      <div className="text-center mt-4">
        <Button
          type="button"
          variant="link"
          className="text-sm text-muted-foreground"
          onClick={onBack}
          disabled={busy}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
      </div>
    </Card>
  );
};
