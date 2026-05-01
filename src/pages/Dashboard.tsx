import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Users, Radio, Plus, Share2, CheckCircle, MessageSquare, UserPlus } from "lucide-react";
import { usePolls } from "@/hooks/use-polls";

const Dashboard = () => {
  const { data: polls, isLoading } = usePolls();

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage your active polls and track results in real-time.</p>
          </div>
          <Button asChild>
            <Link to="/create-poll"><Plus className="mr-2 h-4 w-4" />Create New Poll</Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-foreground">Recent Polls</h2>

            {isLoading ? (
              [1, 2, 3].map((i) => (
                <Card key={i} className="w-full">
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-1/3 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))
            ) : (
              polls?.map((poll) => (
                <Card key={poll.id} className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-center gap-2">
                          <Badge variant={poll.status === "active" ? "default" : "secondary"} className={poll.status === "active" ? "bg-success/10 text-success hover:bg-success/20 border-0" : ""}>
                            {poll.status.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{poll.category || "General"}</span>
                        </div>
                        <h3 className="mt-3 text-xl font-bold text-foreground">{poll.title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{poll.description}</p>

                        <div className="mt-6 flex items-center gap-6">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="font-medium text-foreground">{poll.totalVotes}</span> votes
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <CheckCircle className="h-4 w-4" />
                            <span>Ends in 3 days</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center border-t border-border bg-muted/30 p-4 sm:w-48 sm:border-l sm:border-t-0">
                        <Button asChild variant="outline" size="sm" className="w-full">
                          <Link to={`/poll/${poll.id}/results`}><BarChart3 className="mr-2 h-4 w-4" />Results</Link>
                        </Button>
                        <Button asChild size="sm" className="mt-2 w-full">
                          <Link to={`/poll/${poll.id}`}><Share2 className="mr-2 h-4 w-4" />Share</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Activity Feed</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {[
                  { icon: CheckCircle, text: 'Poll "Design Feedback" closed', time: "5 hours ago" },
                  { icon: MessageSquare, text: "New comment on your poll", time: "Yesterday" },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                      <a.icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.text}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;