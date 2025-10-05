"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Tables, Enums } from "@/types/database.types";

type Meeting = Tables<"meetings">;
type AccessLevel = Enums<"meeting_access_level">;

interface SharePopoverProps {
  meeting: Meeting;
  onAccessLevelChange: (accessLevel: AccessLevel) => Promise<void>;
  isOwner: boolean;
}

export default function SharePopover({
  meeting,
  onAccessLevelChange,
  isOwner,
}: SharePopoverProps) {
  const [isShared, setIsShared] = useState(meeting.access_level !== "PRIVATE");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>(
    meeting.access_level
  );
  const [isSaving, setIsSaving] = useState(false);
  const shareableUrl = `${window.location.origin}/meeting/${meeting.meeting_id}`;

  const handleShareToggle = async (shared: boolean) => {
    setIsShared(shared);
    const newAccessLevel = shared ? "VIEWER" : "PRIVATE";
    setAccessLevel(newAccessLevel);
    await handleAccessLevelChange(newAccessLevel);
  };

  const handleAccessLevelChange = async (newAccessLevel: AccessLevel) => {
    setAccessLevel(newAccessLevel);
    setIsSaving(true);
    try {
      await onAccessLevelChange(newAccessLevel);
    } catch (error) {
      console.error("Failed to update access level", error);
      // Revert on failure
      setAccessLevel(accessLevel);
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareableUrl);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Share</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Sharing Settings</h4>
            <p className="text-sm text-muted-foreground">
              Control who can access this meeting.
            </p>
          </div>

          {isOwner ? (
            <>
              <div className="flex items-center space-x-2">
                <Switch
                  id="share-meeting"
                  checked={isShared}
                  onCheckedChange={handleShareToggle}
                  disabled={isSaving}
                />
                <Label htmlFor="share-meeting">Share Meeting</Label>
              </div>

              {isShared && (
                <RadioGroup
                  value={accessLevel}
                  onValueChange={(value) =>
                    handleAccessLevelChange(value as AccessLevel)
                  }
                  disabled={isSaving}
                  className="pl-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="VIEWER" id="viewer" />
                    <Label htmlFor="viewer">
                      Viewer
                      <p className="text-xs text-muted-foreground">
                        Anyone with the link can view.
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CONTRIBUTOR" id="contributor" />
                    <Label htmlFor="contributor">
                      Contributor
                      <p className="text-xs text-muted-foreground">
                        Anyone with the link can edit the agenda.
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="EDITOR" id="editor" />
                    <Label htmlFor="editor">
                      Editor
                      <p className="text-xs text-muted-foreground">
                        Anyone with the link can edit agenda & minutes.
                      </p>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="OWNER" id="owner" />
                    <Label htmlFor="owner">
                      Owner
                      <p className="text-xs text-muted-foreground">
                        Full access to manage the meeting.
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              )}
            </>
          ) : null}

          <div className="flex items-center space-x-2">
            <Input value={shareableUrl} readOnly />
            <Button size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
