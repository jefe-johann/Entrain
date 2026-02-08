"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddCustomVoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userHasApiKey: boolean;
  onVoiceAdded: () => void;
}

export function AddCustomVoiceDialog({
  open,
  onOpenChange,
  userHasApiKey,
  onVoiceAdded,
}: AddCustomVoiceDialogProps) {
  // Section 1: ElevenLabs library voice
  const [libName, setLibName] = useState("");
  const [libVoiceId, setLibVoiceId] = useState("");
  const [libSubmitting, setLibSubmitting] = useState(false);

  // Section 2: Voice clone with own API key
  const [cloneName, setCloneName] = useState("");
  const [cloneVoiceId, setCloneVoiceId] = useState("");
  const [cloneApiKey, setCloneApiKey] = useState("");
  const [cloneSubmitting, setCloneSubmitting] = useState(false);

  const resetForm = () => {
    setLibName("");
    setLibVoiceId("");
    setCloneName("");
    setCloneVoiceId("");
    setCloneApiKey("");
  };

  const handleAddLibraryVoice = async () => {
    if (!libName.trim() || !libVoiceId.trim()) {
      toast.error("Please fill in both fields");
      return;
    }

    setLibSubmitting(true);
    try {
      await api.createCustomVoice({
        name: libName.trim(),
        elevenlabs_voice_id: libVoiceId.trim(),
        use_user_api_key: false,
      });
      toast.success(`Voice "${libName.trim()}" added`);
      resetForm();
      onOpenChange(false);
      onVoiceAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add voice");
    } finally {
      setLibSubmitting(false);
    }
  };

  const handleAddCloneVoice = async () => {
    if (!cloneName.trim() || !cloneVoiceId.trim()) {
      toast.error("Please fill in name and voice ID");
      return;
    }
    if (!cloneApiKey.trim() && !userHasApiKey) {
      toast.error("Please enter your ElevenLabs API key");
      return;
    }

    setCloneSubmitting(true);
    try {
      // Save API key first if provided
      if (cloneApiKey.trim()) {
        await api.updateApiKey(cloneApiKey.trim());
      }

      await api.createCustomVoice({
        name: cloneName.trim(),
        elevenlabs_voice_id: cloneVoiceId.trim(),
        use_user_api_key: true,
      });
      toast.success(`Voice clone "${cloneName.trim()}" added`);
      resetForm();
      onOpenChange(false);
      onVoiceAdded();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add voice clone");
    } finally {
      setCloneSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Custom Voice</DialogTitle>
          <DialogDescription>
            Add a voice from the ElevenLabs library or use your own voice clone.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList className="w-full">
            <TabsTrigger value="library" className="flex-1">ElevenLabs Voice</TabsTrigger>
            <TabsTrigger value="clone" className="flex-1">Voice Clone</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-3 pt-1">
            <p className="text-xs text-muted-foreground">
              Browse voices at{" "}
              <a
                href="https://try.elevenlabs.io/dzno4ab4ajsy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:underline"
              >
                ElevenLabs
              </a>
              , copy the Voice ID, and enter it below.
            </p>
            <div className="space-y-2">
              <Label htmlFor="lib-name">Display Name</Label>
              <Input
                id="lib-name"
                name="lib_name"
                placeholder="e.g., Sarah"
                value={libName}
                onChange={(e) => setLibName(e.target.value)}
                className="bg-white/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lib-voice-id">Voice ID</Label>
              <Input
                id="lib-voice-id"
                name="lib_voice_id"
                placeholder="e.g., EXAVITQu4vr4xnSDxMaL"
                value={libVoiceId}
                onChange={(e) => setLibVoiceId(e.target.value)}
                className="bg-white/60 font-mono text-sm"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddLibraryVoice}
              disabled={libSubmitting || !libName.trim() || !libVoiceId.trim()}
              className="w-full"
            >
              {libSubmitting ? "Adding..." : "Add Voice"}
            </Button>
          </TabsContent>

          <TabsContent value="clone" className="space-y-3 pt-1">
            <div className="text-xs text-muted-foreground space-y-1">
              <p>To create a voice clone:</p>
              <ol className="list-decimal list-inside space-y-0.5 pl-1">
                <li>
                  Sign up at{" "}
                  <a
                    href="https://try.elevenlabs.io/dzno4ab4ajsy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:underline"
                  >
                    ElevenLabs
                  </a>{" "}
                  (Starter plan required)
                </li>
                <li>Go to VoiceLab &gt; Instant Voice Cloning</li>
                <li>Upload 1-3 min of clean audio of your voice</li>
                <li>Copy Voice ID from My Voices (three dots menu)</li>
                <li>Copy API Key from Developers (left sidebar) &gt; API Keys</li>
              </ol>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clone-name">Display Name</Label>
              <Input
                id="clone-name"
                name="clone_name"
                placeholder="e.g., My Voice"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                className="bg-white/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clone-voice-id">Voice ID</Label>
              <Input
                id="clone-voice-id"
                name="clone_voice_id"
                placeholder="e.g., EXAVITQu4vr4xnSDxMaL"
                value={cloneVoiceId}
                onChange={(e) => setCloneVoiceId(e.target.value)}
                className="bg-white/60 font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clone-api-key">
                API Key{" "}
                {userHasApiKey && (
                  <span className="text-xs text-muted-foreground font-normal">
                    (saved - leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="clone-api-key"
                name="clone_api_key"
                type="password"
                placeholder={userHasApiKey ? "Leave blank to keep current key" : "xi-api-key..."}
                value={cloneApiKey}
                onChange={(e) => setCloneApiKey(e.target.value)}
                className="bg-white/60 font-mono text-sm"
              />
            </div>
            <Button
              type="button"
              onClick={handleAddCloneVoice}
              disabled={
                cloneSubmitting ||
                !cloneName.trim() ||
                !cloneVoiceId.trim() ||
                (!cloneApiKey.trim() && !userHasApiKey)
              }
              className="w-full"
            >
              {cloneSubmitting ? "Adding..." : "Add Voice Clone"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
