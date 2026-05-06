import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/httpClient";
import { toast } from "sonner";

const Onboarding = () => {
  const navigate = useNavigate();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const categories = [
    "Technology",
    "Sports",
    "Politics",
    "Entertainment",
    "Science",
    "Business",
    "Health",
    "Education",
  ];

  const handleToggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handleContinue = async () => {
    setIsSaving(true);
    try {
      await apiClient.put("/v1/users/me/preferences", {
        categories: selectedCategories,
      });
      toast.success("Preferences saved successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar variant="app" />

      <main className="flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="w-full max-w-lg border-primary/20 shadow-xl backdrop-blur-md bg-background/80">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-foreground md:text-3xl">
              Welcome to VoteSphere!
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              What topics interest you? Select categories below to customize your community feed.
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleToggleCategory(cat)}
                    className={`group relative flex items-center justify-between rounded-xl border-2 p-3.5 transition-all duration-300 ${
                      isSelected
                        ? "border-primary bg-primary/5 scale-[1.02] shadow-sm"
                        : "border-border hover:border-primary/30 hover:bg-muted/40"
                    }`}
                  >
                    <span className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {cat}
                    </span>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30 text-transparent"
                      }`}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Button
                className="w-full h-12 text-sm font-bold"
                size="lg"
                onClick={handleContinue}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Continue to Dashboard"
                )}
              </Button>
              <Button
                variant="ghost"
                className="w-full text-sm font-semibold"
                size="lg"
                onClick={() => navigate("/dashboard")}
                disabled={isSaving}
              >
                Skip For Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Onboarding;
