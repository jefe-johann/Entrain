"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ChevronDown, Music, Mic2, Settings2, Repeat } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { api, JobConfig } from "@/lib/api";

const VOICES = [
  { id: "Emma", name: "Emma", description: "Australian accent" },
  { id: "Rachel", name: "Rachel", description: "Default voice" },
  { id: "Maria-Mysh", name: "Maria-Mysh", description: "Foreign accent" },
  { id: "Brittney", name: "Brittney", description: "US, calm/meditative" },
  { id: "Brian", name: "Brian", description: "US, deep/resonant" },
];

const BINAURAL_PRESETS = [
  { id: "delta", name: "Delta (2 Hz)", description: "Deep sleep" },
  { id: "theta", name: "Theta (6 Hz)", description: "Meditation, creativity" },
  { id: "alpha", name: "Alpha (10 Hz)", description: "Relaxation" },
  { id: "beta", name: "Beta (20 Hz)", description: "Focus, alertness" },
];

const AFFIRMATIONS_PER_CREDIT = 50;

const formSchema = z.object({
  title: z.string().max(100).optional(),
  affirmations: z.string().min(1, "Please enter at least one affirmation"),
  voice_id: z.string(),
  duration_minutes: z.number().min(10).max(60),
  binaural_preset: z.enum(["delta", "theta", "alpha", "beta"]),
  affirmation_volume_db: z.number().min(-30).max(0),
  binaural_volume_db: z.number().min(-30).max(0),
  voice_stability: z.number().min(0).max(1),
  voice_similarity: z.number().min(0).max(1),
  lowpass_enabled: z.boolean(),
  lowpass_cutoff: z.number().min(2000).max(8000),
  repetitions: z.number().min(1).max(10),
});

type FormValues = z.infer<typeof formSchema>;

interface GeneratorFormProps {
  userEmail: string;
  credits: number;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 pb-1">
      <Icon className="w-4 h-4 text-purple-500" />
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">{title}</h3>
    </div>
  );
}

