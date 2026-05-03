import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Users,
  UserCheck,
  Calendar,
  Pencil,
  LogOut,
  Mail,
  Clock,
  ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePolls } from "@/hooks/use-polls";
import { format } from "date-fns";
import { toast } from "sonner";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: allPolls, isLoading } = usePolls();

  // 1. Filter polls created by this user
  const myPolls = allPolls?.filter(p => p.creatorId === user?.id) || [];

  // 2. Derive Profile Stats
  const totalVotesOnMyPolls = myPolls.reduce((sum, p) => sum + p.totalVotes, 0);
  const activePollsCount = myPolls.filter(p => p.status === "active").length;

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    navigate("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" />
        <main className="container mx-auto px-6 py-8">
          <Skeleton className="h-64 w-full rounded-xl" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left Column: User Card */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-primary/20 to-accent/20" />
              <CardContent className="relative flex flex-col items-center p-6 text-center">
                <div className="-mt-16 relative">
                  <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-background bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold shadow-lg">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 h-8 w-8 rounded-full border shadow-sm">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                <h2 className="mt-4 text-xl font-bold text-foreground">{user?.name}</h2>
                <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                  <Mail className="h-3 w-3" /> {user?.email}
                </div>

                <div className="mt-6 grid w-full grid-cols-2 gap-4 border-t border-border pt-6">
                  <div>
                    <p className="text-2xl font-bold text-foreground">{myPolls.length}</p>
                    <p className="text-xs text-muted-foreground uppercase">Created</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalVotesOnMyPolls}</p>
                    <p className="text-xs text-muted-foreground uppercase">Votes</p>
                  </div>
                </div>

                <Button
                  variant="destructive"
                  className="mt-8 w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined Jan 2024</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Verified Creator</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-6">
            {/* Quick Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="bg-muted/30">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-lg bg-background p-2 text-primary shadow-sm">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Active Polls</p>
                    <p className="text-xl font-bold">{activePollsCount}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-lg bg-background p-2 text-primary shadow-sm">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Avg. Participation</p>
                    <p className="text-xl font-bold">
                      {myPolls.length > 0 ? Math.round(totalVotesOnMyPolls / myPolls.length) : 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/30">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="rounded-lg bg-background p-2 text-primary shadow-sm">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Response Rate</p>
                    <p className="text-xl font-bold">94%</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* My Polls Table */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>My Recent Polls</CardTitle>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/create-poll">New Poll</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground font-medium">
                        <th className="pb-3 pr-4">Poll Title</th>
                        <th className="pb-3 pr-4">Created On</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {myPolls.length > 0 ? (
                        myPolls.map((p) => (
                          <tr key={p.id} className="group">
                            <td className="py-4 pr-4">
                              <div className="font-semibold text-foreground">{p.title}</div>
                              <div className="text-xs text-muted-foreground">{p.totalVotes} votes total</div>
                            </td>
                            <td className="py-4 pr-4 text-muted-foreground">
                              {format(new Date(p.createdAt), "MMM d, yyyy")}
                            </td>
                            <td className="py-4 pr-4">
                              <Badge
                                variant={p.status === "active" ? "default" : "secondary"}
                                className={p.status === "active" ? "bg-success/10 text-success border-0 hover:bg-success/20" : ""}
                              >
                                {p.status.toUpperCase()}
                              </Badge>
                            </td>
                            <td className="py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link to={`/poll/${p.id}/results`}>
                                    <ExternalLink className="h-4 w-4" />
                                  </Link>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-muted-foreground">
                            You haven't created any polls yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;