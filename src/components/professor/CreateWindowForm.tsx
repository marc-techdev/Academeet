"use client";

import { useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  createConsultationWindow,
  type CreateWindowResult,
} from "@/app/professor/dashboard/actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  })
  .refine((d) => d.end_time > d.start_time, {
    message: "End time must be after start time.",
    path: ["end_time"],
  });

type WindowFormValues = z.infer<typeof windowFormSchema>;

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
    defaultValues: { date: "", start_time: "", end_time: "" },
  });

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
          Set a date and time range — 30-minute slots will be generated
          automatically within this window.      </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex-1">
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
                <FormItem className="flex-1">
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
                <FormItem className="flex-1">
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="cursor-pointer bg-linear-to-r from-blue-600 to-indigo-600 font-medium text-white shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:shadow-blue-600/30 hover:brightness-110"
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
