import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/httpClient";

const Terms = () => {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await apiClient.get("/v1/content/terms-of-service");
        if (res.data?.success) {
          setContent(res.data.data);
        }
      } catch (err) {
        // Silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="landing" />
      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <Card className="border border-border bg-card">
          <CardContent className="p-10">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-5/6" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            ) : content ? (
              <>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-6">
                  {content.title}
                </h1>
                <div className="prose dark:prose-invert max-w-none text-muted-foreground text-lg leading-relaxed whitespace-pre-wrap">
                  {content.body}
                </div>
              </>
            ) : (
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl mb-6">
                  Terms of Service
                </h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  By using VoteSphere, you agree to post content that is respectful and does not infringe on anyone else rights.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Terms;
