"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { Clock, CalendarDays, UserCircle, ChevronLeft, ChevronRight, Check } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Use today's date if within the current month, otherwise the first of the month
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // ── Professor lookup ──────────────────────────────────────
  const profMap = new Map(professors.map((p) => [p.id, p.full_name]));

  const getProfName = useCallback(
    (id: string) => profMap.get(id) ?? "Unknown",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [professors]
  );

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

  // ── Data Grouping ─────────────────────────────────────────
  const windowsByDate = useMemo(() => {
    const map = new Map<string, WindowData[]>();
    for (const w of initialWindows) {
      const arr = map.get(w.date) ?? [];
      arr.push(w);
      map.set(w.date, arr);
    }
    return map;
  }, [initialWindows]);
  
  const slotsByWindow = useMemo(() => {
    const map = new Map<string, SlotData[]>();
    for (const slot of slots) {
      const arr = map.get(slot.window_id) ?? [];
      arr.push(slot);
      map.set(slot.window_id, arr);
    }
    return map;
  }, [slots]);

  // ── Handlers ──────────────────────────────────────────────
  const handleSlotClick = (slot: SlotData) => {
    if (slot.status !== "open") return;
    setSelectedSlot(slot);
    setDialogOpen(true);
  };

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // ── Calendar Helpers ──────────────────────────────────────
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const hasSlotsOnDate = useCallback((d: Date) => {
    const dateStr = format(d, "yyyy-MM-dd");
    return windowsByDate.has(dateStr);
  }, [windowsByDate]);
  
  const hasOpenSlotsOnDate = useCallback((d: Date) => {
    const dateStr = format(d, "yyyy-MM-dd");
    const windows = windowsByDate.get(dateStr) ?? [];
    return windows.some(w => {
      const wSlots = slotsByWindow.get(w.id) ?? [];
      return wSlots.some(s => s.status === "open");
    });
  }, [windowsByDate, slotsByWindow]);
  
  const hasBookedSlotsOnDate = useCallback((d: Date) => {
    const dateStr = format(d, "yyyy-MM-dd");
    const windows = windowsByDate.get(dateStr) ?? [];
    return windows.some(w => {
      const wSlots = slotsByWindow.get(w.id) ?? [];
      return wSlots.some(s => s.status === "booked" && s.student_id === currentUserId);
    });
  }, [currentUserId, slotsByWindow, windowsByDate]);

  // ── Status styles ─────────────────────────────────────────
  function slotClasses(slot: SlotData) {
    if (slot.status === "open") {
      return "border-green-300 bg-green-50/80 hover:bg-green-100 hover:border-green-400 text-green-900 shadow-sm dark:border-green-800 dark:bg-green-950/40 dark:hover:bg-green-900/60 dark:hover:border-green-600 dark:text-green-100 dark:shadow-none hover:-translate-y-0.5 cursor-pointer transition-all duration-200";
    }
    if (slot.status === "booked" && slot.student_id === currentUserId) {
      return "border-cyan-300 bg-cyan-100 text-cyan-900 shadow-[0_0_0_1px_rgba(8,145,178,0.2)_inset] dark:border-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-100 dark:shadow-[0_0_0_1px_rgba(8,145,178,0.4)_inset]";
    }
    if (slot.status === "booked") {
      return "border-zinc-200 bg-zinc-50 text-zinc-500 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-500";
    }
    // cancelled
    return "border-zinc-200 bg-zinc-100/30 text-zinc-400 opacity-40 dark:border-zinc-800 dark:bg-zinc-900/20 dark:text-zinc-600 line-through";
  }

  function statusBadge(slot: SlotData) {
    if (slot.status === "open") {
      return (
        <Badge variant="outline" className="font-medium border-green-300 bg-white text-green-700 shadow-sm dark:border-green-800 dark:bg-green-950 dark:text-green-400">
          Open
        </Badge>
      );
    }
    if (slot.status === "booked" && slot.student_id === currentUserId) {
      return (
        <Badge variant="outline" className="font-medium border-cyan-400 bg-white text-cyan-700 shadow-sm dark:border-cyan-700 dark:bg-cyan-950 dark:text-cyan-400">
          Your Booking
        </Badge>
      );
    }
    if (slot.status === "booked") {
      return (
        <Badge variant="outline" className="font-medium border-zinc-200 bg-white text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Taken
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="font-medium border-zinc-200 bg-white text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-500">
        Cancelled
      </Badge>
    );
  }

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const selectedWindows = windowsByDate.get(selectedDateStr) ?? [];

  // ── Render ────────────────────────────────────────────────
  return (
    <>
      {initialWindows.length === 0 ? (
        <Card className="border-dashed border-cyan-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-cyan-200 dark:text-zinc-700" />
            <p className="text-cyan-700 dark:text-zinc-400 text-lg font-medium">
              No upcoming consultation windows available.
            </p>
            <p className="text-sm text-cyan-600/70 dark:text-zinc-500 mt-1">
              Check back later when professors add their schedules.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Calendar Pane */}
          <div className="lg:col-span-4 lg:sticky lg:top-8">
            <Card className="border-cyan-100 shadow-md dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-cyan-50 dark:border-zinc-800/50 bg-cyan-50/50 dark:bg-zinc-900/50">
                <h2 className="text-lg font-semibold text-cyan-900 dark:text-zinc-100 capitalize">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <div className="flex gap-1 shadow-sm rounded-full overflow-hidden border border-cyan-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8 rounded-none text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => {setCurrentMonth(new Date()); setSelectedDate(new Date());}} className="h-8 px-2 font-medium rounded-none text-xs text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 border-x border-cyan-100 dark:border-zinc-800">
                    Today
                  </Button>
                  <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8 rounded-none text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4 sm:p-5">
                <div className="grid grid-cols-7 text-center text-xs font-semibold text-cyan-700/70 dark:text-zinc-500 mb-3">
                  <div>Su</div>
                  <div>Mo</div>
                  <div>Tu</div>
                  <div>We</div>
                  <div>Th</div>
                  <div>Fr</div>
                  <div>Sa</div>
                </div>
                <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-sm">
                  {calendarDays.map((d, i) => {
                    const isCurMonth = isSameMonth(d, monthStart);
                    const isSelDay = isSameDay(d, selectedDate);
                    const isTodayDate = isToday(d);
                    const hasS = hasSlotsOnDate(d);
                    const hasOpen = hasOpenSlotsOnDate(d);
                    const hasBooked = hasBookedSlotsOnDate(d);
                    
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedDate(d)}
                        className={`
                          relative flex flex-col items-center justify-center rounded-xl h-10 w-full transition-all duration-200
                          ${!isCurMonth ? "text-cyan-900/30 dark:text-zinc-600 font-light" : "text-cyan-900 dark:text-zinc-200 font-medium"}
                          ${isSelDay ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20 dark:bg-cyan-600 dark:text-white pointer-events-none" : "hover:bg-cyan-50 dark:hover:bg-zinc-800 cursor-pointer"}
                          ${isTodayDate && !isSelDay ? "border border-cyan-300 dark:border-cyan-800/60 text-cyan-800 dark:text-cyan-400 font-bold bg-cyan-50/50 dark:bg-cyan-900/20" : "border border-transparent"}
                        `}
                      >
                        <span className="z-10 relative">{format(d, "d")}</span>
                        
                        {/* Status dots container - fixed at bottom */}
                        <div className="absolute bottom-1.5 flex gap-0.5">
                          {hasBooked && <div className={`h-1 w-1 rounded-full ${isSelDay ? "bg-white" : "bg-cyan-500 dark:bg-cyan-400"} shadow-sm`} />}
                          {hasOpen && !hasBooked && <div className={`h-1 w-1 rounded-full ${isSelDay ? "bg-white" : "bg-green-500 dark:bg-green-400"} shadow-sm`} />}
                          {hasS && !hasOpen && !hasBooked && <div className={`h-1.5 w-1.5 rounded-full ${isSelDay ? "bg-cyan-200" : "bg-zinc-300 dark:bg-zinc-700"}`} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-cyan-800/70 dark:text-zinc-400 border-t border-cyan-50 pt-4 dark:border-zinc-800/50">
                  <div className="flex items-center gap-1.5 font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-sm" /> Available
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-sm" /> Your Booking
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Pane */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-cyan-200/50 dark:border-zinc-800 gap-2">
              <h3 className="text-xl font-bold text-cyan-900 dark:text-zinc-100 flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-cyan-600" />
                {format(selectedDate, "EEEE, MMMM d, yyyy")}
              </h3>
              {isToday(selectedDate) && (
                <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 border border-cyan-200/60 dark:bg-cyan-900/40 dark:text-cyan-400 dark:border-cyan-800 w-fit">
                  Today
                </Badge>
              )}
            </div>
            
            {selectedWindows.length === 0 ? (
              <Card className="border-dashed border-cyan-200 dark:border-zinc-800 bg-cyan-50/30 dark:bg-zinc-900/30 shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-3 bg-cyan-100/50 dark:bg-zinc-800 rounded-full mb-4">
                    <CalendarDays className="h-8 w-8 text-cyan-600/50 dark:text-zinc-500" />
                  </div>
                  <p className="text-cyan-800 dark:text-zinc-300 font-medium">
                    No windows available on this date
                  </p>
                  <p className="text-sm text-cyan-600/70 dark:text-zinc-500 mt-1">
                    Select a date with a green dot to view available slots.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5">
                {selectedWindows.map((w) => {
                  const windowSlots = slotsByWindow.get(w.id) ?? [];
                  if (windowSlots.length === 0) return null;
                  const profName = getProfName(w.professor_id);

                  return (
                    <Card
                      key={w.id}
                      className="border-cyan-100 shadow-sm dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-hidden hover:shadow-md transition-shadow duration-300 group"
                    >
                      <CardHeader className="p-4 sm:p-5 pb-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <CardTitle className="flex items-center gap-2 text-lg font-bold text-cyan-900 dark:text-zinc-100">
                            <UserCircle className="h-5 w-5 text-cyan-600" />
                            Prof. {profName}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1.5 text-sm font-medium text-cyan-700 bg-cyan-50 dark:bg-zinc-900 w-fit px-2.5 py-1 rounded-full dark:text-zinc-400 border border-cyan-100 dark:border-zinc-800">
                            <Clock className="h-3.5 w-3.5" />
                            {format(parseISO(`${w.date}T${w.start_time}`), "h:mm a")} — {format(parseISO(`${w.date}T${w.end_time}`), "h:mm a")}
                          </CardDescription>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-5 pt-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {windowSlots.map((slot) => {
                            const startTime = format(parseISO(slot.start_time), "h:mm a");
                            const endTime = format(parseISO(slot.end_time), "h:mm a");
                            
                            return (
                              <button
                                key={slot.id}
                                type="button"
                                disabled={slot.status !== "open"}
                                onClick={() => handleSlotClick(slot)}
                                className={`group/btn flex items-center justify-between rounded-xl border p-3.5 text-left transition-all duration-200 ${slotClasses(slot)}`}
                              >
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 opacity-50" />
                                  <div className="font-semibold text-sm">
                                    {startTime}
                                    <span className="mx-1.5 opacity-40 font-normal">–</span>
                                    {endTime}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {statusBadge(slot)}
                                  {slot.status === "booked" && slot.student_id === currentUserId && (
                                    <Check className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
