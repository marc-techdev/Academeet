"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, UserCircle, Save, Trash2, Edit2, AlertTriangle, X } from "lucide-react";
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
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

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
    setIsCancelling(true);
    const result = await cancelBooking(slot.id);
    if (result.error) {
       toast.error(result.error);
    } else {
       toast.success("Booking cancelled successfully.");
       setIsConfirmingCancel(false);
       onOpenChange(false);
       router.refresh();
    }
    setIsCancelling(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-full p-0 rounded-2xl overflow-hidden border-none text-zinc-900 shadow-2xl">
        
        {isConfirmingCancel ? (
          <div className="flex flex-col bg-red-50/30 w-full relative">
            <div className="p-14 flex flex-col items-center justify-center text-center">
               <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                 <AlertTriangle className="h-10 w-10 text-red-600" />
               </div>
               <h3 className="text-3xl font-extrabold text-red-900 mb-4 tracking-tight">Cancel Appointment?</h3>
               <p className="text-red-700 font-medium text-lg leading-relaxed max-w-lg mx-auto">
                 Are you sure you want to permanently cancel this consultation with Prof. {professorName}?<br/><br/>
                 This action cannot be undone and your slot will be released.
               </p>
            </div>
            
            <div className="p-6 pt-0 flex bg-transparent items-center gap-4 justify-center px-10 pb-10">
              <Button 
                variant="outline" 
                className="flex-1 bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 rounded-xl h-12 font-bold text-base shadow-sm"
                onClick={() => setIsConfirmingCancel(false)}
                disabled={isCancelling}
              >
                Keep Appointment
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 font-bold text-base shadow-sm"
                onClick={handleCancelBooking}
                disabled={isCancelling}
              >
                {isCancelling ? "Cancelling..." : "Yes, Cancel"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col w-full bg-white relative">
            {/* Header Block */}
            <div className="bg-[#5438dc] p-8 pb-10">
              <DialogTitle className="text-white text-2xl font-bold flex items-center gap-3">
                 <CalendarDays className="h-7 w-7 text-indigo-200" />
                 My Consultation Booking
              </DialogTitle>
              <DialogDescription className="text-indigo-100 font-medium mt-2 text-base">
                 Manage your upcoming appointment.
              </DialogDescription>
            </div>

            {/* Body */}
            <div className="bg-white p-8">
               <div className="flex flex-col gap-8">
                  
                  {/* Professor Info */}
                  <div className="flex items-start justify-between border-b border-zinc-100 pb-8">
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
                           <UserCircle className="h-8 w-8 text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500 font-semibold mb-0.5 tracking-wide uppercase">Professor</p>
                          <p className="text-lg font-bold text-zinc-900">Prof. {professorName}</p>
                        </div>
                     </div>
                     <Badge variant="secondary" className="bg-[#5438dc]/10 text-[#5438dc] hover:bg-[#5438dc]/20 mt-1 px-3 py-1 font-semibold border-0 rounded-full tracking-wide">
                       {window.topic}
                     </Badge>
                  </div>

                  {/* Time Info */}
                  <div className="flex items-start gap-4">
                     <div className="bg-zinc-100 p-3 rounded-2xl border border-zinc-200 text-zinc-500">
                       <Clock className="h-6 w-6" />
                     </div>
                     <div className="mt-0.5">
                       <p className="text-xs text-zinc-500 font-semibold mb-0.5 tracking-wide uppercase">Scheduled Time</p>
                       <p className="font-bold text-zinc-900 text-base">
                          {format(new Date(slotDate), "EEEE, MMMM d, yyyy")}
                       </p>
                       <p className="text-sm font-bold text-[#5438dc] mt-0.5">{slotTime}</p>
                     </div>
                  </div>
                  
                  {/* Agenda Group */}
                  <div className="mt-2 border-t border-zinc-100 pt-8">
                     <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-semibold text-zinc-600 tracking-wide">My Agenda</p>
                        {!isEditing && (
                          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-[#5438dc] hover:text-[#5438dc] hover:bg-[#5438dc]/10 font-bold">
                             <Edit2 className="h-3.5 w-3.5 mr-2" />
                             Edit Agenda
                          </Button>
                        )}
                     </div>
                     
                     {isEditing ? (
                        <div className="flex flex-col gap-3">
                           <Textarea 
                             value={agendaForm}
                             onChange={e => setAgendaForm(e.target.value)}
                             className="bg-white border-zinc-300 focus-visible:ring-[#5438dc] min-h-[120px] rounded-xl text-zinc-900 p-4 shadow-sm"
                             placeholder="What do you want to discuss?"
                           />
                           <div className="flex justify-end gap-2 mt-2">
                              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="rounded-xl font-bold px-4 h-9">Cancel</Button>
                              <Button size="sm" onClick={handleSaveAgenda} disabled={isLoading} className="bg-[#5438dc] hover:bg-[#5438dc]/90 text-white rounded-xl font-bold px-4 h-9 shadow-sm">
                                 <Save className="h-4 w-4 mr-2" />
                                 {isLoading ? "Saving..." : "Save Changes"}
                              </Button>
                           </div>
                        </div>
                     ) : (
                        <div className="bg-zinc-50 text-zinc-800 text-base p-5 rounded-xl border border-zinc-200 min-h-[120px] shadow-sm whitespace-pre-wrap">
                           {slot.agenda ? slot.agenda : <span className="text-zinc-400 italic">No agenda provided.</span>}
                        </div>
                     )}
                  </div>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="px-8 pb-8 pt-0 flex justify-between items-center bg-white rounded-b-2xl">
                <Button 
                   variant="outline" 
                   className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold px-5 py-2 h-10 rounded-xl bg-white shadow-sm"
                   onClick={() => setIsConfirmingCancel(true)}
                   disabled={isCancelling}
                >
                   <Trash2 className="h-4 w-4 mr-2" />
                   Cancel Appointment
                </Button>
                
                <Button variant="ghost" className="font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl px-5 h-10" onClick={() => onOpenChange(false)}>
                   Close
                </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
