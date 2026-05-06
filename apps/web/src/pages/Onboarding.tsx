import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2, User } from "lucide-react";
import { apiClient } from "@/lib/httpClient";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState("");
  const [gender, setGender] = useState("");
  const [country, setCountry] = useState("");
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

  const handleNextStep = () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one topic of interest.");
      return;
    }
    setStep(2);
  };

  const handleSubmitOnboarding = async () => {
    if (!ageRange || !gender || !country) {
      toast.error("Please fill out all demographic fields to help personalize your experience.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Save Category Preferences
      await apiClient.put("/v1/users/me/preferences", {
        categories: selectedCategories,
      });

      // 2. Save Demographic Information
      await apiClient.put("/v1/users/me/demographics", {
        ageRange,
        gender,
        country,
      });

      toast.success("Welcome to VoteSphere! Setup completed successfully.");
      navigate("/dashboard");
    } catch (err) {
      toast.error("Failed to complete setup. Please try again.");
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
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              {step === 1 ? <Sparkles className="h-6 w-6 animate-pulse" /> : <User className="h-6 w-6 animate-pulse" />}
            </div>
            
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-1.5 mb-2.5">
              <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 1 ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`} />
              <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 2 ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"}`} />
            </div>

            <CardTitle className="text-2xl font-extrabold text-foreground md:text-3xl">
              {step === 1 ? "Welcome to VoteSphere!" : "Complete Your Profile"}
            </CardTitle>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              {step === 1 
                ? "What topics interest you? Select categories below to customize your community feed."
                : "Please fill out your demographic details to enable rich premium voter analytics."}
            </p>
          </CardHeader>
          <CardContent className="space-y-8 pt-4">
            
            {/* STEP 1: Categories */}
            {step === 1 && (
              <>
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
                    onClick={handleNextStep}
                  >
                    Next Step
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-sm font-semibold"
                    size="lg"
                    onClick={() => navigate("/dashboard")}
                  >
                    Skip For Now
                  </Button>
                </div>
              </>
            )}

            {/* STEP 2: Demographics */}
            {step === 2 && (
              <>
                <div className="space-y-5 text-left">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age Range</label>
                    <Select value={ageRange} onValueChange={setAgeRange}>
                      <SelectTrigger className="w-full h-11"><SelectValue placeholder="Select age range" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-24">18-24 years old</SelectItem>
                        <SelectItem value="25-34">25-34 years old</SelectItem>
                        <SelectItem value="35-44">35-44 years old</SelectItem>
                        <SelectItem value="45-54">45-54 years old</SelectItem>
                        <SelectItem value="55+">55+ years old</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender Identity</label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="w-full h-11"><SelectValue placeholder="Select gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Non-binary">Non-binary</SelectItem>
                        <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Location (Country)</label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="w-full h-11"><SelectValue placeholder="Select country" /></SelectTrigger>
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

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 text-sm font-bold"
                    size="lg"
                    onClick={() => setStep(1)}
                    disabled={isSaving}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-[2] h-12 text-sm font-bold"
                    size="lg"
                    onClick={handleSubmitOnboarding}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Completing...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </Button>
                </div>
              </>
            )}

          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Onboarding;