export function GeneratorForm({ userEmail, credits }: GeneratorFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      affirmations: "",
      voice_id: "Rachel",
      duration_minutes: 40,
      binaural_preset: "theta",
      affirmation_volume_db: -15,
      binaural_volume_db: -12,
      voice_stability: 0.8,
      voice_similarity: 0.75,
      lowpass_enabled: true,
      lowpass_cutoff: 3750,
      repetitions: 1,
    },
  });

  const onSubmit = async (values: FormValues) => {
    const affirmationCount = values.affirmations
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0).length;
    const creditsNeeded = Math.max(1, Math.ceil((affirmationCount * values.repetitions) / AFFIRMATIONS_PER_CREDIT));
    if (credits < creditsNeeded) {
      toast.error(`Insufficient credits. This job requires ${creditsNeeded} credit${creditsNeeded !== 1 ? "s" : ""} but you have ${credits}.`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse affirmations from textarea
      const affirmationsList = values.affirmations
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (affirmationsList.length === 0) {
        toast.error("Please enter at least one affirmation");
        return;
      }

      // Build config
      const config: JobConfig = {
        affirmations: affirmationsList,
        title: values.title || undefined,
        voice_id: values.voice_id,
        duration_minutes: values.duration_minutes,
        binaural_preset: values.binaural_preset,
        affirmation_volume_db: values.affirmation_volume_db,
        binaural_volume_db: values.binaural_volume_db,
        voice_settings: {
          stability: values.voice_stability,
          similarity_boost: values.voice_similarity,
          style: 0,
          use_speaker_boost: true,
        },
        lowpass_filter: {
          enabled: values.lowpass_enabled,
          cutoff_hz: values.lowpass_cutoff,
        },
        repetitions: values.repetitions,
      };

      // Set user email for API auth
      api.setUserEmail(userEmail);

      // Create job
      const job = await api.createJob(config);

      toast.success("Generation started! Redirecting to dashboard...");
      router.push(`/dashboard?job=${job.id}`);
    } catch (error) {
      console.error("Failed to create job:", error);
      toast.error(error instanceof Error ? error.message : "Failed to create job");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Content Section */}
      <div className="space-y-4">
        <SectionHeader icon={Music} title="Content" />

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Track Title</Label>
          <Input
            id="title"
            placeholder="e.g., Morning Affirmations, Sleep Meditation, Confidence Boost"
            className="bg-white/60"
            {...form.register("title")}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">
              {form.formState.errors.title.message}
            </p>
          )}
        </div>

        {/* Affirmations */}
        <div className="space-y-2">
          <Label htmlFor="affirmations">Affirmations</Label>
          <Textarea
            id="affirmations"
            placeholder={`Enter your affirmations, one per line. Example:

I am confident and capable
I attract abundance effortlessly
My life is filled with joy and purpose`}
            className="min-h-[200px] bg-white/60"
            {...form.register("affirmations")}
          />
          {form.formState.errors.affirmations && (
            <p className="text-sm text-destructive">
              {form.formState.errors.affirmations.message}
            </p>
          )}
          {(() => {
            const affirmationsText = form.watch("affirmations");
            const repetitions = form.watch("repetitions");
            const count = affirmationsText
              .split("\n")
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0).length;
            const total = count * repetitions;
            return (
              <p className="text-sm text-muted-foreground">
                {count} affirmation{count !== 1 ? "s" : ""} x {repetitions} repetition{repetitions !== 1 ? "s" : ""} = {total} / {AFFIRMATIONS_PER_CREDIT} per credit
              </p>
            );
          })()}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/60" />

      {/* Audio Settings Section */}
      <div className="space-y-4">
        <SectionHeader icon={Mic2} title="Voice & Audio" />

        <div className="grid gap-6 md:grid-cols-2">
          {/* Voice */}
          <div className="space-y-2">
            <Label htmlFor="voice">Voice</Label>
            <Select
              value={form.watch("voice_id")}
              onValueChange={(value) => form.setValue("voice_id", value)}
            >
              <SelectTrigger className="bg-white/60">
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {VOICES.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Binaural Preset */}
          <div className="space-y-2">
            <Label>Binaural Frequency</Label>
            <Select
              value={form.watch("binaural_preset")}
              onValueChange={(value: "delta" | "theta" | "alpha" | "beta") =>
                form.setValue("binaural_preset", value)
              }
            >
              <SelectTrigger className="bg-white/60">
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {BINAURAL_PRESETS.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    {preset.name} - {preset.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <Label>Duration: {form.watch("duration_minutes")} minutes</Label>
            <Slider
              value={[form.watch("duration_minutes")]}
              onValueChange={([value]) => form.setValue("duration_minutes", value)}
              min={10}
              max={60}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10 min</span>
              <span>60 min</span>
            </div>
          </div>

          {/* Repetitions */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-muted-foreground" />
              Repetitions: {form.watch("repetitions")}x
            </Label>
            <Slider
              value={[form.watch("repetitions")]}
              onValueChange={([value]) => form.setValue("repetitions", value)}
              min={1}
              max={10}
              step={1}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1x</span>
              <span>10x</span>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border/60" />

      {/* Advanced Settings */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-between w-full py-1 group"
          >
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-semibold text-foreground uppercase tracking-wide">Advanced Settings</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                advancedOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-6 pt-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Affirmation Volume */}
            <div className="space-y-3">
              <Label>Affirmation Volume: {form.watch("affirmation_volume_db")} dB</Label>
              <Slider
                value={[form.watch("affirmation_volume_db")]}
                onValueChange={([value]) => form.setValue("affirmation_volume_db", value)}
                min={-30}
                max={0}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-30 dB</span>
                <span>0 dB</span>
              </div>
            </div>

            {/* Binaural Volume */}
            <div className="space-y-3">
              <Label>Binaural Volume: {form.watch("binaural_volume_db")} dB</Label>
              <Slider
                value={[form.watch("binaural_volume_db")]}
                onValueChange={([value]) => form.setValue("binaural_volume_db", value)}
                min={-30}
                max={0}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>-30 dB</span>
                <span>0 dB</span>
              </div>
            </div>

            {/* Voice Stability */}
            <div className="space-y-3">
              <Label>
                Voice Stability: {(form.watch("voice_stability") * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[form.watch("voice_stability")]}
                onValueChange={([value]) => form.setValue("voice_stability", value)}
                min={0}
                max={1}
                step={0.05}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Variable</span>
                <span>Stable</span>
              </div>
            </div>

            {/* Voice Similarity */}
            <div className="space-y-3">
              <Label>
                Voice Similarity: {(form.watch("voice_similarity") * 100).toFixed(0)}%
              </Label>
              <Slider
                value={[form.watch("voice_similarity")]}
                onValueChange={([value]) => form.setValue("voice_similarity", value)}
                min={0}
                max={1}
                step={0.05}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* Lowpass Filter */}
            <div className="space-y-4 md:col-span-2">
              <div className="flex items-center justify-between rounded-lg bg-secondary/40 px-4 py-3">
                <div>
                  <Label htmlFor="lowpass" className="text-sm font-medium">Low-pass Filter</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Softens audio by removing high frequencies</p>
                </div>
                <Switch
                  id="lowpass"
                  checked={form.watch("lowpass_enabled")}
                  onCheckedChange={(checked) => form.setValue("lowpass_enabled", checked)}
                />
              </div>
              {form.watch("lowpass_enabled") && (
                <div className="space-y-3 pl-4">
                  <Label>Cutoff: {form.watch("lowpass_cutoff")} Hz</Label>
                  <Slider
                    value={[form.watch("lowpass_cutoff")]}
                    onValueChange={([value]) => form.setValue("lowpass_cutoff", value)}
                    min={2000}
                    max={8000}
                    step={250}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>2,000 Hz</span>
                    <span>8,000 Hz</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Submit */}
      <div className="border-t border-border/60 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Credits remaining: <span className="font-medium text-foreground">{credits}</span>
          </p>
          {(() => {
            const affirmationsText = form.watch("affirmations");
            const repetitions = form.watch("repetitions");
            const count = affirmationsText
              .split("\n")
              .map((line: string) => line.trim())
              .filter((line: string) => line.length > 0).length;
            const total = count * repetitions;
            const creditsRequired = Math.max(1, Math.ceil(total / AFFIRMATIONS_PER_CREDIT));
            return (
              <Button
                type="submit"
                size="lg"
                disabled={isSubmitting || credits < creditsRequired}
                className="shadow-md shadow-purple-500/20 hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
              >
                {isSubmitting ? "Creating..." : `Generate Track (${creditsRequired} credit${creditsRequired !== 1 ? "s" : ""})`}
              </Button>
            );
          })()}
        </div>
      </div>
    </form>
  );
}
