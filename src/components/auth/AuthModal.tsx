import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { Archive, Users, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialTab?: 'signup' | 'signin';
}

export const AuthModal = ({ isOpen, onClose, onSuccess, initialTab = 'signup' }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [activeTab, setActiveTab] = useState(initialTab);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { signUp, signIn } = useAuth();

  // Sync activeTab with initialTab prop and reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAgreeToTerms(false);
    }
  }, [initialTab, isOpen]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    
    if (!agreeToTerms) {
      return;
    }
    
    const { error } = await signUp(email, password);
    if (!error) {
      onSuccess();
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (!error) {
      onSuccess();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Save Your Report</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-lg">Want to access this report later?</CardTitle>
              <CardDescription>
                Create an account to save your crash report and access it anytime
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <Archive className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">Save Your Report</h4>
                    <p className="text-sm text-muted-foreground">Keep your accident report accessible from anywhere</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">Share with Links</h4>
                    <p className="text-sm text-muted-foreground">Send secure links to insurance companies and lawyers</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  <div>
                    <h4 className="font-medium">Always Available</h4>
                    <p className="text-sm text-muted-foreground">Never lose your important documentation</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signup' | 'signin')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
              <TabsTrigger value="signin">Sign In</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I agree to the{' '}
                    <a 
                      href="https://www.cannonlaw.com/terms-of-service-and-privacy-policy/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-primary hover:underline"
                    >
                      Terms of Service and Privacy Policy
                    </a>
                  </Label>
                </div>
                <Button type="submit" className="w-full" disabled={!agreeToTerms}>
                  Create Account
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Sign In
                </Button>
              </form>
            </TabsContent>
          </Tabs>

        </div>
      </DialogContent>
    </Dialog>
  );
};