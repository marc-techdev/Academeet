"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, UserCircle, Save, Trash2, Edit2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { updateBookingAgenda, cancelBooking } from "@/app/student/dashboard/actions";

import type { SlotData, WindowData } from "./StudentDashboardLayout";

interface StudentManageBookingDialogProps {
  slot: SlotData;
  window: WindowData;
  professorName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function safeFormatTime(dateStr: string, timeStr: string) {
  if (!timeStr) return "Unknown";
  try {
    const d = parseISO(`${dateStr}T${timeStr.trim()}`);
    if (isNaN(d.getTime())) {
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

export function StudentManageBookingDialog({
  slot,
  window,
  professorName,
  open,
  onOpenChange
}: StudentManageBookingDialogProps) {
  const router = useRouter();
  
  const [isEditing, setIsEditing] = useState(false);
  const [agendaForm, setAgendaForm] = useState(slot.agenda ?? "");
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Derive time visually
  const slotTime = `${safeFormatTime(window.date, slot.start_time)} – ${safeFormatTime(window.date, slot.end_time)}`;
  const slotDate = window.date;

  const handleSaveAgenda = async () => {
    setIsLoading(true);
    const result = await updateBookingAgenda(slot.id, agendaForm);
    if (result.error) {
       toast.error(result.error);
    } else {
       toast.success("Agenda updated successfully!");
       setIsEditing(false);
       router.refresh();
    }
    setIsLoading(false);
  };

  const handleCancelBooking = async () => {
    if (!globalThis.confirm("Are you sure you want to cancel this booking? This action cannot be undone and you will lose this time slot.")) return;
    
    setIsCancelling(true);
    const result = await cancelBooking(slot.id);
    if (result.error) {
       toast.error(result.error);
    } else {
       toast.success("Booking cancelled successfully.");
       onOpenChange(false);
       router.refresh();
    }
    setIsCancelling(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 rounded-2xl overflow-hidden border-none text-zinc-900">
        
        {/* Header Block */}
        <div className="bg-[#5438dc] p-6 pb-20 relative">
          <DialogTitle className="text-white text-xl font-bold flex items-center gap-3">
             <CalendarDays className="h-6 w-6 text-indigo-200" />
             My Consultation Booking
          </DialogTitle>
          <DialogDescription className="text-indigo-100 font-medium mt-1">
             Manage your upcoming appointment.
          </DialogDescription>
        </div>

        {/* Floating Details Card */}
        <div className="bg-white mx-6 -mt-12 rounded-xl border border-zinc-100 shadow-md p-5 pb-6 mb-6">
           <div className="flex flex-col gap-4">
              
              <div className="flex items-center justify-between border-b border-zinc-50 pb-4">
                 <div className="flex items-center gap-3">
                    <UserCircle className="h-10 w-10 text-zinc-300" />
                    <div>
                      <p className="text-sm text-zinc-500 font-semibold mb-0.5">Professor</p>
                      <p className="text-base font-bold text-zinc-900">Prof. {professorName}</p>
                    </div>
                 </div>
                 <Badge variant="secondary" className="bg-[#5438dc]/10 text-[#5438dc] hover:bg-[#5438dc]/20">
                   {window.topic}
                 </Badge>
              </div>

              <div className="flex items-center gap-3 pt-2">
                 <div className="bg-zinc-100 p-2 rounded-lg text-zinc-500">
                   <Clock className="h-5 w-5" />
                 </div>
                 <div>
                   <p className="text-sm font-semibold text-zinc-500">Scheduled Time</p>
                   <p className="font-bold text-zinc-800">
                      {format(new Date(slotDate), "EEEE, MMMM d, yyyy")}
                   </p>
                   <p className="text-sm font-bold text-[#5438dc]">{slotTime}</p>
                 </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-zinc-100">
                 <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-zinc-500">My Agenda</p>
                    {!isEditing && (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-[#5438dc] hover:text-[#5438dc] hover:bg-[#5438dc]/10">
                         <Edit2 className="h-4 w-4 mr-2" />
                         Edit Agenda
                      </Button>
                    )}
                 </div>
                 
                 {isEditing ? (
                    <div className="flex flex-col gap-3">
                       <Textarea 
                         value={agendaForm}
                         onChange={e => setAgendaForm(e.target.value)}
                         className="bg-zinc-50 border-zinc-200 focus-visible:ring-[#5438dc] min-h-[100px]"
                         placeholder="What do you want to discuss?"
                       />
                       <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>Cancel</Button>
                          <Button size="sm" onClick={handleSaveAgenda} disabled={isLoading} className="bg-[#5438dc] hover:bg-[#5438dc]/90 text-white">
                             <Save className="h-4 w-4 mr-2" />
                             {isLoading ? "Saving..." : "Save Changes"}
                          </Button>
                       </div>
                    </div>
                 ) : (
                    <div className="bg-zinc-50 text-zinc-700 text-sm p-4 rounded-lg font-medium border border-zinc-100 min-h-[80px]">
                       {slot.agenda ? slot.agenda : <span className="text-zinc-400 italic">No agenda provided.</span>}
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 pb-6 flex justify-between items-center">
            <Button 
               variant="outline" 
               className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
               onClick={handleCancelBooking}
               disabled={isCancelling}
            >
               <Trash2 className="h-4 w-4 mr-2" />
               {isCancelling ? "Cancelling..." : "Cancel Appointment"}
            </Button>
            
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
               Close
            </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
