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
import { apiClient } from "@/lib/httpClient";
import { cn } from "@/lib/utils";

// Form Validation Schema
const pollSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Please select a category"),
  questions: z.array(
    z.object({
      text: z.string().min(1, "Question text cannot be empty"),
      options: z.array(
        z.object({
          text: z.string().min(1, "Option text cannot be empty"),
        })
      ).min(2, "You must provide at least two options"),
    })
  ).min(1, "At least one question is required"),
  visibility: z.enum(["public", "private"]),
  duration: z.string(),
  anonymous: z.boolean(),
});

type PollFormValues = z.infer<typeof pollSchema>;

const QuestionFormCard = ({
  qIndex,
  removeQuestion,
  form,
  canDelete,
}: {
  qIndex: number;
  removeQuestion: () => void;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  form: any;
  canDelete: boolean;
}) => {
  const { fields: optionFields, append: appendOption, remove: removeOption } = useFieldArray({
    name: `questions.${qIndex}.options`,
    control: form.control,
  });

  return (
    <Card className="border-primary/10 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-md font-bold text-primary">
          <List className="h-4 w-4" /> Question #{qIndex + 1}
        </CardTitle>
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={removeQuestion}
            className="text-muted-foreground hover:text-destructive gap-1"
          >
            <Trash2 className="h-4 w-4" /> Remove Question
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name={`questions.${qIndex}.text`}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Question Text</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Which product priority do you favor?" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 pt-2">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Answer Options</Label>
          {optionFields.map((optField, oIndex) => (
            <FormField
              key={optField.id}
              control={form.control}
              name={`questions.${qIndex}.options.${oIndex}.text`}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <FormControl>
                      <Input placeholder={`Option ${oIndex + 1}`} {...field} />
                    </FormControl>
                    {optionFields.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(oIndex)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
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
            size="sm"
            className="w-full mt-1 border-dashed"
            onClick={() => appendOption({ text: "" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Option
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const CreatePoll = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const createMutation = useCreatePoll();
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Technology",
      questions: [
        {
          text: "",
          options: [{ text: "" }, { text: "" }],
        },
      ],
      visibility: "public",
      duration: "7",
      anonymous: true,
    },
  });

  const { fields: questionFields, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    name: "questions",
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
      setSelectedFile(file);
      setImageLoaded(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result as string);
        toast.success("Cover image uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: PollFormValues) => {
    if (!user || createMutation.isPending) return;

    try {
      const newPoll = await createMutation.mutateAsync({
        creatorId: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        visibility: data.visibility,
        status: "active",
        expiresAt: new Date(Date.now() + parseInt(data.duration) * 24 * 60 * 60 * 1000).toISOString(),
        options: [],
        questions: data.questions.map((q) => ({
          text: q.text,
          options: q.options.map((opt) => ({ text: opt.text })),
        })),
      });

      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append("cover", selectedFile);
          await apiClient.post(`/v1/polls/${newPoll.id}/cover`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } catch (err) {
          toast.error("Failed to upload cover image.");
        }
      }

      toast.success("Poll created successfully!");
      navigate(`/poll/${newPoll.id}/results`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create poll. Please try again.");
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
                    <>
                      {!imageLoaded && (
                        <div className="absolute inset-0 bg-gradient-to-r from-muted via-accent/30 to-muted animate-shimmer bg-[length:200%_100%]" />
                      )}
                      <img
                        src={base64Image}
                        alt={imageLoaded ? "Cover" : ""}
                        onLoad={() => setImageLoaded(true)}
                        className={cn(
                          "h-full w-full object-cover transition-opacity duration-500",
                          imageLoaded ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </>
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
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Sports">Sports</SelectItem>
                          <SelectItem value="Politics">Politics</SelectItem>
                          <SelectItem value="Entertainment">Entertainment</SelectItem>
                          <SelectItem value="Science">Science</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Health">Health</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Questions List */}
            <div className="space-y-4">
              {questionFields.map((field, qIndex) => (
                <QuestionFormCard
                  key={field.id}
                  qIndex={qIndex}
                  removeQuestion={() => removeQuestion(qIndex)}
                  form={form}
                  canDelete={questionFields.length > 1}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-dashed border-2 hover:border-primary/50"
                onClick={() =>
                  appendQuestion({
                    text: "",
                    options: [{ text: "" }, { text: "" }],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Another Question
              </Button>
            </div>

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