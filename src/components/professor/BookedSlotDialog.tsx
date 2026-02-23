"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Clock,
  User as UserIcon,
  FileText,
  Hash,
  CalendarCheck,
} from "lucide-react";

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
export function BookedSlotDialog({ slot }: { slot: BookedSlotInfo }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="w-full cursor-pointer rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 text-left transition-all hover:border-blue-300 hover:bg-blue-100/60 hover:shadow-sm active:scale-[0.99] dark:border-blue-800/60 dark:bg-blue-950/20 dark:hover:border-blue-700 dark:hover:bg-blue-900/30"
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
