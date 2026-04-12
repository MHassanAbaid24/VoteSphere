import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Lock, Eye, ArrowRight } from "lucide-react";

const SignUp = () => {
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
                <p className="mt-1 text-sm text-muted-foreground">Join VoteSphere and start building your first poll today.</p>
              </div>

              <div className="mt-8 space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Enter your full name" className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label>Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="name@company.com" className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label>Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input type="password" placeholder="Create a strong password" className="pl-10 pr-10" />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye className="h-4 w-4" /></button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">Must be at least 8 characters with one number.</p>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="terms" className="mt-0.5" />
                  <label htmlFor="terms" className="text-sm text-foreground">
                    I agree to the <Link to="/" className="text-primary">Terms of Service</Link> and <Link to="/" className="text-primary">Privacy Policy</Link>.
                  </label>
                </div>
                <Button className="w-full" size="lg">
                  Create Account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-4 text-xs uppercase tracking-wider text-muted-foreground">Or continue with</span></div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline">Google</Button>
                <Button variant="outline">GitHub</Button>
              </div>
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <Link to="/login" className="font-medium text-primary">Login</Link>
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
