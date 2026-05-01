import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, HelpCircle, List, Settings, GripVertical, Trash2, Plus, Image } from "lucide-react";
import { useCreatePoll } from "@/hooks/use-polls";
import { toast } from "sonner";

const CreatePoll = () => {
  const navigate = useNavigate();
  const createMutation = useCreatePoll();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState([{ id: "1", text: "" }, { id: "2", text: "" }]);
  const [visibility, setVisibility] = useState<'public' | 'private'>("public");
  const [duration, setDuration] = useState("7");

  const addOption = () => {
    setOptions([...options, { id: Math.random().toString(36).substr(2, 9), text: "" }]);
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map(opt => opt.id === id ? { ...opt, text } : opt));
  };

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id));
    }
  };

  const handlePublish = async () => {
    if (!title || options.some(o => !o.text)) {
      toast.error("Please fill in all fields and provide at least two options.");
      return;
    }

    try {
      const newPoll = await createMutation.mutateAsync({
        creatorId: "current-user",
        title,
        description,
        options: options.map(o => ({ id: o.id, text: o.text, votes: 0 })),
        status: "active",
        visibility,
        expiresAt: new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString(),
      });
      toast.success("Poll published!");
      navigate(`/dashboard`);
    } catch (error) {
      toast.error("Failed to create poll.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto max-w-2xl px-6 py-8">
        <h1 className="text-3xl font-bold text-foreground">Create a New Poll</h1>

        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-4 w-4" /> Poll Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Poll Title</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Product Roadmap Priorities"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide context..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <List className="h-4 w-4" /> Answer Options
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {options.map((opt, i) => (
                <div key={opt.id} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={opt.text}
                    onChange={(e) => updateOption(opt.id, e.target.value)}
                    placeholder={`Option ${i + 1}`}
                    className="flex-1"
                  />
                  <button onClick={() => removeOption(opt.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={addOption}>
                <Plus className="mr-2 h-4 w-4" /> Add another option
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-4 w-4" /> Poll Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Visibility</Label>
                <div className="flex rounded-lg border border-border">
                  <button
                    onClick={() => setVisibility('public')}
                    className={`px-4 py-1.5 text-sm font-medium ${visibility === 'public' ? 'bg-muted' : 'text-muted-foreground'}`}
                  >Public</button>
                  <button
                    onClick={() => setVisibility('private')}
                    className={`px-4 py-1.5 text-sm font-medium ${visibility === 'private' ? 'bg-muted' : 'text-muted-foreground'}`}
                  >Private</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Poll Duration</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Day</SelectItem>
                    <SelectItem value="7">7 Days</SelectItem>
                    <SelectItem value="30">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pb-10">
            <Button variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button onClick={handlePublish} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Publishing..." : "Publish Poll"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreatePoll;