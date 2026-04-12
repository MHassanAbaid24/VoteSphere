import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, Radio, Plus, Share2, CheckCircle, MessageSquare, UserPlus } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto px-6 py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Your Dashboard</h1>
            <p className="mt-1 text-muted-foreground">Manage your active polls and track results in real-time.</p>
          </div>
          <Button asChild>
            <Link to="/create-poll"><Plus className="mr-2 h-4 w-4" />Create New Poll</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { icon: BarChart3, label: "Polls Created", value: "12", badge: "+2 this week", badgeColor: "text-success" },
            { icon: Users, label: "Votes Received", value: "840", badge: "+124 today", badgeColor: "text-success" },
            { icon: Radio, label: "Active Polls", value: "3", badge: "Live Now", badgeColor: "text-primary" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex flex-col p-6">
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                    <s.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <span className={`text-xs font-medium ${s.badgeColor}`}>{s.badge}</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-bold text-foreground">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Active Polls */}
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Active Polls</h2>
              <Link to="/dashboard" className="text-sm font-medium text-primary">View All</Link>
            </div>
            <div className="mt-4 space-y-4">
              {[
                { title: "Favorite Frontend Framework 2024", desc: "Which library are you most excited about this year? React, Vue, Svelte...", votes: 142, days: 2 },
                { title: "Clean UI: Rounded vs Sharp Corners", desc: "What is your preference for modern dashboard components?", votes: 89, days: 5 },
              ].map((poll) => (
                <Card key={poll.title}>
                  <CardContent className="flex gap-4 p-4">
                    <div className="h-24 w-36 flex-shrink-0 rounded-lg bg-muted" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-success/10 text-success border-0">● Active</Badge>
                        <span className="text-xs text-muted-foreground">Ends in {poll.days} days</span>
                      </div>
                      <h3 className="mt-1 font-semibold text-foreground">{poll.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{poll.desc}</p>
                      <div className="mt-3 flex items-center gap-4">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" /> {poll.votes} votes
                        </span>
                        <button className="text-muted-foreground hover:text-foreground"><Share2 className="h-4 w-4" /></button>
                        <Link to="/poll/demo/results" className="ml-auto text-sm font-medium text-primary">Results</Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Recent Activity</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { icon: CheckCircle, text: 'Voted in "Remote Work Policies"', time: "2 hours ago" },
                  { icon: Radio, text: '"Best IDE 2024" poll closed', time: "5 hours ago" },
                  { icon: MessageSquare, text: "New comment on your poll", time: "Yesterday" },
                  { icon: UserPlus, text: 'Voted in "Favorite Coffee Roast"', time: "Jan 12, 2024" },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                      <a.icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.text}</p>
                      <p className="text-xs text-muted-foreground">{a.time}</p>
                    </div>
                  </div>
                ))}
                <Link to="/dashboard" className="block text-center text-sm font-medium text-primary">See all activity</Link>
              </CardContent>
            </Card>

            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold">Pro Analytics</h3>
                <p className="mt-1 text-sm opacity-80">Get detailed demographic insights for all your active polls.</p>
                <Button variant="secondary" className="mt-4 w-full">Upgrade Now</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
