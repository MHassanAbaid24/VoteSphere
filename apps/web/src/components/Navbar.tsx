import { Link, useLocation, useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  variant?: "landing" | "app";
}

const Navbar = ({ variant = "landing" }: NavbarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const handleScrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const el = document.getElementById("features");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // 1. Fetch unread notification count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "count"],
    queryFn: api.getUnreadNotificationsCount,
    refetchInterval: 15000, // Poll every 15 seconds
    enabled: !!user && variant === "app",
  });

  // 2. Fetch latest 5 notifications
  const { data: notifData } = useQuery({
    queryKey: ["notifications", "latest"],
    queryFn: () => api.getNotifications({ limit: 5 }),
    refetchInterval: 15000, // Poll every 15 seconds
    enabled: !!user && variant === "app",
  });

  const notifications = notifData?.notifications || [];

  // 3. Mutation to mark all read
  const markAllMutation = useMutation({
    mutationFn: api.markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("All notifications marked as read");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to mark notifications as read");
    },
  });

  // 4. Mutation to mark single read
  const markSingleMutation = useMutation({
    mutationFn: api.markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markSingleMutation.mutateAsync(notif.id);
    }
    if (notif.link) {
      navigate(notif.link);
    }
  };

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
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
            <Link to="/#features" onClick={handleScrollToFeatures} className="text-sm text-muted-foreground hover:text-foreground">Features</Link>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative text-muted-foreground hover:text-foreground flex items-center justify-center rounded-full p-1 transition-colors hover:bg-muted/50 focus:outline-none">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-sm animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" sideOffset={8} className="w-80 p-0 border border-border/50 shadow-xl rounded-xl overflow-hidden bg-popover">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/25">
                  <span className="text-xs font-bold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => markAllMutation.mutate()}
                      disabled={markAllMutation.isPending}
                      className="text-[10px] font-bold text-primary hover:underline disabled:opacity-50"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[350px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif: any) => (
                      <DropdownMenuItem
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex flex-col items-start px-4 py-3 border-b border-border/30 last:border-b-0 cursor-pointer transition-colors focus:bg-accent/40 ${
                          !notif.isRead ? "bg-primary/5 hover:bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between w-full gap-2">
                          <span className={`text-[11px] leading-relaxed text-left ${!notif.isRead ? "font-bold text-foreground" : "font-medium text-foreground/80"}`}>
                            {notif.title}
                          </span>
                          {!notif.isRead && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary mt-1" />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground text-left mt-0.5 leading-normal">
                          {notif.body}
                        </p>
                        <span className="text-[8px] text-muted-foreground/60 mt-1">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </span>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                      <Bell className="h-7 w-7 text-muted-foreground/30 mb-2" />
                      <p className="text-[11px] font-bold text-foreground">All caught up!</p>
                      <p className="text-[9px] text-muted-foreground mt-0.5">No new notifications.</p>
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
