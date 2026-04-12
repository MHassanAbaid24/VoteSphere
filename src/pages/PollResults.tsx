import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Share2 } from "lucide-react";

const PollResults = () => {
  const options = [
    { label: "Renewable Energy Projects", pct: 45, votes: 2430 },
    { label: "Public Transport Expansion", pct: 30, votes: 1620 },
    { label: "Local Park Renovations", pct: 25, votes: 1350 },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto flex justify-center px-6 py-12">
        <Card className="w-full max-w-2xl">
          <div className="relative h-56 overflow-hidden rounded-t-lg bg-muted">
            <div className="absolute inset-0 bg-gradient-to-br from-accent to-muted" />
            <Badge className="absolute bottom-4 left-4 bg-primary text-primary-foreground">ACTIVE POLL</Badge>
          </div>
          <CardContent className="p-8">
            <h1 className="text-2xl font-bold text-foreground">Community Future Initiative</h1>
            <p className="mt-2 text-muted-foreground">
              Which priority should our local government focus on for the next fiscal year?
            </p>

            <div className="mt-8 space-y-6">
              {options.map((opt) => (
                <div key={opt.label}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{opt.label}</span>
                    <span className="text-lg font-bold text-primary">{opt.pct}%</span>
                  </div>
                  <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${opt.pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{opt.votes.toLocaleString()} votes</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-border pt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-4 w-4" /> Total Votes: 5,400</span>
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Ends in 3 days</span>
            </div>

            <Button className="mt-6 w-full" size="lg">
              Share Results <Share2 className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2023 VoteSphere. All rights reserved.
      </footer>
    </div>
  );
};

export default PollResults;
