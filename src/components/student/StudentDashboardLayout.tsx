"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Search, Settings, Clock, GraduationCap } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DaySlotsModal } from "./DaySlotsModal";
import { BookingDialog } from "./BookingDialog";
import { StudentManageBookingDialog } from "./StudentManageBookingDialog";

// Import types
import type { SlotStatus } from "@/types/database";

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
  topic: string;
}

export interface ProfessorProfile {
  id: string;
  full_name: string;
}

interface StudentDashboardLayoutProps {
  initialWindows: WindowData[];
  initialSlots: SlotData[];
  professors: ProfessorProfile[];
  currentUserId: string;
  studentName: string;
}

function safeParseDate(dateStr: string, timeStr: string): Date {
  if (!timeStr) return new Date();
  const d = parseISO(`${dateStr}T${timeStr.trim()}`);
  if (isNaN(d.getTime())) {
     // fallback
     return new Date(`${dateStr} 00:00:00`);
  }
  return d;
}

function safeFormatTime(dateStr: string, timeStr: string) {
  if (!timeStr) return "Unknown";
  try {
    const d = parseISO(`${dateStr}T${timeStr.trim()}`);
    if (isNaN(d.getTime())) {
       // fallback manual parse
       const parts = timeStr.split(":");
       if (parts.length >= 2) {
         let h = parseInt(parts[0], 10);
         const m = parts[1];
         const ampm = h >= 12 ? "PM" : "AM";
         h = h % 12 || 12;
         return `${h}:${m} ${ampm}`;
       }
       return timeStr;
    }
    return format(d, "h:mm a");
  } catch (e) {
    return timeStr;
  }
}

// Category mappings for consistent pill colors
const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-emerald-500",
  Thesis: "bg-blue-500",
  Practicum: "bg-purple-500",
  Capstone: "bg-amber-500",
  Other: "bg-zinc-500"
};

