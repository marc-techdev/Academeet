"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Loader2, GraduationCap, BookOpen } from "lucide-react";

import { signUpUser, type SignUpResult } from "./actions";

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

// ── Zod schema (student only — no role selector) ────────────

const signUpFormSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  id_number: z.string().min(1, "University ID number is required."),
  email: z.email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

/**
 * Student Sign-Up Page — only students can register here.
 * Professor registration is on a separate, protected route.
 */
export default function StudentSignUpPage() {
  const [state, formAction, isPending] = useActionState<SignUpResult, FormData>(
    signUpUser,
    { error: undefined }
  );

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpFormSchema),
    defaultValues: {
      full_name: "",
      id_number: "",
      email: "",
      password: "",
    },
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Left Side (Brand & Visuals) ── */}
      <div className="hidden flex-col justify-center bg-emerald-600 p-12 text-white lg:flex relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-500/30 blur-3xl" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-md text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Join Academeet
          </h1>
          <p className="mb-12 text-lg text-emerald-100">
            Book <span className="underline decoration-emerald-300 underline-offset-4 font-semibold">consultations</span> with your professors seamlessly
          </p>

          {/* Aesthetic illustration placeholder */}
          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl bg-emerald-500/30 backdrop-blur-sm border border-emerald-400/20 shadow-2xl">
              <BookOpen className="h-24 w-24 text-emerald-50 opacity-90" />
          </div>
        </div>
      </div>

      {/* ── Right Side (Form Area) ── */}
      <div className="flex flex-col justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950 sm:px-12 lg:px-24 xl:px-32 relative">
        <div className="absolute top-8 left-8 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-emerald-600" />
            <span className="text-xl font-bold tracking-tight text-emerald-900 dark:text-emerald-200">Academeet</span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-emerald-700 dark:text-emerald-500">
              Student Sign Up
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
              Create your account to get started
            </p>
          </div>

          {state.error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              {state.error}
            </div>
          )}

          <Form {...form}>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="role" value="student" />

              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Full Name
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan Dela Cruz"
                        autoComplete="name"
                        className="bg-transparent border-dashed border-2 border-zinc-300 focus-visible:border-emerald-500 focus-visible:ring-0 dark:border-zinc-700 dark:focus-visible:border-emerald-500 shadow-none px-4 py-5 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="id_number"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      University ID Number
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="2021-00123"
                        className="bg-transparent border-dashed border-2 border-zinc-300 focus-visible:border-emerald-500 focus-visible:ring-0 dark:border-zinc-700 dark:focus-visible:border-emerald-500 shadow-none px-4 py-5 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@university.edu"
                        autoComplete="email"
                        className="bg-transparent border-dashed border-2 border-zinc-300 focus-visible:border-emerald-500 focus-visible:ring-0 dark:border-zinc-700 dark:focus-visible:border-emerald-500 shadow-none px-4 py-5 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="new-password"
                        className="bg-transparent border-dashed border-2 border-zinc-300 focus-visible:border-emerald-500 focus-visible:ring-0 dark:border-zinc-700 dark:focus-visible:border-emerald-500 shadow-none px-4 py-5 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-base shadow-lg shadow-emerald-600/20 transition-all rounded-md mt-4"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Sign Up as Student"
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <a href="/login" className="text-emerald-600 font-semibold hover:underline">
               Log in
            </a>
          </p>

          <div className="mt-10 text-center text-xs font-medium text-zinc-400">
             <span className="italic">In partner with</span>
             <div className="flex justify-center items-center mt-2 gap-2 text-zinc-600 dark:text-zinc-300">
                <GraduationCap className="h-4 w-4" />
                <span className="font-bold tracking-tight text-sm">Academeet</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
