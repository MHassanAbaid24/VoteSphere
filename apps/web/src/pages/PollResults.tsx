import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, Share2, ArrowLeft, Loader2, Info } from "lucide-react";
import { usePoll } from "@/hooks/use-polls";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const PollResults = () => {
  const { id } = useParams<{ id: string }>();

  // Use refetchInterval: 3000 to simulate live updates every 3 seconds
  const { data: poll, isLoading, isRefetching } = usePoll(id || "");

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Results link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" />
        <main className="container mx-auto flex justify-center px-6 py-12">
          <Card className="w-full max-w-2xl p-8"><Skeleton className="h-80 w-full" /></Card>
        </main>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold">Poll not found</h2>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/dashboard">Return to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto flex justify-center px-6 py-12">
        <Card className="w-full max-w-2xl border-primary/20 shadow-lg">
          {/* Cover Header */}
          <div className="relative h-48 overflow-hidden rounded-t-lg bg-muted">
            {poll.coverImage ? (
              <img src={poll.coverImage} alt="Cover" className="h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
            )}
            <div className="absolute bottom-4 left-4 flex gap-2">
              <Badge className={poll.status === "active" ? "bg-success hover:bg-success" : "bg-muted text-muted-foreground"}>
                {poll.status === "active" ? "● LIVE" : "CLOSED"}
              </Badge>
              {isRefetching && (
                <Badge variant="outline" className="bg-background/80 animate-pulse border-primary/30">
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" /> Syncing...
                </Badge>
              )}
            </div>
          </div>

          <CardContent className="p-8">
            <Link to="/dashboard" className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
            </Link>

            <h1 className="text-2xl font-bold text-foreground md:text-3xl">{poll.title}</h1>
            <p className="mt-2 text-muted-foreground">{poll.description}</p>

            <div className="mt-10 space-y-8">
              {poll.options.map((opt) => {
                // Dynamic Calculation
                const percentage = poll.totalVotes > 0
                  ? Math.round((opt.votes / poll.totalVotes) * 100)
                  : 0;

                return (
                  <div key={opt.id} className="relative">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-semibold text-foreground">{opt.text}</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-primary">{percentage}%</span>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {opt.votes.toLocaleString()} votes
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Stats */}
            <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span className="font-medium text-foreground">{poll.totalVotes.toLocaleString()}</span> Total Votes
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  Ends {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  <Info className="mr-1 h-3 w-3" /> Real-time updates enabled
                </Badge>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <Button onClick={handleShare} variant="outline" className="flex-1" size="lg">
                <Share2 className="mr-2 h-4 w-4" /> Share Results
              </Button>
              <Button asChild className="flex-1" size="lg">
                <Link to={`/poll/${poll.id}`}>Vote Again</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2024 VoteSphere. Results are calculated in real-time.
      </footer>
    </div>
  );
};

export default PollResults;