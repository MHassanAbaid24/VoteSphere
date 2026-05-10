import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Calendar, Share2, ArrowLeft, Loader2, Info, Sparkles, AlertCircle, BarChart3, CheckCircle2, Clock } from "lucide-react";
import { usePoll, useAiValidation } from "@/hooks/use-polls";
import { PersonaCarousel } from "@/components/PersonaCarousel";
import { FeasibilityScore } from "@/components/FeasibilityScore";
import { VoteComparison } from "@/components/VoteComparison";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/httpClient";
import { api, AiInsightStatus } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PollResults = () => {
  const { id } = useParams<{ id: string }>();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [demographics, setDemographics] = useState<any>(null);
  const [loadingDemographics, setLoadingDemographics] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [aiSubmitting, setAiSubmitting] = useState(false);

  useEffect(() => {
    if (id && user?.isPremium) {
      setLoadingDemographics(true);
      apiClient.get(`/v1/analytics/polls/${id}/demographics`)
        .then((res) => {
          if (res.data?.success) {
            setDemographics(res.data.data);
          }
        })
        .catch(() => { })
        .finally(() => setLoadingDemographics(false));
    }
  }, [id, user]);

  // Use the useAiValidation hook to automatically poll status
  const { data: aiStatus, isLoading: aiStatusLoading } = useAiValidation(
    id && user?.isPremium ? id : ""
  );

  const generationLimitReached = (aiStatus?.generationCount || 0) >= 3;

  const handleUpgradeToPremium = async () => {
    setUpgrading(true);
    try {
      const res = await apiClient.patch("/v1/users/me", { isPremium: true });
      if (res.data?.success) {
        toast.success("Welcome to VoteSphere Pro!");
        await refreshUser();
        setUpgradeOpen(false);
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Upgrade failed. Please try again later.");
    } finally {
      setUpgrading(false);
    }
  };

  // Use refetchInterval: 3000 to simulate live updates every 3 seconds
  const { data: poll, isLoading, isRefetching } = usePoll(id || "");

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Results link copied to clipboard!");
  };

  const handleAiValidate = async () => {
    if (!id) return;
    if (!user?.isPremium) {
      setUpgradeOpen(true);
      return;
    }

    setAiSubmitting(true);
    try {
      await api.startAiValidation(id);
      toast.success("AI validation started.");
      // Re-fetch status IMMEDIATELY before enabling UI so state cascades correctly to PENDING view.
      await queryClient.invalidateQueries({ queryKey: ["aiValidation", id] });
    } catch (err: any) {
      toast.error(err.message || "Failed to start AI validation.");
    } finally {
      setAiSubmitting(false);
    }
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

  const isOwner = user && poll.creatorId === user.id;

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" />
        <main className="container mx-auto flex justify-center px-6 py-12">
          <Card className="w-full max-w-md p-8 text-center border-destructive/20 bg-destructive/5 shadow-lg rounded-2xl">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-xl font-bold text-foreground">Access Denied</h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Only the creator of this poll is authorized to view its detailed analytical results.
            </p>
            <Button className="mt-6 w-full" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
              </Link>
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
        <Card className="w-full max-w-2xl border-primary/20 shadow-lg">
          {/* Cover Header */}
          <div className="relative h-48 overflow-hidden rounded-t-lg bg-muted">
            {poll.coverImage ? (
              <>
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-muted via-accent/30 to-muted animate-shimmer bg-[length:200%_100%]" />
                )}
                <img
                  src={poll.coverImage}
                  alt={imageLoaded ? "Cover" : ""}
                  onLoad={() => setImageLoaded(true)}
                  className={cn(
                    "h-full w-full object-cover transition-opacity duration-500",
                    imageLoaded ? "opacity-100" : "opacity-0"
                  )}
                />
              </>
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

            <div className="mt-10 space-y-10">
              {(() => {
                const questions = poll.questions && poll.questions.length > 0
                  ? poll.questions
                  : [
                    {
                      id: "default",
                      text: "Results",
                      options: poll.options,
                    },
                  ];

                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                return questions.map((q: any, qIdx: number) => {
                  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                  const questionTotalVotes = q.options.reduce((sum: number, opt: any) => sum + (opt.votes || 0), 0);

                  return (
                    <div key={q.id} className="space-y-4 border-b border-border/50 pb-8 last:border-0 last:pb-0">
                      {questions.length > 1 && (
                        <h3 className="text-lg font-bold text-primary">
                          Question #{qIdx + 1}: {q.text}
                        </h3>
                      )}
                      <div className="space-y-6">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(q.options || []).map((opt: any) => {
                          const percentage = questionTotalVotes > 0
                            ? Math.round((opt.votes / questionTotalVotes) * 100)
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
                    </div>
                  );
                });
              })()}
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

            {/* Pro Demographics Analytics Section */}
            <div className="mt-8 border-t border-border pt-6 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Pro Demographics Analytics
                </h3>
                {!user?.isPremium && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 gap-1 font-semibold">
                    <Sparkles className="h-3.5 w-3.5" /> PRO
                  </Badge>
                )}
              </div>

              {user?.isPremium ? (
                loadingDemographics ? (
                  <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" /> Loading demographic breakdown...
                  </div>
                ) : demographics?.insufficientData ? (
                  <Card className="border-warning/20 bg-warning/5">
                    <CardContent className="p-4 flex gap-3 text-sm text-warning/80">
                      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-warning" />
                      <div>
                        <p className="font-bold">Privacy Threshold Locked</p>
                        <p className="text-xs mt-1 leading-relaxed">
                          To protect voter privacy, demographic breakdowns are locked until at least **5 unique voters** participate in this poll.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : demographics ? (
                  <div className="grid gap-6 sm:grid-cols-3 bg-muted/20 rounded-xl p-5 border border-border/50">
                    {/* Age Range */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age Groups</h4>
                      <div className="space-y-2">
                        {demographics.ageRange?.length > 0 ? (
                          demographics.ageRange.map((g: any) => (
                            <div key={g.name} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-foreground">
                                <span>{g.name}</span>
                                <span>{g.percentage}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${g.percentage}%` }} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-muted-foreground">No age data available.</p>
                        )}
                      </div>
                    </div>

                    {/* Gender */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</h4>
                      <div className="space-y-2">
                        {demographics.gender?.length > 0 ? (
                          demographics.gender.map((g: any) => (
                            <div key={g.name} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-foreground">
                                <span>{g.name}</span>
                                <span>{g.percentage}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${g.percentage}%` }} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-muted-foreground">No gender data available.</p>
                        )}
                      </div>
                    </div>

                    {/* Country */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Top Locations</h4>
                      <div className="space-y-2">
                        {demographics.country?.length > 0 ? (
                          demographics.country.map((g: any) => (
                            <div key={g.name} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-semibold text-foreground">
                                <span>{g.name}</span>
                                <span>{g.percentage}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${g.percentage}%` }} />
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-muted-foreground">No location data available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    Failed to fetch demographic metrics.
                  </div>
                )
              ) : (
                <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-sm p-6 bg-card">
                  {/* Blurred mock graphic */}
                  <div className="grid gap-6 sm:grid-cols-3 filter blur-sm opacity-30 select-none">
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" /><div className="h-3 w-4/5 bg-muted rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" /><div className="h-3 w-4/5 bg-muted rounded" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-20 bg-muted rounded" />
                      <div className="h-3 w-full bg-muted rounded" /><div className="h-3 w-4/5 bg-muted rounded" />
                    </div>
                  </div>

                  {/* Lock Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-[2px] p-4 text-center">
                    <Sparkles className="h-8 w-8 text-primary animate-pulse mb-2" />
                    <h4 className="text-sm font-bold text-foreground">Unlock Voter Demographics</h4>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm leading-relaxed">
                      Analyze voter age, gender, and geographical distributions to target and interpret results with precision.
                    </p>
                    <Button size="sm" className="mt-4 font-bold text-xs" onClick={() => setUpgradeOpen(true)}>
                      Upgrade to Pro
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Premium Upgrade Confirmation Dialog */}
            <Dialog open={upgradeOpen} onOpenChange={setUpgradeOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center sm:text-left">
                  <DialogTitle className="flex items-center gap-2 text-primary font-extrabold text-xl">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 animate-pulse" /> Upgrade to VoteSphere Pro
                  </DialogTitle>
                  <DialogDescription className="pt-2 leading-relaxed text-sm">
                    Are you sure you want to become a **Premium Member**?
                    Upgrading to VoteSphere Pro instantly unlocks:
                  </DialogDescription>
                  <div className="mt-4 space-y-2.5 text-xs text-foreground bg-muted/30 p-3.5 rounded-lg border border-border/40">
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-bold">✨</span>
                      <span>Real-time detailed demographic breakdowns.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-bold">📊</span>
                      <span>Advanced user age, gender, and location analysis.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-primary font-bold">📈</span>
                      <span>Premium poll filters and participant insights.</span>
                    </div>
                  </div>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0 mt-6">
                  <Button variant="outline" onClick={() => setUpgradeOpen(false)} disabled={upgrading}>
                    Cancel
                  </Button>
                  <Button onClick={handleUpgradeToPremium} disabled={upgrading} className="font-bold">
                    {upgrading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Upgrading...
                      </>
                    ) : (
                      "Yes, Upgrade"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* AI Validation Section */}
            <div className="mt-8 border-t border-border pt-6 text-left">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> AI Synthetic Audience Validation
                </h3>
                {!user?.isPremium && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 gap-1 font-semibold">
                    <Sparkles className="h-3.5 w-3.5" /> PRO
                  </Badge>
                )}
              </div>

              {!aiStatus ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Launch a premium AI validation run for this poll and monitor progress. 
                    <span className="block mt-1 text-xs font-medium text-primary/70">Usage: {aiStatus?.generationCount || 0}/3 runs used</span>
                  </p>
                  <Button className="mt-4" onClick={handleAiValidate} disabled={aiSubmitting || generationLimitReached}>
                    {aiSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
                      </>
                    ) : generationLimitReached ? (
                      "Generation Limit Reached (3/3)"
                    ) : (
                      "Validate with AI"
                    )}
                  </Button>
                </>
              ) : aiStatus?.status === "PENDING" || aiStatus?.status === "PROCESSING" ? (
                // Glassmorphic loading card
                <div className="mt-4 p-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 backdrop-blur-sm">
                  <div className="space-y-4">
                    {/* Progress bar with pulsing effect */}
                    <div className="relative h-2 bg-primary/10 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full bg-gradient-to-r from-primary to-primary/50 rounded-full transition-all duration-300",
                          aiStatus?.status === "PENDING" ? "w-1/3 animate-pulse" : "w-2/3 animate-pulse"
                        )}
                      />
                    </div>

                    {/* Status steps */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {aiStatus?.status === "PENDING" ? (
                          <Clock className="h-4 w-4 text-primary animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                        <span className={cn(
                          "text-sm font-medium transition-all",
                          aiStatus?.status !== "PENDING" ? "text-primary" : "text-primary/60 animate-pulse"
                        )}>
                          {aiStatus?.status !== "PENDING" ? "Step 1: Fetching Web Competitors" : "Step 1: Fetching Web Competitors"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {aiStatus?.status === "PROCESSING" ? (
                          <Clock className="h-4 w-4 text-primary animate-spin" />
                        ) : aiStatus?.status === "PENDING" ? (
                          <div className="h-4 w-4 rounded-full border-2 border-primary/20" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                        <span className={cn(
                          "text-sm font-medium transition-all",
                          aiStatus?.status === "PROCESSING" ? "text-primary/60 animate-pulse" : aiStatus?.status === "PENDING" ? "text-muted-foreground" : "text-primary"
                        )}>
                          {aiStatus?.status === "PROCESSING" ? "Step 2: Synthesizing Personas" : "Step 2: Synthesizing Personas"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full border-2 border-primary/20" />
                        <span className="text-sm font-medium text-muted-foreground">Step 3: Generating Analysis</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-3">
                      {aiStatus?.status === "PENDING" ? "Searching current industry trends..." : "Synthesizing market insights..."}
                    </p>
                  </div>
                </div>
              ) : aiStatus?.status === "COMPLETED" ? (
                <div className="mt-4 space-y-4">
                  <div className="p-4 rounded-lg border border-green-500/30 bg-gradient-to-br from-green-500/5 to-green-500/5 backdrop-blur-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-green-700">AI Validation Complete!</span>
                    </div>
                    <p className="text-sm text-muted-foreground flex flex-col">
                      <span>Your synthetic audience analysis is ready. Detailed results coming soon.</span>
                      <span className="text-xs font-semibold mt-1 text-green-800/60">Credits used: {aiStatus?.generationCount ?? 0}/3</span>
                    </p>
                    <Button size="sm" variant="outline" className="mt-3 bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20 hover:text-green-800" onClick={handleAiValidate} disabled={aiSubmitting || generationLimitReached}>
                      {aiSubmitting ? (
                        <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Restarting...</>
                      ) : generationLimitReached ? (
                        <>Limit Reached (3/3)</>
                      ) : (
                        <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Regenerate Analysis</>
                      )}
                    </Button>
                  </div>

                  {/* Sources Section */}
                  {aiStatus?.sources && Array.isArray(aiStatus.sources) && aiStatus.sources.length > 0 && (
                    <div className="p-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/5 backdrop-blur-sm">
                      <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-primary" /> Verified References & Sources
                      </h4>
                      <div className="space-y-2">
                        {(aiStatus.sources as Array<{ title?: string; url?: string }>).map((source, idx) => (
                          source.title && source.url ? (
                            <div key={idx} className="group">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-colors group-hover:underline"
                              >
                                <Badge variant="outline" className="text-xs">Source {idx + 1}</Badge>
                                <span className="truncate max-w-xs">{source.title}</span>
                              </a>
                            </div>
                          ) : null
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personas Section */}
                  {aiStatus?.personaFeedback && Array.isArray(aiStatus.personaFeedback) && aiStatus.personaFeedback.length > 0 && (
                    <div className="p-4 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/5 backdrop-blur-sm">
                      <PersonaCarousel personas={aiStatus.personaFeedback as Array<{ name: string; role: string; quote: string; avatar?: string }>} />
                    </div>
                  )}

                  {/* Vote Comparison Section */}
                  {aiStatus?.simulatedVotes && 
                   poll && Array.isArray(poll.questions) && poll.questions.length > 0 && 
                   Object.keys(aiStatus.simulatedVotes).length > 0 && (
                     <div className="p-6 rounded-lg border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/5 backdrop-blur-sm">
                       <h3 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                         <BarChart3 className="h-5 w-5 text-primary" /> Real vs. AI Projected Votes
                       </h3>
                      <div className="space-y-6">
                        {poll.questions.map((question) => {
                          const simulatedByQuestion = (aiStatus.simulatedVotes as Record<string, Record<string, number>>)[question.id];
                          if (!simulatedByQuestion) return null;
                          
                          const realVotes: Record<string, number> = {};
                          question.options.forEach((opt) => {
                            realVotes[opt.id] = opt.votes || 0;
                          });

                          return (
                            <VoteComparison
                              key={question.id}
                              questionId={question.id}
                              questionText={question.text}
                              data={{
                                realVotes,
                                simulatedVotes: simulatedByQuestion,
                                options: question.options,
                              }}
                            />
                          );
                        })}
                      </div>
                      <div className="mt-6 pt-6 border-t border-primary/10 flex gap-6">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
                          <span className="text-xs text-muted-foreground">Real Human Votes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-gradient-to-r from-purple-500 to-purple-600"></div>
                          <span className="text-xs text-muted-foreground">AI Projected Votes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Feasibility Score Section */}
                  {aiStatus?.score && aiStatus.score > 0 && (
                    <FeasibilityScore 
                      score={aiStatus.score} 
                      summary={aiStatus.summary || 'Analysis complete'} 
                    />
                  )}
                </div>
              ) : aiStatus?.status === "FAILED" ? (
                <div className="mt-4 p-4 rounded-lg border border-red-500/30 bg-gradient-to-br from-red-500/5 to-red-500/5 backdrop-blur-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium text-red-700">Validation Failed</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {aiStatus?.errorMessage 
                      ? `Error: ${aiStatus.errorMessage}` 
                      : "Please try again later or contact support if the problem persists."}
                    <span className="block mt-1 text-xs font-semibold">Remaining tries: {3 - Math.min(3, (aiStatus?.generationCount || 0))} / 3</span>
                  </p>
                  <Button className="mt-4 w-full sm:w-auto" variant="destructive" onClick={handleAiValidate} disabled={aiSubmitting || generationLimitReached}>
                    {aiSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Retrying...
                      </>
                    ) : generationLimitReached ? (
                      "Max Generation Limit Reached (3/3)"
                    ) : (
                      "Retry Validation"
                    )}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="mt-8 flex gap-3">
              <Button onClick={handleShare} variant="outline" className="flex-1" size="lg">
                <Share2 className="mr-2 h-4 w-4" /> Share Results
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2026 VoteSphere. Results are calculated in real-time.
      </footer>
    </div>
  );
};

export default PollResults;
