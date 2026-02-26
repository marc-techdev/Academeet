"use client";

import { useState } from "react";
import { AlertTriangle, Trash2, CalendarX, Loader2 } from "lucide-react";
import { clearUpcomingConsultations } from "@/app/professor/dashboard/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const CANCEL_REASONS = [
  "Class Conflict",
  "Sick Leave",
  "Official Business / Outside School",
  "Other"
];

export function ClearUpcomingSlotsButton({ slotIds, emptyWindowIds = [] }: { slotIds: string[], emptyWindowIds?: string[] }) {
  const [open, setOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [otherReason, setOtherReason] = useState("");

  const handleClearAll = async () => {
    const finalReason = cancelReason === "Other" ? otherReason : cancelReason;
    if (!finalReason.trim()) {
      setError("Please provide a reason for cancelling these appointments.");
      return;
    }

    setIsClearing(true);
    setError(null);

    try {
      const result = await clearUpcomingConsultations(slotIds, finalReason, emptyWindowIds);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false); // Close modal on success
      }
    } catch (err) {
      setError("An unexpected error occurred while clearing the schedule.");
    } finally {
      setIsClearing(false);
    }
  };

  if ((!slotIds || slotIds.length === 0) && (!emptyWindowIds || emptyWindowIds.length === 0)) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 bg-white border border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all shadow-sm group"
          title="Clear all upcoming appointments"
        >
          <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Clear All</span>
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md sm:max-w-lg overflow-hidden border-orange-200">
        <DialogHeader className="bg-orange-50/50 -mx-6 -mt-6 p-6 border-b border-orange-100 pb-5">
          <div className="mx-auto w-12 h-12 bg-white border border-orange-200 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <CalendarX className="h-6 w-6 text-orange-500" />
          </div>
          <DialogTitle className="text-center text-xl text-orange-800">
            Clear Upcoming Appointments
          </DialogTitle>
          <DialogDescription className="text-center mt-2 text-orange-700/80">
            You are about to cancel {" "}
            <strong className="text-orange-900">{slotIds.length > 0 ? slotIds.length : emptyWindowIds.length}</strong> upcoming 
            time slot(s)/window(s). Open slots will be permanently deleted, and any booked appointments will be marked as cancelled, notifying the students.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-5 -mx-6 bg-white space-y-4">
          <div>
            <label className="text-sm font-semibold text-zinc-800 mb-3 block">Reason for Cancellation</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              {CANCEL_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setCancelReason(r)}
                  className={`text-left px-3 py-2.5 border rounded-lg text-xs font-medium transition-all ${
                    cancelReason === r 
                      ? "border-orange-500 bg-orange-50 text-orange-700 shadow-sm" 
                      : "border-zinc-200 text-zinc-600 hover:border-orange-300 hover:bg-orange-50/30"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            
            {cancelReason === "Other" && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <input
                  type="text"
                  placeholder="Please specify your reason for cancelling..."
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  className="w-full text-sm border border-zinc-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 bg-white shadow-sm"
                  autoFocus
                />
              </div>
            )}
          </div>

          {error && (
            <div className="flex gap-3 bg-red-50 text-red-600 p-3 rounded-lg border border-red-100 items-start shadow-sm mt-4">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="text-sm leading-tight text-red-700/90">{error}</p>
            </div>
          )}

          <button
            onClick={handleClearAll}
            disabled={isClearing}
            className="w-full items-center justify-center flex gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow shadow-orange-600/20 font-semibold py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isClearing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelling Appointments...
              </>
            ) : (
              `Confirm & Cancel ${slotIds.length > 0 ? slotIds.length : emptyWindowIds.length} Appointment${(slotIds.length > 0 ? slotIds.length : emptyWindowIds.length) !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
