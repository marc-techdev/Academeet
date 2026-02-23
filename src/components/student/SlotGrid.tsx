"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, parseISO } from "date-fns";
import { Clock, CalendarDays, UserCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingDialog } from "./BookingDialog";

import type { SlotStatus } from "@/types/database";

// ── Types ───────────────────────────────────────────────────

export interface SlotData {
  id: string;
  window_id: string;
  professor_id: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  student_id: string | null;
  agenda: string | null;
}

export interface WindowData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  professor_id: string;
}

export interface ProfessorProfile {
  id: string;
  full_name: string;
}

interface SlotGridProps {
  initialWindows: WindowData[];
  initialSlots: SlotData[];
  professors: ProfessorProfile[];
  currentUserId: string;
}

/**
 * Real-time slot grid — renders professors' consultation windows and
 * subscribes to Supabase Realtime for instant slot status updates.
 */
export function SlotGrid({
  initialWindows,
  initialSlots,
  professors,
  currentUserId,
}: SlotGridProps) {
  const [slots, setSlots] = useState<SlotData[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // ── Professor lookup ──────────────────────────────────────
  const profMap = new Map(professors.map((p) => [p.id, p.full_name]));

  const getProfName = useCallback(
    (id: string) => profMap.get(id) ?? "Unknown",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [professors]
  );

  // ── Group slots by window ─────────────────────────────────
  const slotsByWindow = new Map<string, SlotData[]>();
  for (const slot of slots) {
    const arr = slotsByWindow.get(slot.window_id) ?? [];
    arr.push(slot);
    slotsByWindow.set(slot.window_id, arr);
  }

  // ── Supabase Realtime subscription ────────────────────────
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("slots-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "slots" },
        (payload) => {
          const updated = payload.new as SlotData;
          setSlots((prev) =>
            prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "slots" },
        (payload) => {
          const inserted = payload.new as SlotData;
          setSlots((prev) => {
            // Avoid duplicates
            if (prev.some((s) => s.id === inserted.id)) return prev;
            return [...prev, inserted];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────
  const handleSlotClick = (slot: SlotData) => {
    if (slot.status !== "open") return;
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  // ── Status styles ─────────────────────────────────────────
  function slotClasses(slot: SlotData) {
    if (slot.status === "open") {
      return "cursor-pointer border-emerald-200 bg-emerald-50/60 hover:border-emerald-400 hover:bg-emerald-100/80 dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:border-emerald-600 transition-colors";
    }
    if (slot.status === "booked" && slot.student_id === currentUserId) {
      return "border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/30";
    }
    if (slot.status === "booked") {
      return "border-zinc-200 bg-zinc-100/50 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/30";
    }
    // cancelled
    return "border-zinc-200 bg-zinc-100/30 opacity-40 dark:border-zinc-800 dark:bg-zinc-900/20 line-through";
  }

  function statusBadge(slot: SlotData) {
    if (slot.status === "open") {
      return (
        <Badge
          variant="outline"
          className="border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
        >
          Open
        </Badge>
      );
    }
    if (slot.status === "booked" && slot.student_id === currentUserId) {
      return (
        <Badge
          variant="outline"
          className="border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-400"
        >
          Your Booking
        </Badge>
      );
    }
    if (slot.status === "booked") {
      return (
        <Badge
          variant="outline"
          className="border-zinc-300 bg-zinc-100 text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
        >
          Taken
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-zinc-400">
        Cancelled
      </Badge>
    );
  }

  // ── Render ────────────────────────────────────────────────
  if (initialWindows.length === 0) {
    return (
      <Card className="border-dashed border-zinc-300 dark:border-zinc-700">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <CalendarDays className="mb-3 h-10 w-10 text-zinc-400" />
          <p className="text-sm text-muted-foreground">
            No upcoming consultation windows available. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-6">
        {initialWindows.map((w) => {
          const windowSlots = slotsByWindow.get(w.id) ?? [];
          const profName = getProfName(w.professor_id);

          return (
            <Card
              key={w.id}
              className="border-zinc-200/60 shadow-sm dark:border-zinc-800/60"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarDays className="h-4 w-4 text-emerald-600" />
                    {format(parseISO(w.date), "EEEE, MMMM d, yyyy")}
                  </CardTitle>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <UserCircle className="h-4 w-4" />
                    Prof. {profName}
                  </div>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {w.start_time.slice(0, 5)} — {w.end_time.slice(0, 5)}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {windowSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={slot.status !== "open"}
                      onClick={() => handleSlotClick(slot)}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left ${slotClasses(slot)}`}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium">
                          {format(parseISO(slot.start_time), "h:mm a")}
                        </span>
                        <span className="text-muted-foreground">–</span>
                        <span className="font-medium">
                          {format(parseISO(slot.end_time), "h:mm a")}
                        </span>
                      </div>
                      {statusBadge(slot)}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Booking dialog */}
      {selectedSlot && (
        <BookingDialog
          slotId={selectedSlot.id}
          slotTime={`${format(parseISO(selectedSlot.start_time), "h:mm a")} – ${format(parseISO(selectedSlot.end_time), "h:mm a")}`}
          professorName={getProfName(selectedSlot.professor_id)}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  );
}
