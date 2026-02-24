"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Edit2, Loader2, CalendarDays, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTimePresets } from "@/hooks/useTimePresets";

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
    duration: z.number().min(10).max(60),
    topic: z.string().min(1, "Topic is required."),
  })
  .refine((d) => d.end_time > d.start_time, {
    message: "End time must be after start time.",
    path: ["end_time"],
  });

type EditWindowFormValues = z.infer<typeof windowSchema>;

const TOPIC_PRESETS = ["General", "Thesis", "Practicum", "Capstone", "Other"];

export interface EditWindowDialogProps {
  windowId: string;
  initialDate: string; // YYYY-MM-DD
  initialStartTime: string; // HH:mm:ss
  initialEndTime: string; // HH:mm:ss
  initialTopic: string;
  hasBookedSlots: boolean;
  customTrigger?: React.ReactNode;
}

export function EditWindowDialog({
  windowId,
  initialDate,
  initialStartTime,
  initialEndTime,
  initialTopic,
  hasBookedSlots,
  customTrigger,
}: EditWindowDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<EditWindowFormValues>({
    resolver: zodResolver(windowSchema),
    defaultValues: {
      date: initialDate,
      start_time: initialStartTime.slice(0, 5),
      end_time: initialEndTime.slice(0, 5),
      duration: 30,
      topic: initialTopic,
    },
  });

  const selectedTopicPreset = form.watch("topic");
  const isCustomTopic = !TOPIC_PRESETS.slice(0, 4).includes(selectedTopicPreset);

  const { presets, addPreset, removePreset } = useTimePresets();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        date: initialDate,
        start_time: initialStartTime.slice(0, 5),
        end_time: initialEndTime.slice(0, 5),
        duration: 30,
        topic: initialTopic,
      });
    }
  }, [open, initialDate, initialStartTime, initialEndTime, initialTopic, form]);

  function onSubmit(values: EditWindowFormValues) {
    if (hasBookedSlots) return; // Guard

    startTransition(async () => {
      // Create FormData to mimic server action invocation
      const formData = new FormData();
      formData.append("date", values.date);
      formData.append("start_time", values.start_time);
      formData.append("end_time", values.end_time);
      formData.append("duration", values.duration.toString());
      formData.append("topic", values.topic);

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
        {customTrigger ? (
          <div className="inline-block" title={hasBookedSlots ? "Cannot edit window with booked slots" : "Edit window"}>
            {/* Wrapper is useful here so we can pass title/tooltip and handle the disabled UI if needed, though customizing trigger directly is often better. We'll clone element if needed or just render customTrigger directly if asChild is used carefully */}
            {customTrigger}
          </div>
        ) : (
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
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Edit Consultation Window
          </DialogTitle>
          <DialogDescription>
            Note: Editing the window will clear any unbooked slots and 
            regenerate new internals based on your selected duration.
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

            {/* Quick Time Presets */}
            <div className="flex items-center gap-2 -mt-1 mb-1">
              <span className="text-xs text-zinc-500 font-medium whitespace-nowrap">Quick Select:</span>
              <div className="flex flex-wrap gap-2 items-center">
                {presets.map((preset) => (
                  <div key={preset.label} className="group relative">
                    <button
                      type="button"
                      onClick={() => {
                        form.setValue("start_time", preset.start);
                        form.setValue("end_time", preset.end);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100 hover:border-cyan-300 transition-colors pr-6"
                    >
                      {preset.label}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => removePreset(preset.label)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 text-cyan-400 hover:text-cyan-700 hover:bg-cyan-200 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove preset"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                  <button
                    type="button"
                    onClick={() => {
                      const start = form.getValues("start_time");
                      const end = form.getValues("end_time");
                      if (start && end) {
                        addPreset(start, end);
                        toast.success("Time preset saved.");
                      } else {
                        toast.error("Enter start and end times to save a preset.");
                      }
                    }}
                    className="px-2 py-1 flex items-center gap-1 text-[11px] font-semibold rounded-md border border-dashed border-zinc-300 bg-zinc-50 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 hover:border-zinc-400 transition-colors"
                    title="Save current time as a preset"
                  >
                    <Plus className="w-3 h-3" /> Save
                  </button>
              </div>
            </div>

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => {
                return (
                  <FormItem className="w-full mt-2">
                    <FormLabel>Duration per slot</FormLabel>
                    <FormControl>
                      <div className="flex bg-zinc-100 p-1 rounded-xl w-fit">
                        {[10, 15, 20, 30].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => field.onChange(mins)}
                            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
                              field.value === mins
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-zinc-200"
                                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                            }`}
                          >
                            {mins}m
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Consultation Topic */}
            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem className="w-full mt-2">
                  <FormLabel>Consultation Topic</FormLabel>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {TOPIC_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          if (preset === "Other") {
                            field.onChange(""); // Clear it so they can type
                          } else {
                            field.onChange(preset);
                          }
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                          preset === "Other"
                            ? isCustomTopic
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                            : field.value === preset
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                  {isCustomTopic && (
                    <FormControl>
                      <Input
                        placeholder="Specify custom topic..."
                        {...field}
                        className="mt-2"
                      />
                    </FormControl>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />


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
