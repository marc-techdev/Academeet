"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Search, Calendar, Clock as ClockIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { SlotStatus } from "@/types/database";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-zinc-200 shadow-sm text-sm font-medium text-zinc-600 mr-auto" title="Current Time">
      <ClockIcon className="w-4 h-4 text-zinc-400" />
      {format(time, "h:mm:ss a")}
    </div>
  );
}

interface NotificationSlot {
  id: string;
  start_time: string;
  end_time: string;
  status: SlotStatus;
  agenda: string | null;
  date: string;
  student: { full_name: string; id_number: string } | null;
}

export function ProfessorHeaderActions({ bookedSlots }: { bookedSlots: NotificationSlot[] }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-row-reverse sm:flex-row items-center gap-3 relative" ref={dropdownRef}>
      <LiveClock />
      
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative h-10 w-10 shrink-0 bg-white rounded-full shadow-sm border border-zinc-100 flex items-center justify-center text-zinc-500 hover:text-zinc-900 transition-colors" 
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {bookedSlots.length > 0 && (
           <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff5757] text-[10px] font-bold text-white ring-2 ring-white">
             {bookedSlots.length}
           </span>
         )}
      </button>
      
      {/* Search Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-zinc-400" />
        <input 
          type="text" 
          placeholder="Search bookings..." 
          className="h-10 pl-9 pr-4 rounded-full border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5757]/20 w-48 lg:w-64 transition-all bg-white text-zinc-900 placeholder:text-zinc-400"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get("search")?.toString() || ""}
        />
      </div>

      {/* Notification Dropdown */}
      {showDropdown && (
        <div className="absolute right-12 top-12 mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-black/5 border border-zinc-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900">Notifications</h3>
            <span className="text-xs font-semibold bg-zinc-100 text-zinc-500 px-2.5 py-1 rounded-full">{bookedSlots.length} New</span>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-2">
            {bookedSlots.length === 0 ? (
              <div className="py-8 text-center text-sm text-zinc-500">
                You have no new bookings.
              </div>
            ) : (
              <div className="space-y-1 relative">
                {bookedSlots.map((slot) => {
                  const dateStr = format(parseISO(slot.start_time), "MMM d, yyyy");
                  const timeStr = format(parseISO(slot.start_time), "h:mm a");
                  return (
                    <div key={slot.id} className="p-3 rounded-xl hover:bg-zinc-50 transition-colors flex gap-4 items-start cursor-pointer border border-transparent hover:border-zinc-100">
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-full mt-0.5">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-zinc-900 leading-snug">
                          <span className="font-bold">{slot.student?.full_name || "A student"}</span> booked an appointment.
                        </p>
                        <p className="text-xs text-zinc-500 mt-1 capitalize">{slot.agenda || "General Consultation"}</p>
                        <p className="text-xs text-zinc-400 mt-2 font-medium">{dateStr} at {timeStr}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="p-3 bg-zinc-50 border-t border-zinc-100 text-center">
            <button className="text-xs font-bold text-[#ff5757] hover:text-[#ff4242]" onClick={() => setShowDropdown(false)}>Dismiss Overview</button>
          </div>
        </div>
      )}
    </div>
  );
}
