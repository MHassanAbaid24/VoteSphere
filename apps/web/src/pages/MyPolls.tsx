import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { apiClient } from "@/lib/httpClient";
import { formatDistanceToNow } from "date-fns";
import {
  Plus,
  Inbox,
  Trash,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Poll {
  id: string;
  title: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  visibility: "PUBLIC" | "PRIVATE";
  createdAt: string;
  expiresAt: string | null;
  totalVotes: number;
}

const MyPolls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<"ALL" | "DRAFT" | "ACTIVE" | "CLOSED">("ALL");
  const [pollToDelete, setPollToDelete] = useState<string | null>(null);
  const [pollToClose, setPollToClose] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchMyPolls = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/v1/polls/me");
      if (res.data?.success) {
        setPolls(res.data.data || []);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load your polls.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPolls();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await apiClient.delete(`/v1/polls/${id}`);
      if (res.data?.success) {
        toast.success("Poll soft deleted successfully");
        await fetchMyPolls();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete poll.");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await apiClient.post(`/v1/polls/${id}/publish`);
      if (res.data?.success) {
        toast.success("Poll successfully published!");
        await fetchMyPolls();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to publish poll.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleClose = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await apiClient.post(`/v1/polls/${id}/close`);
      if (res.data?.success) {
        toast.success("Poll successfully closed!");
        await fetchMyPolls();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to close poll.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPolls = polls.filter((p) => {
    if (selectedTab === "ALL") return true;
    return p.status === selectedTab;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar variant="app" />
        <main className="container mx-auto px-6 py-8">
          <div className="flex justify-between items-center mb-8">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto px-6 py-8">
        {/* Header section */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Polls</h1>
            <p className="mt-1 text-muted-foreground">Manage, view, and organize all your interactive polls.</p>
          </div>
          <Button asChild>
            <Link to="/create-poll"><Plus className="mr-2 h-4 w-4" />Create New Poll</Link>
          </Button>
        </div>

        {/* Tab switcher */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit mb-8">
          {(["ALL", "DRAFT", "ACTIVE", "CLOSED"] as const).map((tab) => (
            <Button
              key={tab}
              variant={selectedTab === tab ? "default" : "ghost"}
              className="text-sm font-medium px-4 py-1"
              onClick={() => setSelectedTab(tab)}
            >
              {tab === "ALL" ? "All Polls" : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Button>
          ))}
        </div>

        {/* List of filtered polls */}
        {filteredPolls.length > 0 ? (
          <div className="grid gap-4">
            {filteredPolls.map((poll) => (
              <Card key={poll.id} className="group transition-all hover:border-primary/50">
                <CardContent className="flex items-center justify-between p-6 flex-wrap gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-foreground text-lg">{poll.title}</h4>
                      <Badge
                        variant="secondary"
                        className={`${
                          poll.status === "ACTIVE"
                            ? "text-success bg-success/10"
                            : poll.status === "CLOSED"
                            ? "text-destructive bg-destructive/10"
                            : "text-muted-foreground bg-muted"
                        } border-0 capitalize`}
                      >
                        {poll.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl truncate">{poll.description || "No description provided."}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{poll.totalVotes} total votes</span>
                      <span>
                        Created {formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Publicly active poll allows result viewing */}
                    {poll.status === "ACTIVE" && (
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/poll/${poll.id}/results`}><ArrowUpRight className="mr-1.5 h-3.5 w-3.5" />View Results</Link>
                      </Button>
                    )}

                    {poll.status === "DRAFT" && (
                      <Button 
                        size="sm" 
                        onClick={() => handlePublish(poll.id)} 
                        className="bg-success hover:bg-success/90"
                        disabled={!!processingId}
                      >
                        {processingId === poll.id ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-1.5 h-3.5 w-3.5" />}
                        Publish
                      </Button>
                    )}

                    {poll.status === "ACTIVE" && (
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => setPollToClose(poll.id)}
                        disabled={!!processingId}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />Close Poll
                      </Button>
                    )}

                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => setPollToDelete(poll.id)}
                      disabled={!!processingId}
                    >
                      <Trash className="mr-1.5 h-3.5 w-3.5" />Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                <Inbox className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No polls found</h3>
              <p className="text-muted-foreground mb-6">Start by creating your first draft or active poll today.</p>
              <Button asChild>
                <Link to="/create-poll"><Plus className="mr-2 h-4 w-4" /> Create Poll</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Alert Dialogs for Delete / Close Confirmation */}
      <AlertDialog open={!!pollToDelete} onOpenChange={(open) => !open && setPollToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this poll?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will soft-delete your poll. It will be removed from your dashboard and public listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={() => {
                if (pollToDelete) {
                  handleDelete(pollToDelete);
                  setPollToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pollToClose} onOpenChange={(open) => !open && setPollToClose(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to close this poll?</AlertDialogTitle>
            <AlertDialogDescription>
              Once a poll is closed, no further votes can be cast on it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pollToClose) {
                  handleClose(pollToClose);
                  setPollToClose(null);
                }
              }}
            >
              Close Poll
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MyPolls;
