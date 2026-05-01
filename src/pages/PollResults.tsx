import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, Share2, ArrowLeft } from "lucide-react";
import { usePoll } from "@/hooks/use-polls";

const PollResults = () => {
  const { id } = useParams<{ id: string }>();
  const { data: poll, isLoading } = usePoll(id || "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" />
        <main className="container mx-auto flex justify-center px-6 py-12">
          <Card className="w-full max-w-2xl p-8">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-8" />
            <div className="space-y-6">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        </main>
      </div>
    );
  }

  if (!poll) return <div className="text-center py-20">Poll not found.</div>;

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto flex flex-col items-center px-6 py-12">
        <div className="w-full max-w-2xl mb-4">
          <Button variant="ghost" asChild size="sm">
            <Link to="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
        </div>

        <Card className="w-full max-w-2xl">
          <div className="relative h-56 overflow-hidden rounded-t-lg bg-muted">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent" />
            <Badge className="absolute bottom-4 left-4 bg-primary text-primary-foreground">
              {poll.status.toUpperCase()} POLL
            </Badge>
          </div>
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-foreground">{poll.title}</h1>
            <p className="mt-2 text-muted-foreground">{poll.description}</p>

            <div className="mt-8 space-y-6">
              {poll.options.map((opt) => {
                const percentage = poll.totalVotes > 0
                  ? Math.round((opt.votes / poll.totalVotes) * 100)
                  : 0;

                return (
                  <div key={opt.id}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">{opt.text}</span>
                      <span className="text-lg font-bold text-primary">{percentage}%</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {opt.votes.toLocaleString()} votes
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> Total Votes: {poll.totalVotes.toLocaleString()}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Created {new Date(poll.createdAt).toLocaleDateString()}
              </span>
            </div>

            <Button className="mt-6 w-full" size="lg" onClick={() => navigator.clipboard.writeText(window.location.href)}>
              Share Results <Share2 className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default PollResults;