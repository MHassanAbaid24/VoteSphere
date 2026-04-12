import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Users, UserCheck, Calendar, Pencil } from "lucide-react";
import { Link } from "react-router-dom";

const Profile = () => {
  const polls = [
    { title: "Community Park Renovation", date: "Oct 12, 2023", status: "Active", action: "Details" },
    { title: "Weekend Meetup Location", date: "Oct 05, 2023", status: "Closed", action: "Results" },
    { title: "New Logo Feedback", date: "Sep 28, 2023", status: "Closed", action: "Results" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left column */}
          <div className="space-y-6">
            <Card>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="relative">
                  <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-accent bg-muted">
                    <div className="flex h-full w-full items-center justify-center text-3xl text-muted-foreground">AJ</div>
                  </div>
                  <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                <h2 className="mt-4 text-xl font-bold text-foreground">Alex Johnson</h2>
                <p className="text-sm text-muted-foreground">alex@example.com</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Joined January 2024
                </p>
                <Button className="mt-4 w-full">Edit Profile</Button>
                <Button variant="outline" className="mt-2 w-full">Logout</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base">Account Security</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Two-factor Auth</span>
                  <span className="font-medium text-success">Enabled</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">Last Login</span>
                  <span className="text-muted-foreground">2 hours ago</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icon: BarChart3, label: "POLLS CREATED", value: "12" },
                { icon: Users, label: "VOTES RECEIVED", value: "450" },
                { icon: UserCheck, label: "PARTICIPATED IN", value: "85" },
              ].map((s) => (
                <Card key={s.label}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-xs font-medium tracking-wider text-muted-foreground">{s.label}</p>
                      <p className="mt-1 text-3xl font-bold text-foreground">{s.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                      <s.icon className="h-5 w-5 text-accent-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-lg">My Recent Polls</CardTitle>
                <Link to="/dashboard" className="text-sm font-medium text-primary">View All</Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="pb-3 pr-4">Poll Title</th>
                        <th className="pb-3 pr-4">Date Created</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {polls.map((p) => (
                        <tr key={p.title} className="border-b border-border last:border-0">
                          <td className="py-4 pr-4 font-medium text-foreground">{p.title}</td>
                          <td className="py-4 pr-4 text-muted-foreground">{p.date}</td>
                          <td className="py-4 pr-4">
                            <Badge variant={p.status === "Active" ? "default" : "secondary"}
                              className={p.status === "Active" ? "bg-success/10 text-success border-0" : ""}>
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Link to="/poll/demo/results" className="font-medium text-primary">{p.action}</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;
