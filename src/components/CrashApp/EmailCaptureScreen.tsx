import { useState, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Download } from "lucide-react";

// TODO(notice-copy): final wording to come from Cannon Law.
const NOTICE_COPY =
  "We'll email your accident report and may follow up to see if Cannon Law can help with your case. No obligation. Your information is not shared with anyone outside our firm.";

interface EmailCaptureScreenProps {
  onSubmitEmail: (email: string) => void;
  onBypass: () => void;
  busy?: boolean;
}

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const EmailCaptureScreen = ({
  onSubmitEmail,
  onBypass,
  busy = false,
}: EmailCaptureScreenProps) => {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const showError = touched && email.length > 0 && !isValidEmail(email);
  const canSubmit = !busy && isValidEmail(email);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setTouched(true);
      return;
    }
    onSubmitEmail(email.trim());
  };

  return (
    <Card className="p-6 border-2 border-primary/40 bg-primary/5">
      <h3 className="text-xl font-semibold mb-2 flex items-center">
        <Mail className="w-5 h-5 mr-2 text-primary" />
        Where should we send your report?
      </h3>

      <p className="text-sm text-muted-foreground mb-5">{NOTICE_COPY}</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="report-email">Email address</Label>
          <Input
            id="report-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={showError || undefined}
            disabled={busy}
          />
          {showError && (
            <p className="text-xs text-destructive">Please enter a valid email address.</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full text-base py-6"
          disabled={!canSubmit}
        >
          {busy ? "Sending..." : "Send & Download"}
        </Button>
      </form>

      <div className="text-center mt-4">
        <Button
          type="button"
          variant="link"
          className="text-sm text-muted-foreground"
          onClick={onBypass}
          disabled={busy}
        >
          <Download className="w-4 h-4 mr-1" />
          Just download to this device
        </Button>
      </div>
    </Card>
  );
};
