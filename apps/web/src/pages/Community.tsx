import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/httpClient";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Search,
  Users,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Flame,
  Inbox,
} from "lucide-react";

interface Poll {
  id: string;
  title: string;
  description: string;
  status: "ACTIVE" | "CLOSED";
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: string;
  expiresAt: string | null;
  totalVotes: number;
  category?: string;
  creator?: {
    id: string;
    name: string;
    email: string;
  };
}

const Community = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [trending, setTrending] = useState<Poll[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchCategories = async () => {
    try {
      const res = await apiClient.get("/v1/community/categories");
      if (res.data?.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      // Silently fail or log
    }
  };

  const fetchTrending = async () => {
    try {
      const res = await apiClient.get("/v1/community/trending?limit=5");
      if (res.data?.success) {
        setTrending(res.data.data || []);
      }
    } catch (err) {
      // Silently fail or log
    }
  };

  const fetchPolls = async (pageNum: number, category: string | null, search: string) => {
    try {
      setLoading(pageNum === 1);
      const url = `/v1/community/search?q=${encodeURIComponent(search)}&category=${encodeURIComponent(
        category || ""
      )}&page=${pageNum}&limit=10`;

      const res = await apiClient.get(url);
      if (res.data?.success) {
        const newPolls = res.data.data || [];
        if (pageNum === 1) {
          setPolls(newPolls);
        } else {
          setPolls((prev) => [...prev, ...newPolls]);
        }
        setHasMore(newPolls.length === 10);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load community feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchTrending();
  }, []);

  useEffect(() => {
    setPage(1);
    fetchPolls(1, selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPolls(nextPage, selectedCategory, searchQuery);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto px-6 py-8">
        {/* Banner with big Search Input */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Community Discovery</h1>
            <p className="mt-2 text-lg text-muted-foreground">Find public polls, trending debates, and cast your vote.</p>
          </div>
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search polls by title or content..."
              className="pl-9 w-full bg-card"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories filters scrollable / wrapped */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            className="rounded-full text-sm font-medium h-9"
            onClick={() => setSelectedCategory(null)}
          >
            All Topics
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? "default" : "outline"}
              className="rounded-full text-sm font-medium h-9"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Dynamic content grid (Left feed, Right trending sidebar) */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main feed listing polls */}
          <div className="lg:col-span-2 space-y-6">
            {loading && page === 1 ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : polls.length > 0 ? (
              <>
                <div className="grid gap-4">
                  {polls.map((poll) => (
                    <Card key={poll.id} className="group transition-all hover:border-primary/50">
                      <CardContent className="flex flex-col p-6">
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              {poll.category && (
                                <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5">
                                  {poll.category}
                                </Badge>
                              )}
                              <Badge variant="outline" className="capitalize text-muted-foreground bg-muted/30">
                                {poll.status.toLowerCase()}
                              </Badge>
                            </div>
                            <h3 className="text-xl font-bold text-foreground mt-2 group-hover:text-primary transition-colors">
                              {poll.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-2 max-w-xl line-clamp-2">
                              {poll.description || "No description provided."}
                            </p>
                          </div>

                          <Button asChild className="shrink-0">
                            <Link to={`/poll/${poll.id}`}>
                              Vote <ArrowUpRight className="ml-1.5 h-4 w-4" />
                            </Link>
                          </Button>
                        </div>

                        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" /> {poll.totalVotes} votes
                            </span>
                            {poll.expiresAt && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" /> Expires {formatDistanceToNow(new Date(poll.expiresAt), { addSuffix: true })}
                              </span>
                            )}
                          </div>
                          <span>Posted {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {hasMore && (
                  <Button variant="outline" className="w-full mt-4 h-11 text-sm" onClick={handleLoadMore}>
                    Load More Polls
                  </Button>
                )}
              </>
            ) : (
              <Card className="border-dashed py-16 text-center">
                <CardContent className="flex flex-col items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">No polls found</h3>
                  <p className="text-muted-foreground max-w-sm mt-1">We couldn't find any public polls matching your filters. Try a different topic or keyword.</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Trending sidebar */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-xl font-bold text-foreground">Trending Polls</h2>
            </div>

            <Card className="bg-card">
              <CardContent className="p-4 grid gap-4">
                {trending.length > 0 ? (
                  trending.map((p, idx) => (
                    <div key={p.id} className="flex items-start gap-3 border-b border-border/50 last:border-0 pb-3 last:pb-0">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-orange-100 text-xs font-bold text-orange-600">
                        {idx + 1}
                      </span>
                      <div className="flex-1 overflow-hidden">
                        <Link to={`/poll/${p.id}`} className="text-sm font-semibold text-foreground hover:text-primary transition-colors block truncate">
                          {p.title}
                        </Link>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {p.totalVotes} votes</span>
                          {p.category && <span className="truncate">{p.category}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No trending activity yet.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-500/10 via-primary/10 to-transparent border-primary/20">
              <CardContent className="p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Have a question?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Gather instant responses and dynamic insights from the community.</p>
                </div>
                <Button className="mt-4 w-full" asChild>
                  <Link to="/create-poll">Launch a Poll</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;
