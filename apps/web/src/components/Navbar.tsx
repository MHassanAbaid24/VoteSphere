import { Link, useLocation } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  variant?: "landing" | "app";
}

const Navbar = ({ variant = "landing" }: NavbarProps) => {
  const location = useLocation();

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" className="text-primary-foreground" />
              <rect x="9" y="2" width="5" height="5" rx="1" fill="currentColor" className="text-primary-foreground" opacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1" fill="currentColor" className="text-primary-foreground" opacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1" fill="currentColor" className="text-primary-foreground" opacity="0.4" />
            </svg>
          </div>
          <span className="text-lg font-bold text-foreground">VoteSphere</span>
        </Link>

        {variant === "landing" ? (
          <nav className="flex items-center gap-6">
            <Link to="/#features" className="text-sm text-muted-foreground hover:text-foreground">Features</Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">Login</Link>
            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground">Sign Up</Link>
            <Button asChild size="sm">
              <Link to="/create-poll">Create Poll</Link>
            </Button>
          </nav>
        ) : (
          <nav className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className={`text-sm ${location.pathname === "/dashboard" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Dashboard
            </Link>
            <Link
              to="/my-polls"
              className={`text-sm ${location.pathname === "/my-polls" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              My Polls
            </Link>
            <Link
              to="/community"
              className={`text-sm ${location.pathname === "/community" ? "text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}
            >
              Community
            </Link>
            <button className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
            </button>
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;
