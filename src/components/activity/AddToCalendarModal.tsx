import { useState } from "react";
import { X, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { useAddCalendarEvent } from "@/hooks/useCalendarEvents";
import { format } from "date-fns";

interface Props {
  activityId: string;
  activityName: string;
  onClose: () => void;
}

export function AddToCalendarModal({ activityId, activityName, onClose }: Props) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const addEvent = useAddCalendarEvent();

  const handleAdd = () => {
    if (!date) return;
    addEvent.mutate(
      {
        activityId,
        title: activityName,
        eventDate: format(date, "yyyy-MM-dd"),
        eventTime: time || undefined,
        notes: notes || undefined,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto p-5 space-y-4 safe-bottom">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-primary" />
            Add to Calendar
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">{activityName}</p>

        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-xl border border-border pointer-events-auto mx-auto"
          disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
        />

        <div>
          <label className="text-sm font-medium text-foreground">Time</label>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="mt-1" />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">Notes (optional)</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes..."
            className="mt-1"
          />
        </div>

        <Button
          className="w-full"
          onClick={handleAdd}
          disabled={!date || addEvent.isPending}
        >
          {addEvent.isPending ? "Adding..." : "Add to Calendar"}
        </Button>
      </div>
    </div>
  );
}
