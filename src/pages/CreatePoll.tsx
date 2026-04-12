import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, HelpCircle, List, Settings, GripVertical, Trash2, Plus, Image } from "lucide-react";

const CreatePoll = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto max-w-2xl px-6 py-8">
        <div className="mb-2 text-sm text-muted-foreground">
          <span className="text-primary">Dashboard</span> › <span className="font-medium text-foreground">Create Poll</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Create a New Poll</h1>
        <p className="mt-1 text-muted-foreground">Set up your poll details, questions, and voting rules below.</p>

        <div className="mt-8 space-y-6">
          {/* Poll Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <FileText className="h-4 w-4 text-primary-foreground" />
                </div>
                Poll Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-32 items-center justify-center rounded-lg bg-muted">
                <Button variant="secondary" size="sm"><Image className="mr-2 h-4 w-4" />Add Cover Image</Button>
              </div>
              <div>
                <Label>Poll Title</Label>
                <Input placeholder="e.g. Q4 Product Roadmap Priorities" className="mt-1" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Provide context for your voters..." className="mt-1" rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* Question Text */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <HelpCircle className="h-4 w-4 text-primary-foreground" />
                </div>
                Question Text
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Label>What is the main question?</Label>
              <Input placeholder="e.g. Which feature should we develop next?" className="mt-1" />
            </CardContent>
          </Card>

          {/* Answer Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <List className="h-4 w-4 text-primary-foreground" />
                </div>
                Answer Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {["Dark Mode Support", "Mobile Application", ""].map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Input defaultValue={opt} placeholder="Add an option..." className="flex-1" />
                  <button className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <Button variant="outline" className="w-full"><Plus className="mr-2 h-4 w-4" />Add another option</Button>
            </CardContent>
          </Card>

          {/* Poll Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Settings className="h-4 w-4 text-primary-foreground" />
                </div>
                Poll Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Poll Visibility</p>
                  <p className="text-sm text-muted-foreground">Public polls are visible to anyone with the link.</p>
                </div>
                <div className="flex rounded-lg border border-border">
                  <button className="rounded-l-lg bg-muted px-4 py-1.5 text-sm font-medium text-foreground">Public</button>
                  <button className="rounded-r-lg px-4 py-1.5 text-sm text-muted-foreground">Private</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Poll Duration</Label>
                <Select defaultValue="7">
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="3">3 Days</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="14">14 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Anonymous Voting</Label>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4 pb-10">
            <Button variant="outline" size="lg">Preview Poll</Button>
            <Button size="lg">Publish Poll</Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        © 2024 VoteSphere Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default CreatePoll;
