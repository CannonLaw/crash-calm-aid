import { useState, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone } from "lucide-react";

// TODO(notice-copy): final wording to come from Cannon Law.
const NOTICE_COPY =
  "Optional. Your number goes to Cannon Law only. No obligation, and you can decline the call.";

interface PhoneCaptureScreenProps {
  onSubmitPhone: (phone: string) => void;
  onSkip: () => void;
  busy?: boolean;
}

const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
};

export const PhoneCaptureScreen = ({
  onSubmitPhone,
  onSkip,
  busy = false,
}: PhoneCaptureScreenProps) => {
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);

  const showError = touched && phone.length > 0 && !isValidPhone(phone);
  const canSubmit = !busy && isValidPhone(phone);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      setTouched(true);
      return;
    }
    onSubmitPhone(phone.trim());
  };

  return (
    <Card className="p-6 border-2 border-primary/40 bg-primary/5">
      <h3 className="text-xl font-semibold mb-2 flex items-center">
        <Phone className="w-5 h-5 mr-2 text-primary" />
        Want a free call about your accident?
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        A Cannon Law attorney can call you for a free, no-obligation
        conversation about your accident. {NOTICE_COPY}
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="callback-phone">Phone number</Label>
          <Input
            id="callback-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(970) 555-1234"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={showError || undefined}
            disabled={busy}
          />
          {showError && (
            <p className="text-xs text-destructive">
              Please enter a valid phone number.
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full text-base py-6"
          disabled={!canSubmit}
        >
          {busy ? "Sending..." : "Request a free call"}
        </Button>
      </form>

      <div className="text-center mt-4">
        <Button
          type="button"
          variant="link"
          className="text-sm text-muted-foreground"
          onClick={onSkip}
          disabled={busy}
        >
          No thanks, skip
        </Button>
      </div>
    </Card>
  );
};
