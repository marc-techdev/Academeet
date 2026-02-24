"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Loader2, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { bookSlot, type BookSlotResult } from "@/app/student/dashboard/actions";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ── Zod schema (client mirror) ──────────────────────────────

const agendaSchema = z.object({
  agenda: z
    .string()
    .min(10, "Please write at least 10 characters describing your topic."),
});

type AgendaFormValues = z.infer<typeof agendaSchema>;

// ── Props ───────────────────────────────────────────────────

interface BookingDialogProps {
  slotId: string;
  slotTime: string;          // human-readable label, e.g. "9:00 AM – 9:15 AM"
  professorName: string;
  topic: string;             // Topic Context
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Dialog for students to enter their consultation agenda before booking.
 * Uses the `bookSlot` Server Action via `useActionState`.
 */
export function BookingDialog({
  slotId,
  slotTime,
  professorName,
  topic,
  open,
  onOpenChange,
}: BookingDialogProps) {
  const [state, formAction, isPending] = useActionState<
    BookSlotResult,
    FormData
  >(bookSlot, {});

  const router = useRouter();

  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(agendaSchema),
    defaultValues: { agenda: "" },
  });

  const prevStateRef = useRef(state);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;

    if (state.success) {
      toast.success("Slot reserved successfully!");
      router.refresh();
      form.reset();
      onOpenChange(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, form, onOpenChange, router]);

  // Reset form when dialog closes
  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl tracking-tight">
            <div className="p-2 bg-[#ff5757]/10 dark:bg-[#ff5757]/20 rounded-md">
                <CalendarCheck className="h-5 w-5 text-[#ff5757]" />
            </div>
            Reserve Slot
          </DialogTitle>
          <DialogDescription className="flex flex-col gap-2 mt-1">
            <span>
              <span className="font-medium text-zinc-900 dark:text-white">{slotTime}</span>
              {" with "}
              <span className="font-medium text-zinc-900 dark:text-white">
                Prof. {professorName}
              </span>
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span>Topic:</span>
              <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 font-semibold px-2.5 py-1 shadow-sm pointer-events-none">
                {topic}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form action={formAction} className="space-y-4">
            {/* Hidden slot_id */}
            <input type="hidden" name="slot_id" value={slotId} />

            {/* Agenda textarea */}
            <FormField
              control={form.control}
              name="agenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pre-Consultation Agenda</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your thesis topic, technical issue, or question. Be specific so the professor can prepare…"
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="cursor-pointer bg-linear-to-r from-emerald-600 to-teal-600 font-medium text-white shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:shadow-emerald-600/30 hover:brightness-110"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking…
                  </>
                ) : (
                  "Confirm Booking"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
