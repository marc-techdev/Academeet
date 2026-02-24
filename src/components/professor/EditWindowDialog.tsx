"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Edit2, Loader2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

import { editConsultationWindow } from "@/app/professor/dashboard/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const windowSchema = z
  .object({
    date: z.string().min(1, "Date is required."),
    start_time: z.string().min(1, "Start time is required."),
    end_time: z.string().min(1, "End time is required."),
  })
  .refine((d) => d.end_time > d.start_time, {
    message: "End time must be after start time.",
    path: ["end_time"],
  });

type EditWindowFormValues = z.infer<typeof windowSchema>;

export interface EditWindowDialogProps {
  windowId: string;
  initialDate: string; // YYYY-MM-DD
  initialStartTime: string; // HH:mm:ss
  initialEndTime: string; // HH:mm:ss
  hasBookedSlots: boolean;
}

export function EditWindowDialog({
  windowId,
  initialDate,
  initialStartTime,
  initialEndTime,
  hasBookedSlots,
}: EditWindowDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditWindowFormValues>({
    resolver: zodResolver(windowSchema),
    defaultValues: {
      date: initialDate,
      start_time: initialStartTime.slice(0, 5),
      end_time: initialEndTime.slice(0, 5),
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        date: initialDate,
        start_time: initialStartTime.slice(0, 5),
        end_time: initialEndTime.slice(0, 5),
      });
    }
  }, [open, initialDate, initialStartTime, initialEndTime, form]);

  function onSubmit(values: EditWindowFormValues) {
    if (hasBookedSlots) return; // Guard

    startTransition(async () => {
      // Create FormData to mimic server action invocation
      const formData = new FormData();
      formData.append("date", values.date);
      formData.append("start_time", values.start_time);
      formData.append("end_time", values.end_time);

      const result = await editConsultationWindow(windowId, {}, formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Window updated. ${result.slotsCreated} new slots generated.`);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30"
          title={hasBookedSlots ? "Cannot edit window with booked slots" : "Edit window"}
          disabled={hasBookedSlots} // Disable trigger if there are booked slots
        >
          <Edit2 className="h-4 w-4" />
          <span className="sr-only">Edit window</span>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Edit Consultation Window
          </DialogTitle>
          <DialogDescription>
            Modify the date or time frame. This will delete all unbooked slots and
            regenerate new 15-minute intervals.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
