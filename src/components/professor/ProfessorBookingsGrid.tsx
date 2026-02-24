"use client";

import { useState, useMemo, useEffect, useRef, Fragment } from "react";
import { format, parseISO, isAfter } from "date-fns";
import * as anime from "animejs";
import { Plus, Calendar, ChevronDown, CheckCircle2, Clock, Trash2, Edit2, User as UserIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { CreateWindowForm } from "@/components/professor/CreateWindowForm";
import { BookedSlotDialog } from "@/components/professor/BookedSlotDialog";
import { DeleteWindowButton } from "@/components/professor/DeleteWindowButton";
import { EditWindowDialog } from "@/components/professor/EditWindowDialog";
import { DeletePastSlotButton } from "@/components/professor/DeletePastSlotButton";

import type { SlotStatus } from "@/types/database";

// ── Types ───────────────────────────────────────────────────

export interface SlotWithStudent {
  id: string;
  window_id: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  student_id: string | null;
  agenda: string | null;
  student: { full_name: string; id_number: string } | null;
}

export interface WindowData {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
}

interface ProfessorBookingsGridProps {
  windows: WindowData[];
  slotsByWindow: Map<string, SlotWithStudent[]>;
}

// Extended slot that includes window info for flat mapping
interface FlattenedSlot extends SlotWithStudent {
  date: string;
  window_start: string;
  window_end: string;
}

/**
 * Redesigned Timeline UI for the Professor Dashboard.
 */
export function ProfessorBookingsGrid({
  windows,
  slotsByWindow,
}: ProfessorBookingsGridProps) {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [showCreateWindow, setShowCreateWindow] = useState(false);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [selectedDateFilter, setSelectedDateFilter] = useState<Date | undefined>(undefined);
  const timelineRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search")?.toLowerCase() || "";

  // ── Data Processing ───────────────────────────────────────
  const allSlots = useMemo(() => {
    let flat: FlattenedSlot[] = [];
    const now = new Date();

    windows.forEach((w) => {
      const windowSlots = slotsByWindow.get(w.id) ?? [];
      
      // If a window has no slots generated yet, we still might want to show it as an empty block?
      // Actually, per UI design, we show specific slots/appointments. 
      // If no slots, let's create a "dummy" slot representing the open window itself so it appears on timeline.
      if (windowSlots.length === 0) {
         flat.push({
           id: w.id + "-dummy",
           window_id: w.id,
           start_time: w.start_time,
           end_time: w.end_time,
           status: "open",
           student_id: null,
           agenda: "No slots generated",
           student: null,
           date: w.date,
           window_start: w.start_time,
           window_end: w.end_time
         });
      } else {
        windowSlots.forEach(s => {
          flat.push({
            ...s,
            date: w.date,
            window_start: w.start_time,
            window_end: w.end_time
          });
        });
      }
    });

    // Sort chronologically
    flat.sort((a, b) => {
      const startAStr = a.start_time.includes("T") ? a.start_time : `${a.date}T${a.start_time}`;
      const startBStr = b.start_time.includes("T") ? b.start_time : `${b.date}T${b.start_time}`;
      const dateA = new Date(startAStr);
      const dateB = new Date(startBStr);
      return dateA.getTime() - dateB.getTime();
    });

    return flat;
  }, [windows, slotsByWindow]);

  const filteredSlots = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return allSlots.filter((slot) => {
      let isUpcoming = true; // Default safety fallback for malformed data
      let slotParsedTime = 0;
      let slotDateObj = new Date();
      
      try {
        const endStr = slot.end_time.includes("T") ? slot.end_time : `${slot.date}T${slot.end_time}`;
        const startStr = slot.start_time.includes("T") ? slot.start_time : `${slot.date}T${slot.start_time}`;
        
        const parsed = parseISO(endStr);
        slotDateObj = parseISO(startStr);
        slotParsedTime = parsed.getTime();
        
        if (!isNaN(slotParsedTime)) {
          if (slot.status === "cancelled") {
            isUpcoming = false;
          } else {
            isUpcoming = isAfter(parsed, now) || slotParsedTime === now.getTime();
          }
        }
      } catch (e) {
        console.error("Date format error for filteredSlots:", slot);
      }
      
      const matchesTab = activeTab === "upcoming" ? isUpcoming : !isUpcoming;
      if (!matchesTab) return false;

      // Apply Explicit Selected Date Filter
      if (selectedDateFilter && slotParsedTime > 0) {
        if (
          slotDateObj.getDate() !== selectedDateFilter.getDate() ||
          slotDateObj.getMonth() !== selectedDateFilter.getMonth() ||
          slotDateObj.getFullYear() !== selectedDateFilter.getFullYear()
        ) {
          return false;
        }
      } else {
        // Apply Dropdown Date Filter Segment
        if (dateFilter !== "all" && slotParsedTime > 0) {
           if (dateFilter === "today") {
              const isToday = slotDateObj.getDate() === now.getDate() && 
                              slotDateObj.getMonth() === now.getMonth() && 
                              slotDateObj.getFullYear() === now.getFullYear();
              if (!isToday) return false;
           } else if (dateFilter === "week") {
              const diffTime = Math.abs(slotDateObj.getTime() - now.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              if (activeTab === "upcoming" && (slotDateObj < startOfToday || diffDays > 7)) return false;
              if (activeTab === "past" && ((slotDateObj > now && slot.status !== "cancelled") || diffDays > 7)) return false;
           } else if (dateFilter === "month") {
              if (slotDateObj.getMonth() !== now.getMonth() || slotDateObj.getFullYear() !== now.getFullYear()) return false;
           }
        }
      }
      
      // Filter by search query across multiple fields
      if (searchQuery) {
        const studentName = slot.student?.full_name?.toLowerCase() || "";
        const agenda = slot.agenda?.toLowerCase() || "general consultation";
        return studentName.includes(searchQuery) || agenda.includes(searchQuery);
      }
      
      return true;
    });
  }, [allSlots, activeTab, searchQuery, dateFilter, selectedDateFilter]);

  // ── Animations ────────────────────────────────────────────
  useEffect(() => {
    if (!timelineRef.current) return;

    // Reset styles
    const cards = timelineRef.current.querySelectorAll('.timeline-card');
    const nodes = timelineRef.current.querySelectorAll('.timeline-node');
    
    if (cards.length === 0 || nodes.length === 0) return;

    anime.set([cards, nodes], {
      opacity: 0,
    });
    anime.set(cards, {
      translateX: 20,
    });
    anime.set(nodes, {
      scale: 0.5,
    });

    // Animate
    const tl = anime.createTimeline({
      defaults: {
        ease: 'outExpo',
      }
    });

    tl.add(nodes, {
      opacity: [0, 1],
      scale: [0.5, 1],
      duration: 500,
      delay: anime.stagger(100)
    })
    .add(cards, {
      opacity: [0, 1],
      translateX: [20, 0],
      duration: 600,
      delay: anime.stagger(100)
    }, '-=400');

  }, [filteredSlots, activeTab]);


  // ── Render ────────────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 w-full bg-none shadow-none border-none">
      
      {/* Top Navigation / Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white rounded-2xl p-2 px-3 shadow-sm border border-zinc-100 mb-6 sticky top-0 z-20">
        
        {/* Tabs */}
        <div className="flex gap-1 p-1">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "upcoming" 
                ? "text-[#ff5757] bg-[#ff5757]/10" 
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Upcoming Appointments
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === "past" 
                ? "text-[#ff5757] bg-[#ff5757]/10" 
                : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            Past Appointments
          </button>
        </div>

        {/* Action Button */}
        <div className="mt-2 sm:mt-0 px-2 sm:px-0 pb-2 sm:pb-0">
          <Button 
            onClick={() => setShowCreateWindow(!showCreateWindow)}
            className="w-full sm:w-auto bg-[#ff5757] hover:bg-[#ff4242] text-white rounded-full px-6 shadow-md shadow-red-500/20 font-semibold"
          >
            {showCreateWindow ? "Cancel" : (
              <>
                <Plus className="mr-2 w-4 h-4" />
                Add New
              </>
            )}
          </Button>
        </div>
      </div>

      {showCreateWindow && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
           <CreateWindowForm />
        </div>
      )}

      {/* Main Content Pane */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-zinc-100 flex-1 relative flex flex-col">
        
        {/* List Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-100">
          <h2 className="text-lg font-bold text-zinc-800">
            {filteredSlots.length} Appointment{filteredSlots.length !== 1 && 's'}
          </h2>
          <div className="flex items-center gap-3">
            <div className="relative inline-block text-left">
              <select
                value={selectedDateFilter ? "custom" : dateFilter}
                onChange={(e) => {
                  if (e.target.value !== "custom") {
                    setSelectedDateFilter(undefined);
                    setDateFilter(e.target.value as any);
                  }
                }}
                className="appearance-none bg-white border border-zinc-200 text-zinc-600 font-medium py-2 pl-4 pr-10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#ff5757]/20 focus:border-[#ff5757] sm:text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Past 7 Days</option>
                <option value="month">This Month</option>
                {selectedDateFilter && <option value="custom">Custom Date</option>}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>

            {/* Custom Date Picker Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={`w-[42px] h-[42px] p-0 rounded-xl border-zinc-200 shadow-sm ${selectedDateFilter ? "border-[#ff5757] text-[#ff5757] bg-[#ff5757]/5" : "text-zinc-500 hover:text-zinc-800"}`}
                  title="Pick a specific date"
                >
                  <Calendar className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <ShadcnCalendar
                  mode="single"
                  selected={selectedDateFilter}
                  onSelect={(date) => {
                    setSelectedDateFilter(date);
                    if (date) setDateFilter("all"); // Reset standard filter when custom date is used
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Timeline Container */}
        <div className="relative pl-6 sm:pl-10 pb-4" ref={timelineRef}>
          
          {/* Vertical Track Line */}
          {filteredSlots.length > 0 && (
            <div className="absolute left-[7px] sm:left-[23px] top-6 bottom-0 w-[2px] bg-zinc-200 z-0"></div>
          )}

          {filteredSlots.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center">
              <Calendar className="w-12 h-12 text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">No appointments found in this category.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSlots.map((slot, idx) => {
                let startTimeStr = "Unknown";
                let endTimeStr = "Unknown";
                let dayMonthStr = "Unknown";
                
                try {
                  const startDateTime = slot.start_time.includes("T") ? slot.start_time : `${slot.date}T${slot.start_time}`;
                  const endDateTime = slot.end_time.includes("T") ? slot.end_time : `${slot.date}T${slot.end_time}`;
                  startTimeStr = format(parseISO(startDateTime), "h:mm a");
                  endTimeStr = format(parseISO(endDateTime), "h:mm a");
                  dayMonthStr = format(parseISO(startDateTime), "dd MMM, yyyy");
                } catch (e) {
                  console.error("Date format error for slot:", slot);
                }
                
                // Active status based on color scheme matching reference
                // Red border node for first active, hollow gray for others
                const isFirstActive = activeTab === "upcoming" && idx === 0;

                const prevSlot = idx > 0 ? filteredSlots[idx - 1] : null;
                const isNewWindow = prevSlot && (prevSlot.window_id !== slot.window_id || prevSlot.date !== slot.date);

                return (
                  <Fragment key={slot.id}>
                    {isNewWindow && (
                      <div className="relative py-4 w-full -ml-px opacity-70">
                        <div className="absolute left-[7px] sm:left-[23px] top-1/2 w-8 h-[2px] bg-zinc-200 -translate-y-[50%] z-10"></div>
                        <div className="border-t-2 border-dashed border-zinc-200 ml-12 sm:ml-16 relative z-10">
                           <div className="absolute -top-[12px] left-4 bg-zinc-50 px-3 py-0.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest rounded-full border border-zinc-200 inline-block">
                             New Session
                           </div>
                        </div>
                      </div>
                    )}
                    <div className="relative z-10">
                    {/* Timeline Node */}
                    <div 
                      className={`timeline-node absolute -left-[27px] sm:-left-[43px] top-[28px] w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center translate-x-[50%] -translate-y-[50%] z-20 transition-colors
                        ${slot.status === "cancelled" ? "border-red-300" : isFirstActive ? "border-[#ff5757]" : "border-zinc-300"}
                      `}
                    >
                      {slot.status === "cancelled" ? (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                      ) : isFirstActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-[#ff5757]"></div>
                      )}
                    </div>

                    {/* Content Card */}
                    <div className="timeline-card bg-zinc-50 hover:bg-zinc-100/80 transition-colors rounded-2xl py-4 flex flex-col sm:flex-row gap-4 sm:items-center px-4 sm:px-6">
                      
                      {/* Date & Time */}
                      <div className={`sm:w-1/4 sm:min-w-[180px] shrink-0 border-b sm:border-b-0 sm:border-r border-zinc-200 pb-3 sm:pb-0 sm:pr-4 ${slot.status === "cancelled" ? "opacity-60" : ""}`}>
                        <div className={`font-bold mb-1 ${slot.status === "cancelled" ? "text-zinc-500 line-through" : "text-zinc-900"}`}>{dayMonthStr}</div>
                        <div className={`text-sm font-medium ${slot.status === "cancelled" ? "text-red-400 line-through" : "text-zinc-500"}`}>
                          {startTimeStr} - {endTimeStr}
                        </div>
                      </div>

                       {/* Patient / Details */}
                       <div className={`flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 ${slot.status === "cancelled" ? "opacity-60" : ""}`}>
                          <div>
                            <div className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase mb-1">
                              {slot.status === "booked" ? "Student" : "Status"}
                            </div>
                            <div className="font-semibold text-zinc-800">
                              {slot.status === "booked" && slot.student ? slot.student.full_name : 
                               (slot.status === "open" ? (
                                 activeTab === "past" ? <span className="text-zinc-400 italic">Unbooked</span> :
                                 <span className="text-emerald-600 font-medium flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4"/> Available Slot</span>
                               ) : slot.status === "cancelled" ? (
                                 <span className="text-red-600 font-medium italic underline decoration-red-300">Cancelled by you</span>
                               ) : <span className="text-zinc-400 italic">N/A</span>)}
                            </div>
                          </div>
                         <div>
                           <div className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase mb-1">Agenda</div>
                           <div className="font-semibold text-zinc-800 truncate">
                             {slot.agenda || <span className="text-zinc-400 font-normal">No agenda specified</span>}
                           </div>
                         </div>
                      </div>

                      {/* Action */}
                      <div className="shrink-0 flex items-center justify-end gap-2">
                        {slot.status === "booked" && slot.student ? (
                          <>
                            <BookedSlotDialog
                              slot={{
                                id: slot.id,
                                start_time: slot.start_time,
                                end_time: slot.end_time,
                                agenda: slot.agenda,
                                studentName: slot.student.full_name,
                                studentIdNumber: slot.student.id_number,
                              }}
                              className="bg-white border hover:bg-red-50 hover:text-[#ff5757] hover:border-red-200 text-[#ff5757] border-[#ff5757]/20 shadow-sm rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 transition-colors"
                              customTrigger={
                                <>
                                  <Clock className="w-4 h-4" /> {startTimeStr} - {endTimeStr}
                                </>
                              }
                            />
                            {activeTab === "past" && <DeletePastSlotButton slotId={slot.id} />}
                          </>
                        ) : slot.status === "cancelled" ? (
                          <>
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 shadow-sm opacity-80 cursor-not-allowed">
                               Revoked
                            </div>
                            {activeTab === "past" && <DeletePastSlotButton slotId={slot.id} />}
                          </>
                        ) : activeTab === "past" ? (
                          <>
                            <div className="bg-zinc-100/50 border border-zinc-200 text-zinc-400 rounded-xl px-4 py-2 text-sm font-bold flex items-center gap-2 shadow-sm opacity-80 cursor-not-allowed">
                               Unbooked
                            </div>
                            <DeletePastSlotButton slotId={slot.id} />
                          </>
                        ) : (
                          // Controls for Empty Windows/Slots
                          <div className="flex gap-2">
                            <EditWindowDialog
                              windowId={slot.window_id}
                              initialDate={slot.date}
                              initialStartTime={slot.window_start}
                              initialEndTime={slot.window_end}
                              hasBookedSlots={false}
                              customTrigger={
                                <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl border-zinc-200 text-zinc-500 hover:text-blue-600 hover:border-blue-200"><Edit2 className="w-4 h-4"/></Button>
                              }
                            />
                            <DeleteWindowButton windowId={slot.window_id} customTrigger={
                                <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl border-zinc-200 text-zinc-500 hover:text-red-600 hover:border-red-200"><Trash2 className="w-4 h-4"/></Button>
                            } />
                          </div>
                        )}
                      </div>

                    </div>
                    </div>
                  </Fragment>
                );
              })}
            </div>
          )}

        </div>
      </div>
      
    </div>
  );
}
