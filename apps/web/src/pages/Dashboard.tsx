import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Users,
  Radio,
  Plus,
  Share2,
  CheckCircle,
  MessageSquare,
  UserPlus,
  ArrowUpRight,
  Clock,
  Inbox
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePolls } from "@/hooks/use-polls";
import { formatDistanceToNow, isAfter } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const { data: polls, isLoading } = usePolls();

  // 1. Filter polls for the current user
  const userPolls = polls?.filter(p => p.creatorId === user?.id) || [];
  const activePolls = userPolls.filter(p => p.status === "active");

  // 2. Calculate Analytics
  const totalVotesReceived = userPolls.reduce((sum, p) => sum + p.totalVotes, 0);
  const pollsCreated = userPolls.length;
  const activeCount = activePolls.length;

  // 3. Derived Recent Activity (Mocking activity based on existing user polls)
  const recentActivity = userPolls
    .slice(0, 4)
    .map(p => ({
      icon: UserPlus,
      text: `New activity on "${p.title}"`,
      time: formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })
    }));

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" />
        <main className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid gap-6 sm:grid-cols-3 mb-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <Skeleton className="lg:col-span-2 h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.name}!</h1>
            <p className="mt-1 text-muted-foreground">Manage your active polls and track results in real-time.</p>
          </div>
          <Button asChild>
            <Link to="/create-poll"><Plus className="mr-2 h-4 w-4" />Create New Poll</Link>
          </Button>
        </div>

        {/* Stats Section */}
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-success bg-success/10 border-0">Live</Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Polls Created</p>
                <h3 className="text-3xl font-bold text-foreground">{pollsCreated}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <Badge variant="secondary" className="text-success bg-success/10 border-0">Updating</Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Votes Received</p>
                <h3 className="text-3xl font-bold text-foreground">{totalVotesReceived.toLocaleString()}</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Radio className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Polls</p>
                <h3 className="text-3xl font-bold text-foreground">{activeCount}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Active Polls List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Active Polls</h2>
              <Link to="/profile" className="text-sm font-medium text-primary hover:underline">View All</Link>
            </div>

            {activePolls.length > 0 ? (
              <div className="grid gap-4">
                {activePolls.map((poll) => (
                  <Card key={poll.id} className="group transition-all hover:border-primary/50">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-primary group-hover:bg-primary/10">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{poll.title}</h4>
                          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {poll.totalVotes} votes</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Ends {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/poll/${poll.id}/results`}><Share2 className="mr-2 h-3.5 w-3.5" /> Share</Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link to={`/poll/${poll.id}/results`}>Results <ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-dashed py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">No active polls</h3>
                  <p className="text-muted-foreground mb-6">Create your first poll to start gathering feedback.</p>
                  <Button asChild>
                    <Link to="/create-poll"><Plus className="mr-2 h-4 w-4" /> Create Poll</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Activity Feed */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
            <Card>
              <CardContent className="grid gap-6 p-6">
                {recentActivity.length > 0 ? (
                  recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                        <a.icon className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{a.text}</p>
                        <p className="text-xs text-muted-foreground">{a.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No recent activity found.</p>
                )}
                <Button variant="ghost" size="sm" className="w-full text-primary" asChild>
                  <Link to="/profile">See all activity</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold">Pro Analytics</h3>
                <p className="mt-1 text-sm opacity-80">Get detailed demographic insights for all your active polls.</p>
                <Button variant="secondary" className="mt-4 w-full">Upgrade Now</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;