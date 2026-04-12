import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, LogIn } from "lucide-react";

const Login = () => {
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
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">Help Center</Link>
        </div>
      </header>

      <main className="flex items-center justify-center px-6 py-20">
        <Card className="w-full max-w-md">
          <CardContent className="p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
              <p className="mt-1 text-sm text-muted-foreground">Access your secure voting dashboard</p>
            </div>

            <div className="mt-8 space-y-4">
              <div>
                <Label>Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="name@company.com" className="pl-10" />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Password</Label>
                  <Link to="/login" className="text-xs font-medium text-primary">Forgot password?</Link>
                </div>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="password" defaultValue="••••••••" className="pl-10 pr-10" />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Eye className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <label htmlFor="remember" className="text-sm text-foreground">Keep me signed in</label>
              </div>
              <Button className="w-full" size="lg">
                Login to Account <LogIn className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 border-t border-border pt-6 text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-primary">Sign up for free</Link>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="py-6 text-center text-sm text-muted-foreground">
        <div className="flex justify-center gap-6">
          <span>Privacy Policy</span><span>Terms of Service</span>
        </div>
        <p className="mt-2">© 2024 VoteSphere Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Login;
