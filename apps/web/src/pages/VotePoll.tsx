import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, EyeOff, Users, CheckCircle, Vote as VoteIcon, Loader2 } from "lucide-react";
import { usePoll, useCastVote } from "@/hooks/use-polls";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";

const VotePoll = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  const { data: poll, isLoading: pollLoading } = usePoll(id || "");
  const voteMutation = useCastVote();

  // Check if user already voted on mount
  useEffect(() => {
    if (id && user) {
      api.hasVoted(id, user.id).then(setAlreadyVoted);
    }
  }, [id, user]);

  const handleVoteSubmission = async () => {
    if (!id || !selectedOption || !user || !poll) return;

    try {
      const questionId = poll.questions?.[0]?.id;
      if (!questionId) throw new Error("Question not found.");

      await voteMutation.mutateAsync({
        pollId: id,
        answers: [
          { questionId, optionId: selectedOption }
        ]
      });

      toast.success("Your vote has been counted!");
      navigate(`/poll/${id}/results`);
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to cast vote.");
    }
  };

  if (pollLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" />
        <main className="container mx-auto flex justify-center px-6 py-12">
          <Card className="w-full max-w-2xl p-8"><Skeleton className="h-64 w-full" /></Card>
        </main>
      </div>
    );
  }

  if (!poll) return <div className="text-center py-20">Poll not found.</div>;

  if (alreadyVoted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" />
        <main className="container mx-auto flex justify-center px-6 py-12">
          <Card className="w-full max-w-md p-8 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-success" />
            <h2 className="mt-4 text-xl font-bold">Already Voted</h2>
            <p className="mt-2 text-muted-foreground">You have already participated in this poll. Redirecting to results...</p>
            <Button className="mt-6 w-full" onClick={() => navigate(`/poll/${id}/results`)}>
              View Live Results
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto flex justify-center px-6 py-12">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <Badge variant="outline" className="mb-4">
              <Users className="mr-1 h-3 w-3" /> PUBLIC POLL
            </Badge>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              {poll.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{poll.description}</p>

            <div className="mt-8 space-y-3 text-left">
              {poll.options.map((opt) => (
                <button
                  key={opt.id}
                  disabled={voteMutation.isPending}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`flex w-full items-center justify-between rounded-lg border-2 p-4 transition-all ${selectedOption === opt.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                    } ${voteMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 ${selectedOption === opt.id ? "border-primary bg-primary" : "border-muted-foreground/40"
                      } flex items-center justify-center`}>
                      {selectedOption === opt.id && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                    </div>
                    <span className="font-semibold text-foreground">{opt.text}</span>
                  </div>
                  <CheckCircle className={`h-5 w-5 ${selectedOption === opt.id ? "text-primary" : "text-transparent"}`} />
                </button>
              ))}
            </div>

            <Button
              className="mt-8 w-full"
              size="lg"
              disabled={!selectedOption || voteMutation.isPending}
              onClick={handleVoteSubmission}
            >
              {voteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Casting Vote...
                </>
              ) : (
                <>
                  <VoteIcon className="mr-2 h-4 w-4" /> Cast Your Vote
                </>
              )}
            </Button>

            <div className="mt-6 flex items-center justify-center gap-6 border-t border-border pt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Active</span>
              <span className="flex items-center gap-1">
                <EyeOff className="h-4 w-4" /> Results visible after voting
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VotePoll;