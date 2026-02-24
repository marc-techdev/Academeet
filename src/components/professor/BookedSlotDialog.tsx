"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Clock,
  User as UserIcon,
  FileText,
  Hash,
  CalendarCheck,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { cancelConsultationBooking } from "@/app/professor/dashboard/actions";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Shape of a booked slot passed from the server component. */
export interface BookedSlotInfo {
  id: string;
  start_time: string;
  end_time: string;
  agenda: string | null;
  studentName: string;
  studentIdNumber: string;
}

/**
 * Interactive booked-slot tile. When clicked, opens a dialog with
 * the student's name, university ID, and their consultation agenda.
 */
export function BookedSlotDialog({ slot, className, customTrigger }: { slot: BookedSlotInfo; className?: string; customTrigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CANCEL_REASONS = [
    "Class Conflict",
    "Sick Leave",
    "Official Business / Outside School",
    "Other"
  ];
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");

  const handleCancel = async () => {
    const finalReason = cancelReason === "Other" ? otherReason : cancelReason;
    if (!finalReason.trim()) {
      setError("Please provide a cancellation reason.");
      return;
    }

    setIsCancelling(true);
    setError(null);
    try {
      const result = await cancelConsultationBooking(slot.id, finalReason);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? (
          <button type="button" className={className || ""}>
            {customTrigger}
          </button>
        ) : (
          <button
            type="button"
            className={className || "w-full cursor-pointer rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-left transition-all hover:border-blue-300 hover:bg-blue-100/60 hover:shadow-sm active:scale-[0.99] dark:border-blue-800/60 dark:bg-blue-950/20 dark:hover:border-blue-700 dark:hover:bg-blue-900/30"}
          >
            {/* Time row + badge */}
            <div className="flex items-center justify-between">
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
              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Booked
              </span>
            </div>

            {/* Quick preview */}
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserIcon className="h-3 w-3" />
              <span className="truncate">{slot.studentName}</span>
            </div>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-blue-600" />
            Booked Appointment
          </DialogTitle>
          <DialogDescription>
            {format(parseISO(slot.start_time), "h:mm a")} –{" "}
            {format(parseISO(slot.end_time), "h:mm a")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Student Info */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Student Details
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-blue-500" />
                <span className="font-medium">{slot.studentName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Hash className="h-4 w-4 text-blue-400" />
                <span className="text-muted-foreground">
                  {slot.studentIdNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Agenda */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
            <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              Consultation Agenda
            </h4>
            <p className="text-sm leading-relaxed text-foreground">
              {slot.agenda || "No agenda provided."}
            </p>
          </div>
          {/* Cancel Actions */}
          <div className="pt-4 border-t border-zinc-100 flex flex-col gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-800 mb-2 block">Reason for Cancellation</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCancelReason(r)}
                    className={`text-left px-3 py-2 border rounded-lg text-xs font-medium transition-all ${cancelReason === r ? "border-blue-500 bg-blue-50 text-blue-700" : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {cancelReason === "Other" && (
                <input
                  type="text"
                  placeholder="Please specify your reason..."
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}
            <p className="text-[11px] text-zinc-500 leading-tight text-center">
              Cancelling this appointment will free up the slot for others. Your selected reason will be recorded on the agenda.
            </p>
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Confirm & Cancel Appointment"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
