import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, EyeOff, Users, CheckCircle, Vote as VoteIcon } from "lucide-react";
import { usePoll, useCastVote } from "@/hooks/use-polls";
import { toast } from "sonner";

const VotePoll = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const { data: poll, isLoading } = usePoll(id || "");
  const voteMutation = useCastVote();

  const handleVote = async () => {
    if (!id || !selectedOption) return;

    try {
      await voteMutation.mutateAsync({ pollId: id, optionId: selectedOption });
      toast.success("Vote cast successfully!");
      navigate(`/poll/${id}/results`);
    } catch (error) {
      toast.error("Failed to cast vote.");
    }
  };

  if (isLoading) {
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto flex justify-center px-6 py-12">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <Badge variant="outline" className="mb-4">
              <Users className="mr-1 h-3 w-3" /> {poll.category || "PUBLIC POLL"}
            </Badge>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              {poll.title}
            </h1>
            <p className="mt-2 text-muted-foreground">{poll.description}</p>

            <div className="mt-8 space-y-3 text-left">
              {poll.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`flex w-full items-center justify-between rounded-lg border-2 p-4 transition-all ${selectedOption === opt.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                    }`}
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
              onClick={handleVote}
            >
              <VoteIcon className="mr-2 h-4 w-4" />
              {voteMutation.isPending ? "Casting Vote..." : "Cast Your Vote"}
            </Button>

            <div className="mt-6 flex items-center justify-center gap-6 border-t border-border pt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Active</span>
              <span className="flex items-center gap-1">
                <EyeOff className="h-4 w-4" /> {poll.visibility === 'private' ? 'Private results' : 'Public results'}
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default VotePoll;