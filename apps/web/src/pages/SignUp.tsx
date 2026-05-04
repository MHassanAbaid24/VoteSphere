import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, XCircle, MailCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/httpClient";
import { toast } from "sonner";

// Mirrors backend auth.schema.ts rules exactly
const validateForm = (name: string, email: string, password: string) => {
  const errors: Record<string, string> = {};

  if (!name.trim()) {
    errors.name = "Full name is required.";
  } else if (name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters long.";
  } else if (name.trim().length > 50) {
    errors.name = "Name cannot exceed 50 characters.";
  }

  if (!email.trim()) {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long.";
  } else if (!/[A-Z]/.test(password)) {
    errors.password = "Password must contain at least one uppercase letter.";
  } else if (!/[a-z]/.test(password)) {
    errors.password = "Password must contain at least one lowercase letter.";
  } else if (!/[0-9]/.test(password)) {
    errors.password = "Password must contain at least one number.";
  } else if (!/[^A-Za-z0-9]/.test(password)) {
    errors.password = "Password must contain at least one special character (e.g. !@#$%).";
  }

  return errors;
};

// Individual password rule checks (for the visual strength indicator)
const passwordRules = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
  { label: "One special character (!@#$%...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

const SignUp = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [signedUpEmail, setSignedUpEmail] = useState<string | null>(null);
  const [emailSendFailed, setEmailSendFailed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const currentErrors = validateForm(name, email, password);
    setErrors(currentErrors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });
    const currentErrors = validateForm(name, email, password);
    setErrors(currentErrors);

    if (Object.keys(currentErrors).length > 0) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup(name, email, password);
      setSignedUpEmail(email);
      setEmailSendFailed(!result.emailSent);
      if (result.emailSent) {
        toast.success("Account created! Please check your email to verify.");
      } else {
        toast.warning("Account created, but we couldn't send the verification email.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!signedUpEmail) return;
    setIsResending(true);
    try {
      await apiClient.post("/v1/auth/resend-verification", { email: signedUpEmail });
      setEmailSendFailed(false);
      toast.success("Verification email resent! Please check your inbox.");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || "Failed to resend. Please try again later.");
    } finally {
      setIsResending(false);
    }
  };

  // --- Email confirmation screen ---
  if (signedUpEmail) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-xs font-bold text-primary-foreground">V</span>
              </div>
              <span className="text-lg font-bold text-foreground">VoteSphere</span>
            </Link>
          </div>
          <Card>
            <CardContent className="p-10 text-center space-y-6">
              <div className="flex justify-center">
                <div className={`flex h-16 w-16 items-center justify-center rounded-full ${emailSendFailed ? "bg-destructive/10" : "bg-primary/10"}`}>
                  {emailSendFailed
                    ? <XCircle className="h-8 w-8 text-destructive" />
                    : <MailCheck className="h-8 w-8 text-primary" />}
                </div>
              </div>

              {emailSendFailed ? (
                <div>
                  <h1 className="text-xl font-bold text-foreground">Couldn't Send Verification Email</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Your account was created, but we couldn't deliver a verification email to{" "}
                    <span className="font-medium text-foreground">{signedUpEmail}</span>.
                    This is usually a temporary network issue. Please try resending.
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="text-xl font-bold text-foreground">Check your inbox!</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    We sent a verification link to{" "}
                    <span className="font-medium text-foreground">{signedUpEmail}</span>.
                    Click the link in the email to activate your account.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  variant={emailSendFailed ? "default" : "outline"}
                  className="w-full"
                  onClick={handleResend}
                  disabled={isResending}
                >
                  {isResending ? "Resending..." : "Resend Verification Email"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Already verified?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">Login here</Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const showPasswordRules = password.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">V</span>
            </div>
            <span className="text-lg font-bold text-foreground">VoteSphere</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Support</Link>
        </div>
      </header>

      <main className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-8">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
                <p className="mt-1 text-sm text-muted-foreground">Join thousands of users making better decisions</p>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="John Doe"
                      className={`pl-10 ${touched.name && errors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onBlur={() => handleBlur("name")}
                    />
                  </div>
                  {touched.name && errors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> {errors.name}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      className={`pl-10 ${touched.email && errors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => handleBlur("email")}
                    />
                  </div>
                  {touched.email && errors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <XCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className={`pl-10 pr-10 ${touched.password && errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onBlur={() => handleBlur("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password strength checklist */}
                  {showPasswordRules && (
                    <ul className="mt-2 space-y-1 rounded-md border border-border bg-muted/40 p-3">
                      {passwordRules.map((rule) => {
                        const passes = rule.test(password);
                        return (
                          <li key={rule.label} className={`flex items-center gap-2 text-xs ${passes ? "text-green-600" : "text-muted-foreground"}`}>
                            {passes
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              : <XCircle className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                            }
                            {rule.label}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                {/* Terms */}
                <div className="flex items-start gap-2">
                  <Checkbox id="terms" className="mt-1" required />
                  <label htmlFor="terms" className="text-sm text-foreground leading-snug">
                    I agree to the <Link to="#" className="text-primary hover:underline">Terms of Service</Link> and <Link to="#" className="text-primary hover:underline">Privacy Policy</Link>.
                  </label>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? "Creating Account..." : "Create Account"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-4 text-xs uppercase tracking-wider text-muted-foreground">Or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" type="button">Google</Button>
                <Button variant="outline" type="button">GitHub</Button>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Login</Link>
          </p>
          <p className="mt-4 text-center text-xs uppercase tracking-wider text-muted-foreground">
            © 2024 VoteSphere Inc. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignUp;