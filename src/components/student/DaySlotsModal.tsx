"use client";

import { format, parseISO } from "date-fns";
import { UserCircle, Clock, CalendarDays, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type { SlotData, WindowData } from "./StudentDashboardLayout";

interface DaySlotsModalProps {
  date: Date | null;
  windows: WindowData[];
  slotsByWindow: Map<string, SlotData[]>;
  profMap: Map<string, string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSlotClick: (slot: SlotData, window: WindowData) => void;
  currentUserId: string;
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

const CATEGORY_COLORS: Record<string, string> = {
  General: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Thesis: "bg-blue-50 text-blue-700 border-blue-200",
  Practicum: "bg-purple-50 text-purple-700 border-purple-200",
  Capstone: "bg-amber-50 text-amber-700 border-amber-200",
  Other: "bg-zinc-100 text-zinc-700 border-zinc-200"
};

export function DaySlotsModal({
  date,
  windows,
  slotsByWindow,
  profMap,
  open,
  onOpenChange,
  onSlotClick,
  currentUserId
}: DaySlotsModalProps) {
  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-7xl max-h-[85vh] overflow-y-auto w-[95vw] p-0 rounded-2xl border-none">
        
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl border-b border-zinc-100 p-6 pb-4">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-3 text-2xl font-bold tracking-tight text-zinc-900">
               <div className="p-2.5 bg-[#5438dc]/10 rounded-xl text-[#5438dc]">
                 <CalendarDays className="h-6 w-6" />
               </div>
               {format(date, "EEEE, MMMM d")}
             </DialogTitle>
             <DialogDescription className="text-zinc-500 font-medium ml-14 mt-1">
               Select an available time slot below to book your consultation.
             </DialogDescription>
           </DialogHeader>
        </div>

        <div className="p-6 pt-4 flex flex-col gap-6">
          {windows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-zinc-50 rounded-2xl border border-zinc-100 border-dashed">
              <CalendarDays className="h-10 w-10 text-zinc-300 mb-4" />
              <p className="text-zinc-500 font-medium">No available slots for this date.</p>
            </div>
          ) : (
            windows.map((w) => {
              const wSlots = slotsByWindow.get(w.id) ?? [];
              // Only show windows that have slots
              if (wSlots.length === 0) return null;
              
              const profName = profMap.get(w.professor_id) ?? "Unknown";
              const topicColor = CATEGORY_COLORS[w.topic] ?? CATEGORY_COLORS["Other"];

              return (
                <Card key={w.id} className="border-zinc-200 shadow-sm overflow-hidden rounded-2xl">
                  <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className="flex items-center gap-2.5 text-lg font-bold text-zinc-900">
                        <UserCircle className="h-6 w-6 text-zinc-400" />
                        Prof. {profName}
                      </CardTitle>
                      <div className="flex items-center flex-wrap gap-2">
                        <Badge variant="outline" className={`font-semibold px-2.5 py-0.5 border ${topicColor}`}>
                          {w.topic}
                        </Badge>
                        <CardDescription className="flex items-center gap-1.5 text-sm font-semibold text-zinc-600 bg-white px-2.5 py-1 rounded-full border border-zinc-200 shadow-sm">
                          <Clock className="h-3.5 w-3.5 text-zinc-400" />
                          {safeFormatTime(w.date, w.start_time)} – {safeFormatTime(w.date, w.end_time)}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {wSlots.map((slot) => {
                        const sTime = safeFormatTime(w.date, slot.start_time);
                        const eTime = safeFormatTime(w.date, slot.end_time);
                        
                        const isOpen = slot.status === "open";
                        const isStudentBooking = slot.status === "booked" && slot.student_id === currentUserId;
                        
                        let baseClasses = "flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 select-none ";
                        
                        if (isOpen) {
                           baseClasses += "border-zinc-200 bg-white hover:border-[#5438dc] hover:shadow-md hover:-translate-y-0.5 cursor-pointer group";
                        } else if (isStudentBooking) {
                           baseClasses += "border-[#5438dc]/30 bg-[#5438dc]/5 text-[#5438dc] cursor-not-allowed";
                        } else {
                           baseClasses += "border-zinc-100 bg-zinc-50 text-zinc-400 cursor-not-allowed opacity-60";
                        }

                        return (
                          <div 
                            key={slot.id} 
                            onClick={() => isOpen && onSlotClick(slot, w)}
                            className={baseClasses}
                          >
                            <div className="flex flex-col gap-1">
                               <div className="flex items-center gap-2">
                                 <Clock className={`h-4 w-4 ${isOpen ? "text-zinc-400 group-hover:text-[#5438dc]" : ""}`} />
                                 <span className="font-bold text-sm tracking-tight">{sTime} <span className="text-xs opacity-50 font-medium px-0.5">–</span> {eTime}</span>
                               </div>
                               <div className="pl-6">
                                 {isOpen && <span className="text-xs font-semibold text-emerald-600">Available</span>}
                                 {isStudentBooking && <span className="text-xs font-bold text-[#5438dc]">Your Booking</span>}
                                 {!isOpen && !isStudentBooking && <span className="text-xs font-medium">Unavailable</span>}
                               </div>
                            </div>
                            
                            {isOpen && (
                               <div className="h-6 w-6 rounded-full bg-zinc-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity group-hover:bg-[#5438dc] text-white">
                                  <ChevronRight className="h-4 w-4" />
                               </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