export function StudentDashboardLayout({
  initialWindows,
  initialSlots,
  professors,
  currentUserId,
  studentName,
}: StudentDashboardLayoutProps) {
  // Realtime slots state
  const [slots, setSlots] = useState<SlotData[]>(initialSlots);
  const [activeCategories, setActiveCategories] = useState<string[]>(Object.keys(CATEGORY_COLORS));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Header state
  const [selectedProfessorId, setSelectedProfessorId] = useState<string>("all");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  
  // Modals state
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  
  // Booking flow state
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [selectedWindowForSlot, setSelectedWindowForSlot] = useState<WindowData | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

  // Manage booking state
  const [manageSlotOpen, setManageSlotOpen] = useState(false);
  const [selectedManageSlot, setSelectedManageSlot] = useState<SlotData | null>(null);
  const [selectedManageWindow, setSelectedManageWindow] = useState<WindowData | null>(null);

  // ── Supabase Realtime subscription ──
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("slots-realtime-layout")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "slots" }, (payload) => {
          const updated = payload.new as SlotData;
          setSlots((prev) => prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "slots" }, (payload) => {
          const inserted = payload.new as SlotData;
          setSlots((prev) => {
            if (prev.some((s) => s.id === inserted.id)) return prev;
            return [...prev, inserted];
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Data Computed ──
  // Filter out cancelled windows to clean up the big calendar
  const activeWindows = useMemo(() => {
    return initialWindows.filter(w => {
      const wSlots = slots.filter(s => s.window_id === w.id);
      return wSlots.some(s => s.status === "open" || s.status === "booked");
    });
  }, [initialWindows, slots]);

  const windowsByDate = useMemo(() => {
    const map = new Map<string, WindowData[]>();
    for (const w of activeWindows) {
      if (!activeCategories.includes(w.topic)) continue; // Filter by category
      if (selectedProfessorId !== "all" && w.professor_id !== selectedProfessorId) continue; // Filter by professor
      
      const arr = map.get(w.date) ?? [];
      arr.push(w);
      map.set(w.date, arr);
    }
    return map;
  }, [activeWindows, activeCategories, selectedProfessorId]);
  
  const slotsByWindow = useMemo(() => {
    const map = new Map<string, SlotData[]>();
    for (const slot of slots) {
      const arr = map.get(slot.window_id) ?? [];
      arr.push(slot);
      map.set(slot.window_id, arr);
    }
    return map;
  }, [slots]);

  const profMap = useMemo(() => new Map(professors.map((p) => [p.id, p.full_name])), [professors]);

  // Derived Bookings for the "My Schedules" list
  const upcomingBookedSlots = useMemo(() => {
    return slots
      .filter(s => s.status === "booked" && s.student_id === currentUserId)
      .sort((a, b) => {
         const wa = activeWindows.find(w => w.id === a.window_id);
         const wb = activeWindows.find(w => w.id === b.window_id);
         if (!wa || !wb) return 0;
         const da = safeParseDate(wa.date, a.start_time);
         const db = safeParseDate(wb.date, b.start_time);
         return da.getTime() - db.getTime();
      });
  }, [slots, currentUserId, activeWindows]);

  // ── Calendar Helpers ──
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleDayClick = (d: Date) => {
     setSelectedCalendarDate(d);
     setDayModalOpen(true);
  };
  
  const handleSlotSelection = (slot: SlotData, window: WindowData) => {
     setSelectedSlot(slot);
     setSelectedWindowForSlot(window);
     setBookingDialogOpen(true);
  };

  const toggleCategory = (cat: string) => {
    if (activeCategories.includes(cat)) {
      setActiveCategories(prev => prev.filter(c => c !== cat));
    } else {
      setActiveCategories(prev => [...prev, cat]);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden border-l border-zinc-200/50 bg-white">
      {/* SECONDARY SIDEBAR (Local Context) */}
      <div className="w-[300px] border-r border-zinc-200 flex flex-col h-full bg-zinc-50/30 overflow-y-auto overflow-x-hidden">
        
        {/* Header / Search Area */}
        <div className="p-6 border-b border-zinc-100 hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5438dc] transition-all"
            />
          </div>
        </div>

        {/* Small Calendar Header */}
        <div className="p-6 pb-2">
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-zinc-900 font-bold tracking-tight">{format(currentMonth, "MMMM yyyy")}</h3>
             <div className="flex gap-1">
               <button onClick={prevMonth} className="p-1 hover:bg-zinc-200 rounded-md text-zinc-500 transition-colors"><ChevronLeft className="h-4 w-4" /></button>
               <button onClick={nextMonth} className="p-1 hover:bg-zinc-200 rounded-md text-zinc-500 transition-colors"><ChevronRight className="h-4 w-4" /></button>
             </div>
          </div>
          
          {/* Small Calendar Grid */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
            <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-xs font-semibold">
             {calendarDays.map((d, i) => {
                const isCurMonth = isSameMonth(d, monthStart);
                const isTodayDate = isToday(d);
                const isSelected = selectedCalendarDate && isSameDay(d, selectedCalendarDate);
                
                return (
                  <button
                    key={i}
                    onClick={() => handleDayClick(d)}
                    className={`
                      relative flex items-center justify-center rounded-full h-8 w-8 mx-auto transition-all cursor-pointer
                      ${!isCurMonth ? "text-zinc-300" : "text-zinc-700"}
                      ${isSelected ? "bg-[#5438dc] text-white shadow-md font-bold" : "hover:bg-zinc-200"}
                      ${isTodayDate && !isSelected ? "border border-[#5438dc] text-[#5438dc]" : ""}
                    `}
                  >
                    {format(d, "d")}
                  </button>
                );
             })}
          </div>
        </div>

        {/* My Schedules */}
        <div className="p-6 pt-8 border-t border-zinc-100 flex-1">
          <h3 className="text-zinc-900 font-bold tracking-tight mb-4 flex items-center justify-between text-sm uppercase">
            My Schedules
          </h3>
          <div className="space-y-3">
             {upcomingBookedSlots.length === 0 ? (
                <p className="text-zinc-400 text-sm italic">No confirmed bookings.</p>
             ) : (
                upcomingBookedSlots.slice(0, 5).map(slot => {
                   const win = activeWindows.find(w => w.id === slot.window_id);
                   if(!win) return null;
                   // Get color mapped by topic
                   const bgColorClass = CATEGORY_COLORS[win.topic] ?? CATEGORY_COLORS["Other"];
                   
                   return (
                     <div 
                        key={slot.id} 
                        onClick={() => {
                           setSelectedManageSlot(slot);
                           setSelectedManageWindow(win);
                           setManageSlotOpen(true);
                        }}
                        className="flex items-start gap-3 group cursor-pointer p-2 -mx-2 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-zinc-100 transition-all"
                     >
                        <div className={`mt-1 h-3 w-3 rounded-full shrink-0 ${bgColorClass}`} />
                        <div className="flex flex-col">
                           <span className="text-zinc-700 font-semibold text-sm leading-tight group-hover:text-[#5438dc] transition-colors line-clamp-1">
                              Consultation with Prof. {profMap.get(win.professor_id) ?? "Unknown"}
                           </span>
                           <span className="text-zinc-400 text-xs font-medium mt-0.5">
                              {format(safeParseDate(win.date, slot.start_time), "MMM d")}, {safeFormatTime(win.date, slot.start_time)}
                           </span>
                        </div>
                     </div>
                   );
                })
             )}
          </div>
        </div>

        {/* Categories */}
        <div className="p-6 border-t border-zinc-100 pb-8">
          <h3 className="text-zinc-900 font-bold tracking-tight mb-4 text-sm uppercase">
             Categories
          </h3>
          <div className="space-y-3">
             {Object.entries(CATEGORY_COLORS).map(([cat, colorClass]) => {
                const isActive = activeCategories.includes(cat);
                return (
                   <div 
                     key={cat} 
                     onClick={() => toggleCategory(cat)}
                     className={`flex items-center gap-3 cursor-pointer transition-opacity ${isActive ? "opacity-100" : "opacity-40 hover:opacity-70"}`}
                   >
                     <div className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />
                     <span className={`text-sm font-semibold ${isActive ? "text-zinc-800" : "text-zinc-500"}`}>{cat}</span>
                   </div>
                );
             })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT (Big Calendar) */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Top Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 pb-4 border-b border-zinc-100 bg-white">
           <div className="flex items-center gap-6 mb-4 lg:mb-0">
              <div className="flex items-center gap-2 text-[#5438dc] font-bold text-xl tracking-tight">
                 <GraduationCap className="h-7 w-7" />
                 Academeet
              </div>
              <div className="h-6 w-px bg-zinc-200 hidden sm:block"></div>
              <div className="flex items-center gap-2 text-zinc-500 font-medium whitespace-nowrap">
                 <Clock className="h-4 w-4" />
                 {format(currentTime, "MMM d, yyyy • h:mm:ss a")}
              </div>
           </div>
           
           <div className="flex flex-wrap items-center gap-4">
              <select 
                value={selectedProfessorId}
                onChange={(e) => setSelectedProfessorId(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 text-zinc-700 text-sm rounded-lg focus:ring-[#5438dc] focus:border-[#5438dc] block p-2 md:p-2.5 font-medium shadow-sm transition-colors"
              >
                 <option value="all">All Professors</option>
                 {professors.map(p => (
                   <option key={p.id} value={p.id}>Prof. {p.full_name}</option>
                 ))}
              </select>
              
              <div className="h-8 w-px bg-zinc-200 hidden sm:block"></div>
              
              <div className="flex items-center gap-3">
                 <div className="hidden sm:flex flex-col items-end">
                    <span className="text-sm font-bold text-zinc-900">{studentName}</span>
                    <span className="text-xs text-zinc-500 font-medium">Student</span>
                 </div>
                 <Avatar className="h-10 w-10 border shadow-sm border-zinc-200">
                   <AvatarImage src={`https://api.dicebear.com/7.x/notionists/svg?seed=${studentName}`} />
                   <AvatarFallback className="bg-[#5438dc]/10 text-[#5438dc] font-bold">
                     {studentName.charAt(0)}
                   </AvatarFallback>
                 </Avatar>
              </div>
           </div>
        </div>

        <div className="flex items-center justify-between p-8 pb-4">
           {/* Top Title */}
           <div className="flex items-center gap-6">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 border-l-4 border-[#5438dc] pl-4">
                 {format(currentMonth, "MMMM yyyy")}
              </h1>
           </div>
        </div>

        {/* Big Calendar Grid Container */}
        <div className="flex-1 flex flex-col p-8 pt-4 overflow-hidden">
           {/* Grid Headers */}
           <div className="grid grid-cols-7 border-b border-zinc-200/60 pb-3">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                 <div key={day} className="text-sm font-bold text-zinc-400 text-center tracking-wider">{day}</div>
              ))}
           </div>
           
           {/* Grid Cells */}
           <div className="flex-1 grid grid-cols-7 grid-rows-5 gap-px bg-zinc-100 border border-zinc-100 rounded-xl overflow-hidden mt-2">
              {calendarDays.slice(0, 35).map((d, i) => {
                 const isCurMonth = isSameMonth(d, monthStart);
                 const dateStr = format(d, "yyyy-MM-dd");
                 const daysWindows = windowsByDate.get(dateStr) ?? [];
                 
                 return (
                    <div 
                      key={i} 
                      onClick={() => handleDayClick(d)}
                      className={`bg-white p-2 min-h-[100px] flex flex-col gap-1.5 transition-colors hover:bg-zinc-50 cursor-pointer ${!isCurMonth ? "bg-zinc-50/50" : ""}`}
                    >
                       <span className={`text-sm font-bold pl-1 ${!isCurMonth ? "text-zinc-300" : "text-zinc-900"}`}>
                          {format(d, "d")}
                       </span>
                       
                       {/* Render Topic Pills */}
                       <div className="flex flex-col gap-1 overflow-y-auto max-h-[120px] pr-1 styled-scrollbar">
                           {daysWindows.map(w => {
                              const colorClass = CATEGORY_COLORS[w.topic] ?? CATEGORY_COLORS["Other"];
                              return (
                                 <div 
                                    key={w.id} 
                                    className={`${colorClass} text-white px-2 py-1 rounded-md text-xs font-semibold truncate shadow-sm`}
                                 >
                                    {w.topic}
                                 </div>
                              );
                           })}
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
      </div>

      {/* Slots Selection Modal Component */}
      <DaySlotsModal 
        date={selectedCalendarDate}
        windows={windowsByDate.get(selectedCalendarDate ? format(selectedCalendarDate, "yyyy-MM-dd") : "") ?? []}
        slotsByWindow={slotsByWindow}
        profMap={profMap}
        open={dayModalOpen}
        onOpenChange={setDayModalOpen}
        onSlotClick={handleSlotSelection}
        currentUserId={currentUserId}
      />
      
      {/* Booking Form Dialog */}
      {selectedSlot && selectedWindowForSlot && (
        <BookingDialog
          slotId={selectedSlot.id}
          slotTime={`${safeFormatTime(selectedWindowForSlot.date, selectedSlot.start_time)} – ${safeFormatTime(selectedWindowForSlot.date, selectedSlot.end_time)}`}
          professorName={profMap.get(selectedWindowForSlot.professor_id) ?? "Unknown"}
          topic={selectedWindowForSlot.topic}
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
        />
      )}

      {/* Manage Existing Booking Dialog */}
      {selectedManageSlot && selectedManageWindow && (
        <StudentManageBookingDialog
          slot={selectedManageSlot}
          window={selectedManageWindow}
          professorName={profMap.get(selectedManageWindow.professor_id) ?? "Unknown"}
          open={manageSlotOpen}
          onOpenChange={setManageSlotOpen}
        />
      )}
    </div>
  );
}
