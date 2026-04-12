import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, EyeOff, Users, CheckCircle, Vote } from "lucide-react";

const options = [
  { id: "1", title: "Escape Room", desc: "Challenging puzzles and teamwork" },
  { id: "2", title: "Bowling Night", desc: "Casual fun with food and drinks" },
  { id: "3", title: "Nature Hiking", desc: "Outdoor adventure and fresh air" },
  { id: "4", title: "Cooking Class", desc: "Learn new recipes together" },
];

const VotePoll = () => {
  const [selected, setSelected] = useState("1");

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto flex justify-center px-6 py-12">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 text-center">
            <Badge variant="outline" className="mb-4">
              <Users className="mr-1 h-3 w-3" /> TEAM FEEDBACK
            </Badge>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">
              What is our next team building activity?
            </h1>
            <p className="mt-2 text-muted-foreground">Select one option to cast your vote</p>

            <div className="mt-8 space-y-3 text-left">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  className={`flex w-full items-center justify-between rounded-lg border-2 p-4 transition-colors ${
                    selected === opt.id
                      ? "border-primary bg-accent"
                      : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`h-5 w-5 rounded-full border-2 ${
                      selected === opt.id ? "border-primary bg-primary" : "border-muted-foreground/40"
                    } flex items-center justify-center`}>
                      {selected === opt.id && <div className="h-2 w-2 rounded-full bg-primary-foreground" />}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{opt.title}</p>
                      <p className="text-sm text-muted-foreground">{opt.desc}</p>
                    </div>
                  </div>
                  <CheckCircle className={`h-5 w-5 ${selected === opt.id ? "text-primary" : "text-muted"}`} />
                </button>
              ))}
            </div>

            <Button className="mt-8 w-full" size="lg">
              <Vote className="mr-2 h-4 w-4" /> Cast Your Vote
            </Button>

            <div className="mt-6 flex items-center justify-center gap-6 border-t border-border pt-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> Ends in 2 days</span>
              <span className="flex items-center gap-1"><EyeOff className="h-4 w-4" /> Results hidden until closed</span>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground">
        © 2024 VoteSphere. Built for seamless decision making.
      </footer>
    </div>
  );
};

export default VotePoll;
