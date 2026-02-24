"use client";

import { useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { CalendarIcon, Loader2, Plus, Calendar, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import {
  createConsultationWindow,
  type CreateWindowResult,
} from "@/app/professor/dashboard/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as ShadcnCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTimePresets } from "@/hooks/useTimePresets";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// ── Zod schema (client-side mirror) ─────────────────────────

const windowFormSchema = z
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

type WindowFormValues = z.infer<typeof windowFormSchema>;

const TOPIC_PRESETS = ["General", "Thesis", "Practicum", "Capstone", "Other"];

// ── Component ───────────────────────────────────────────────

/**
 * Client-side form for professors to create a new consultation window.
 * Submits via the `createConsultationWindow` Server Action.
 */
export function CreateWindowForm() {
  const [state, formAction, isPending] = useActionState<
    CreateWindowResult,
    FormData
  >(createConsultationWindow, {});

  const form = useForm<WindowFormValues>({
    resolver: zodResolver(windowFormSchema),
    defaultValues: { date: "", start_time: "", end_time: "", duration: 30, topic: "General" },
  });

  const selectedTopicPreset = form.watch("topic");
  const isCustomTopic = !TOPIC_PRESETS.slice(0, 4).includes(selectedTopicPreset);

  const { presets, addPreset, removePreset } = useTimePresets();

  const prevStateRef = useRef(state);

  // Show toast on success or error
  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;

    if (state.success) {
      toast.success(
        `Window created with ${state.slotsCreated} slot${state.slotsCreated !== 1 ? "s" : ""}.`
      );
      form.reset();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, form]);

  return (
    <Card className="border-zinc-200/60 shadow-sm dark:border-zinc-800/60">
      <CardHeader>
        <CardTitle className="text-lg">Post Consultation Window</CardTitle>
        <CardDescription>
          Set a date and time range, and choose how long you'd like each generated consultation slot to be.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end flex-wrap w-full">
              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[140px]">
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start time */}
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[120px]">
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* End time */}
              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem className="flex-1 min-w-[120px]">
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Quick Time Presets */}
              <div className="w-full flex items-center gap-2 mt-1 mb-1">
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

              {/* Consultation Topic */}
              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem className="w-full">
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
                                ? "bg-cyan-600 border-cyan-600 text-white"
                                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                              : field.value === preset
                              ? "bg-cyan-600 border-cyan-600 text-white"
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
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className="mt-2"
                        />
                      </FormControl>
                    )}
                    {/* Always render a standard hidden input so FormData works flawlessly */}
                    <input type="hidden" name="topic" value={field.value} />
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Duration Buttons (Hidden Input behind the scenes) */}
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => {
                  return (
                    <FormItem className="w-full sm:w-auto mt-2 sm:mt-0">
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
                      {/* We keep a hidden input so FormData works cleanly in server actions */}
                      <input type="hidden" name="duration" value={field.value} />
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {/* Submit */}
              <Button
                type="submit"
                disabled={isPending}
                className="cursor-pointer bg-linear-to-r from-blue-600 to-indigo-600 font-medium text-white shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:shadow-blue-600/30 w-full sm:w-auto h-11 px-6 rounded-xl shrink-0"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Window
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
