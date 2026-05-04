import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckSquare, MousePointerClick, BarChart3, Users } from "lucide-react";
import heroImage from "@/assets/hero-illustration.jpg";
import { apiClient } from "@/lib/httpClient";

const Landing = () => {
  const [featuredPoll, setFeaturedPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await apiClient.get("/v1/polls/featured");
        if (res.data?.success && res.data.data) {
          setFeaturedPoll(res.data.data);
        }
      } catch (err) {
        // Silently catch
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (window.location.hash === "#features") {
      const el = document.getElementById("features");
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />

      {/* Hero */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tight text-foreground lg:text-6xl">
              Create polls.{" "}
              <span className="text-primary">Collect opinions.</span> Decide faster.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Experience quick voting and real-time results with our intuitive platform. Decision making has never been this simple, whether for teams or communities.
            </p>
            <div className="mt-8 flex gap-4">
              <Button asChild size="lg">
                <Link to="/create-poll">Create a Poll</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/poll/demo">Explore Polls</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="overflow-hidden rounded-2xl">
              <img src={heroImage} alt="VoteSphere analytics preview" className="w-full max-w-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-card py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground">Powerful Features</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Everything you need to gather opinions and make informed decisions at scale.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { icon: CheckSquare, title: "Create polls instantly", desc: "Launch your poll in under a minute with our easy-to-use builder and flexible templates." },
              { icon: MousePointerClick, title: "Vote in seconds", desc: "A frictionless voting experience for your participants on any device, no account required." },
              { icon: BarChart3, title: "Real-time results", desc: "Watch the data pour in with live updates, beautiful visualizations, and exportable data." },
            ].map((f) => (
              <Card key={f.title} className="border border-border text-left">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <f.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Live Poll Preview */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <Card className="overflow-hidden border-0 bg-accent">
            <CardContent className="p-10">
              {featuredPoll ? (
                <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Live Poll Preview</h2>
                    <p className="mt-2 text-muted-foreground">
                      Try it out! This is how your participants see and interact with your polls.
                    </p>
                    <div className="mt-6 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent bg-primary">
                            <Users className="h-3 w-3 text-primary-foreground" />
                          </div>
                        ))}
                      </div>
                      <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
                        +{featuredPoll.totalVotes}
                      </span>
                      <span className="text-sm text-muted-foreground">Recently voted</span>
                    </div>
                  </div>
                  <Card className="bg-card">
                    <CardContent className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-foreground">
                        {featuredPoll.title}
                      </h3>
                      {featuredPoll.questions?.[0]?.options?.map((opt: any) => {
                        const votesCount = opt.votes || 0;
                        const pct = featuredPoll.totalVotes > 0 ? Math.round((votesCount / featuredPoll.totalVotes) * 100) : 0;
                        return (
                          <div key={opt.id} className="mb-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground">{opt.text}</span>
                              <span className="font-semibold text-primary">{pct}%</span>
                            </div>
                            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                      <Button variant="default" className="mt-4 w-full" asChild>
                        <Link to={`/poll/${featuredPoll.id}`}>Cast your vote</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ) : loading ? (
                <div className="space-y-4 max-w-md mx-auto py-10">
                  <Skeleton className="h-6 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-full mx-auto" />
                  <Skeleton className="h-4 w-5/6 mx-auto" />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto py-6">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-5 shadow-sm">
                    <MousePointerClick className="h-8 w-8" />
                  </div>
                  <h2 className="text-3xl font-extrabold text-foreground tracking-tight sm:text-4xl">
                    Be the First to Feature Your Poll
                  </h2>
                  <p className="mt-4 text-base text-muted-foreground leading-relaxed max-w-xl">
                    We only feature active public polls that have received at least 3 responses. Create a poll now and gather your first 3 responses to see your poll showcased directly on our home page!
                  </p>
                  <div className="mt-8 flex flex-wrap justify-center gap-4 w-full sm:w-auto">
                    <Button size="lg" className="px-8 shadow-md" asChild>
                      <Link to="/create-poll">Create a New Poll</Link>
                    </Button>
                    <Button size="lg" variant="outline" className="px-8 bg-background" asChild>
                      <Link to="/community">Explore Community</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto flex flex-wrap items-center justify-between px-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
              <span className="text-[10px] font-bold text-primary-foreground">V</span>
            </div>
            <span className="font-semibold text-foreground">VoteSphere</span>
          </div>
          <nav className="flex gap-6">
            <Link to="/about" className="hover:text-foreground">About Us</Link>
            <a href="https://github.com/MHassanAbaid24/VoteSphere" target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
          </nav>
          <span>© 2024 VoteSphere. Built for builders.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
