"use client";

import { useState, useEffect } from "react";
import { Bell, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { SlotData } from "./StudentDashboardLayout";

interface StudentNotificationBellProps {
  slots: SlotData[];
  currentUserId: string;
}

export function StudentNotificationBell({ slots, currentUserId }: StudentNotificationBellProps) {
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load dismissed notifications from local storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`academeet_dismissed_notifications_${currentUserId}`);
      if (stored) {
        setTimeout(() => {
          setDismissedIds(JSON.parse(stored));
        }, 0);
      }
    } catch (e) {
      console.error("Failed to parse dismissed notifications", e);
    }
  }, [currentUserId]);

  const handleDismiss = (slotId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newDismissed = [...dismissedIds, slotId];
    setDismissedIds(newDismissed);
    localStorage.setItem(`academeet_dismissed_notifications_${currentUserId}`, JSON.stringify(newDismissed));
  };

  const markAllAsRead = () => {
    const newDismissed = [...new Set([...dismissedIds, ...cancelledSlots.map(s => s.id)])];
    setDismissedIds(newDismissed);
    localStorage.setItem(`academeet_dismissed_notifications_${currentUserId}`, JSON.stringify(newDismissed));
  };

  // Filter slots to only show those that were cancelled AND belonged to this student
  // We assume that the server action updates `status` to 'cancelled' but retains the `student_id`.
  // Note: if `student_id` is cleared upon cancellation by the professor, this won't work perfectly.
  // Our recent change in `actions.ts` preserved the `student_id`.
  const cancelledSlots = slots.filter(
    (s) => s.status === "cancelled" && s.student_id === currentUserId
  );

  const unreadSlots = cancelledSlots.filter(s => !dismissedIds.includes(s.id));
  const hasUnread = unreadSlots.length > 0;

  // Render a clean notification item
  const renderNotification = (slot: SlotData) => {
    const isUnread = !dismissedIds.includes(slot.id);
    
    // Extract reason from injected agenda
    // Format was: [CANCELLED by Professor]\nReason: {reason}\n\n[Original]: {oldAgenda}
    let reason = "No specific reason provided.";
    let originalTopic = "General Consultation";
    
    if (slot.agenda) {
      const reasonMatch = slot.agenda.match(/Reason:\s*(.*?)(?=\n\n\[Original\]|$)/);
      if (reasonMatch && reasonMatch[1]) {
        reason = reasonMatch[1].trim();
      }
      
      const topicMatch = slot.agenda.match(/\[Original\]:\s*([\s\S]*)/);
      if (topicMatch && topicMatch[1]) {
        originalTopic = topicMatch[1].trim().substring(0, 50) + (topicMatch[1].length > 50 ? "..." : "");
      }
    }

    // Try to safely parse the start time
    let timeStr = slot.start_time;
    try {
      if (timeStr.includes("T")) {
        timeStr = format(new Date(timeStr), "MMM d, h:mm a");
      }
    } catch (e) {}

    return (
      <div 
        key={slot.id} 
        className={`relative flex flex-col gap-2 p-3 rounded-xl border transition-all ${
          isUnread 
            ? "bg-red-50/50 border-red-100/50 hover:bg-red-50" 
            : "bg-zinc-50 border-zinc-100 opacity-70 hover:opacity-100"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`h-4 w-4 shrink-0 ${isUnread ? "text-red-500" : "text-zinc-400"}`} />
            <span className={`text-sm font-bold ${isUnread ? "text-red-900" : "text-zinc-700"}`}>
              Appointment Cancelled
            </span>
          </div>
          {isUnread && (
            <button 
              onClick={(e) => handleDismiss(slot.id, e)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200/50 transition-colors"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <div className="text-xs text-zinc-600 pl-6 leading-relaxed">
          Your appointment on <span className="font-semibold">{timeStr}</span> was cancelled.
          <div className="mt-1.5 p-2 bg-white rounded-lg border border-zinc-100 shadow-sm text-zinc-700 italic">
            &quot;{reason}&quot;
          </div>
        </div>
      </div>
    );
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative h-10 w-10 border-zinc-200 text-zinc-500 hover:text-[#5438dc] hover:border-[#5438dc] rounded-full shadow-sm bg-white"
        >
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-0 right-0 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-white"></span>
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 md:w-96 p-0 rounded-2xl shadow-xl border-zinc-200" align="end" sideOffset={8}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-zinc-900">Notifications</h3>
            {hasUnread && (
              <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {unreadSlots.length} new
              </span>
            )}
          </div>
          {hasUnread && (
            <button 
              onClick={markAllAsRead}
              className="text-xs font-semibold text-[#5438dc] hover:text-indigo-700 flex items-center gap-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>
        
        <div className="p-3 max-h-[400px] overflow-y-auto flex flex-col gap-2 bg-zinc-50/50 rounded-b-2xl">
          {cancelledSlots.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center mb-2">
                <Bell className="h-5 w-5 text-zinc-300" />
              </div>
              <p className="text-sm font-medium text-zinc-500">You're all caught up!</p>
              <p className="text-xs text-zinc-400">No cancelled appointments.</p>
            </div>
          ) : (
            <>
              {/* Show unread first, then read */}
              {unreadSlots.map(renderNotification)}
              {cancelledSlots.filter(s => dismissedIds.includes(s.id)).map(renderNotification)}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
