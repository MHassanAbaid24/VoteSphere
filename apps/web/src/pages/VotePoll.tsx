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

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  const { data: poll, isLoading: pollLoading } = usePoll(id || "");
  const voteMutation = useCastVote();

  // Check if user already voted on mount or if they are the creator
  useEffect(() => {
    if (id && user && poll) {
      if (poll.creatorId === user.id) {
        navigate(`/poll/${id}/results`, { replace: true });
        return;
      }
      api.hasVoted(id, user.id).then(setAlreadyVoted);
    }
  }, [id, user, poll, navigate]);

  const questions = poll?.questions && poll.questions.length > 0
    ? poll.questions
    : poll
      ? [
          {
            id: "default",
            text: "Cast Your Vote",
            options: poll.options,
          },
        ]
      : [];

  const handleVoteSubmission = async () => {
    if (!id || !user || !poll) return;

    try {
      const answersArray = Object.entries(answers).map(([questionId, optionId]) => {
        // If it's a virtual question, use the real first question id if available
        const realQuestionId = questionId === "default" ? (poll.questions?.[0]?.id || "default") : questionId;
        return { questionId: realQuestionId, optionId };
      });

      await voteMutation.mutateAsync({
        pollId: id,
        answers: answersArray,
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

  const allAnswered = Object.keys(answers).length === questions.length;

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

            <div className="mt-8 space-y-8 text-left">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {questions.map((q: any, qIdx: number) => (
                <div key={q.id} className="space-y-4 border-b border-border/50 pb-6 last:border-0 last:pb-0">
                  {questions.length > 1 && (
                    <h3 className="text-lg font-bold text-primary">
                      Question #{qIdx + 1}: {q.text}
                    </h3>
                  )}
                  <div className="space-y-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {(q.options || []).map((opt: any) => {
                      const isSelected = answers[q.id] === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={voteMutation.isPending}
                          onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                          className={`flex w-full items-center justify-between rounded-lg border-2 p-4 transition-all ${isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/30"
                            } ${voteMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-5 w-5 rounded-full border-2 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/40"
                              } flex items-center justify-center`}>
                              {isSelected && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                            </div>
                            <span className="font-semibold text-foreground">{opt.text}</span>
                          </div>
                          <CheckCircle className={`h-5 w-5 ${isSelected ? "text-primary" : "text-transparent"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <Button
              className="mt-8 w-full"
              size="lg"
              disabled={!allAnswered || voteMutation.isPending}
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