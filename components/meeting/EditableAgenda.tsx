"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tables } from "@/types/database.types";
import { FileText, Clock, Plus, Trash2 } from "lucide-react";

type Meeting = Tables<"meetings">;

interface EditableAgendaProps {
  meeting: Meeting;
  className?: string;
  editable?: boolean;
}

interface AgendaItem {
  topic: string;
  details?: string;
  duration?: string;
}

export default function EditableAgenda({
  meeting,
  className,
  editable = true,
}: EditableAgendaProps) {
  console.log("EditableAgenda Debug:", {
    editable,
    meetingStatus: meeting.status,
  });

  // Parse agenda topics from JSON
  const initialItems = useMemo(() => {
    const arr = (meeting.agenda_topics as unknown as AgendaItem[]) || [];
    // Ensure well-formed values
    return Array.isArray(arr)
      ? arr.map((a) => ({
          topic: a.topic ?? "",
          details: a.details ?? "",
          duration: a.duration,
        }))
      : [];
  }, [meeting.agenda_topics]);

  const [items, setItems] = useState<AgendaItem[]>(initialItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const agendaItems = items;

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(items) !== JSON.stringify(initialItems);
    } catch {
      return true;
    }
  }, [items, initialItems]);

  function onInlineChange(
    index: number,
    field: keyof AgendaItem,
    value: string
  ) {
    setSaved(false);
    setError(null);
    setItems((prev) => {
      const next = [...prev];
      const updated: AgendaItem = {
        ...next[index],
        [field]: value,
      } as AgendaItem;
      next[index] = updated;
      return next;
    });
  }

  function onAddItem() {
    setSaved(false);
    setError(null);
    setItems((prev) => [...prev, { topic: "", details: "" }]);
  }

  function onRemoveItem(index: number) {
    setSaved(false);
    setError(null);
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function onSave() {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/update-meeting-agenda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meeting_id: meeting.meeting_id,
          agenda_topics: normalizeForSave(items),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save agenda");
      }
      setSaved(true);
    } catch (e: any) {
      setError(e?.message || "Failed to save agenda");
    } finally {
      setSaving(false);
    }
  }

  if (agendaItems.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Meeting Agenda</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No agenda topics defined for this meeting.</p>
          </div>

          {editable && (
            <Button variant="outline" onClick={onAddItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          )}

          {error && <div className="text-sm text-destructive">{error}</div>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Meeting Agenda</span>
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          {agendaItems.length} topic{agendaItems.length !== 1 ? "s" : ""}{" "}
          planned
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {agendaItems.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 bg-background">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  {item.duration && (
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{item.duration}</span>
                    </div>
                  )}
                </div>
                {editable ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={item.topic}
                        onChange={(e) =>
                          onInlineChange(index, "topic", e.target.value)
                        }
                        placeholder="Agenda topic"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRemoveItem(index)}
                        className="shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Textarea
                      value={item.details || ""}
                      onChange={(e) =>
                        onInlineChange(index, "details", e.target.value)
                      }
                      placeholder="Details (optional)"
                      rows={2}
                    />
                  </div>
                ) : (
                  <>
                    <h4 className="font-medium text-sm">{item.topic}</h4>
                    {item.details && (
                      <p className="text-sm text-muted-foreground">
                        {item.details}
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {editable && (
          <>
            <Button variant="outline" onClick={onAddItem} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {saved && !saving && !error
                  ? "Saved"
                  : isDirty
                  ? "Unsaved changes"
                  : "No changes"}
              </div>
              <Button onClick={onSave} size="sm" disabled={!isDirty || saving}>
                {saving ? "Saving..." : "Save Agenda"}
              </Button>
            </div>
          </>
        )}

        {error && <div className="text-sm text-destructive">{error}</div>}
      </CardContent>
    </Card>
  );
}

function normalizeForSave(
  items: AgendaItem[]
): Array<{ topic: string; details?: string; duration?: string }> {
  return items.map((it) => ({
    topic: it.topic,
    details: it.details,
    duration: it.duration,
  }));
}
