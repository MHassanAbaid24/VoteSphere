import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FileText, List, Settings, GripVertical, Trash2, Plus, Image as ImageIcon, Loader2 } from "lucide-react";
import { useCreatePoll } from "@/hooks/use-polls";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Form Validation Schema
const pollSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  options: z.array(
    z.object({
      text: z.string().min(1, "Option text cannot be empty"),
    })
  ).min(2, "You must provide at least two options"),
  visibility: z.enum(["public", "private"]),
  duration: z.string(),
  anonymous: z.boolean(),
});

type PollFormValues = z.infer<typeof pollSchema>;

const CreatePoll = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createMutation = useCreatePoll();
  const [base64Image, setBase64Image] = useState<string | null>(null);

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: "",
      description: "",
      options: [{ text: "" }, { text: "" }],
      visibility: "public",
      duration: "7",
      anonymous: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    name: "options",
    control: form.control,
  });

  // Handle Image to Base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image must be smaller than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
        toast.success("Cover image uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PollFormValues) => {
    if (!user) return;

    try {
      const newPoll = await createMutation.mutateAsync({
        creatorId: user.id,
        title: data.title,
        description: data.description,
        visibility: data.visibility,
        status: "active",
        expiresAt: new Date(Date.now() + parseInt(data.duration) * 24 * 60 * 60 * 1000).toISOString(),
        options: data.options.map((opt) => ({
          id: Math.random().toString(36).substr(2, 9),
          text: opt.text,
          votes: 0,
        })),
        // In a real app, you'd send base64Image to your API here
      });

      toast.success("Poll created successfully!");
      navigate(`/poll/${newPoll.id}/results`);
    } catch (error) {
      toast.error("Failed to create poll. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar variant="app" />

      <main className="container mx-auto max-w-2xl px-6 py-8">
        <div className="mb-2 text-sm text-muted-foreground">
          <span className="text-primary cursor-pointer" onClick={() => navigate("/dashboard")}>Dashboard</span> › <span className="font-medium text-foreground">Create Poll</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Create a New Poll</h1>
        <p className="mt-1 text-muted-foreground">Set up your poll details, questions, and voting rules below.</p>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">

            {/* Cover Image Upload */}
            <Card>
              <CardContent className="p-0">
                <div
                  className="group relative flex h-40 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-t-xl border-b bg-muted/50 transition-colors hover:bg-muted"
                  onClick={() => document.getElementById("cover-upload")?.click()}
                >
                  {base64Image ? (
                    <img src={base64Image} alt="Cover" className="h-full w-full object-cover" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary" />
                      <span className="mt-2 text-sm font-medium text-muted-foreground">Add Cover Image</span>
                    </>
                  )}
                  <input
                    id="cover-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Poll Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-4 w-4" /> Poll Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Poll Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Q4 Product Roadmap Priorities" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Provide context for your voters..." rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Options Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <List className="h-4 w-4" /> Answer Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {fields.map((field, index) => (
                  <FormField
                    key={field.id}
                    control={form.control}
                    name={`options.${index}.text`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          <FormControl>
                            <Input placeholder={`Option ${index + 1}`} {...field} />
                          </FormControl>
                          {fields.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => append({ text: "" })}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add another option
                </Button>
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-4 w-4" /> Poll Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="visibility"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Visibility</FormLabel>
                      <FormControl>
                        <div className="flex rounded-lg border border-border p-1 bg-muted/30">
                          <button
                            type="button"
                            onClick={() => field.onChange("public")}
                            className={`rounded-md px-4 py-1.5 text-sm transition-all ${field.value === "public" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                          >Public</button>
                          <button
                            type="button"
                            onClick={() => field.onChange("private")}
                            className={`rounded-md px-4 py-1.5 text-sm transition-all ${field.value === "private" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
                          >Private</button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Poll Duration (Days)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 Day</SelectItem>
                          <SelectItem value="3">3 Days</SelectItem>
                          <SelectItem value="7">7 Days</SelectItem>
                          <SelectItem value="30">30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="anonymous"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Anonymous Voting</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4 pb-10">
              <Button
                variant="outline"
                size="lg"
                type="button"
                onClick={() => navigate(-1)}
              >
                Cancel
              </Button>
              <Button size="lg" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Publish Poll
              </Button>
            </div>
          </form>
        </Form>
      </main>
    </div>
  );
};

export default CreatePoll;