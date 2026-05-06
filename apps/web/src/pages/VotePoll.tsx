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
import { apiClient } from "@/lib/httpClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const VotePoll = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [alreadyVoted, setAlreadyVoted] = useState(false);

  const { data: poll, isLoading: pollLoading } = usePoll(id || "");
  const voteMutation = useCastVote();

  const [hasDemographics, setHasDemographics] = useState<boolean | null>(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoAge, setDemoAge] = useState("");
  const [demoGender, setDemoGender] = useState("");
  const [demoCountry, setDemoCountry] = useState("");
  const [savingDemo, setSavingDemo] = useState(false);

  // Fetch demographics on mount to verify completion
  useEffect(() => {
    if (user) {
      apiClient.get("/v1/users/me/demographics")
        .then((res) => {
          if (res.data?.success && res.data.data) {
            const d = res.data.data;
            if (d.ageRange && d.gender && d.country) {
              setHasDemographics(true);
              setDemoAge(d.ageRange);
              setDemoGender(d.gender);
              setDemoCountry(d.country);
            } else {
              setHasDemographics(false);
            }
          } else {
            setHasDemographics(false);
          }
        })
        .catch(() => setHasDemographics(false));
    }
  }, [user]);

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

  const handleVoteSubmission = async (overrideDemographics: boolean = false) => {
    if (!id || !user || !poll) return;

    if (!hasDemographics && !overrideDemographics) {
      setIsDemoModalOpen(true);
      return;
    }

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

  const handleSaveAndVote = async () => {
    if (!demoAge || !demoGender || !demoCountry) {
      toast.error("Please fill out all fields to submit your demographics.");
      return;
    }

    setSavingDemo(true);
    try {
      await apiClient.put("/v1/users/me/demographics", {
        ageRange: demoAge,
        gender: demoGender,
        country: demoCountry,
      });
      setHasDemographics(true);
      setIsDemoModalOpen(false);
      toast.success("Demographics saved successfully!");
      // Proceed to cast vote
      await handleVoteSubmission(true);
    } catch {
      toast.error("Failed to save demographics. Please try again.");
    } finally {
      setSavingDemo(false);
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
              onClick={() => handleVoteSubmission(false)}
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

      <Dialog open={isDemoModalOpen} onOpenChange={setIsDemoModalOpen}>
        <DialogContent className="sm:max-w-md border-primary/20 bg-background shadow-2xl rounded-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <Users className="h-6 w-6 animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-extrabold text-foreground">Demographics Required</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-2">
              VoteSphere calculates dynamic demographic breakdowns for premium creators. Please set up your demographics to proceed with voting.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-left">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Age Range</label>
              <Select value={demoAge} onValueChange={setDemoAge}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="Select age range" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="18-24">18-24 years old</SelectItem>
                  <SelectItem value="25-34">25-34 years old</SelectItem>
                  <SelectItem value="35-44">35-44 years old</SelectItem>
                  <SelectItem value="45-54">45-54 years old</SelectItem>
                  <SelectItem value="55+">55+ years old</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Gender Identity</label>
              <Select value={demoGender} onValueChange={setDemoGender}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Non-binary">Non-binary</SelectItem>
                  <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Location (Country)</label>
              <Select value={demoCountry} onValueChange={setDemoCountry}>
                <SelectTrigger className="w-full h-10"><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="United States">United States</SelectItem>
                  <SelectItem value="Germany">Germany</SelectItem>
                  <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                  <SelectItem value="France">France</SelectItem>
                  <SelectItem value="Spain">Spain</SelectItem>
                  <SelectItem value="Canada">Canada</SelectItem>
                  <SelectItem value="Australia">Australia</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            className="w-full h-11 text-sm font-bold mt-2"
            disabled={savingDemo || !demoAge || !demoGender || !demoCountry}
            onClick={handleSaveAndVote}
          >
            {savingDemo ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Save & Cast Vote"
            )}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VotePoll;