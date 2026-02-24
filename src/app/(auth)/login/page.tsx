"use client";

import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Loader2, GraduationCap } from "lucide-react";

import { loginAction, type LoginResult } from "./actions";

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

// ── Zod schema ──────────────────────────────────────────────

const loginSchema = z.object({
  email: z.email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

// ── Component ───────────────────────────────────────────────

/**
 * Login page — centered card with RHF + Zod validation.
 * Calls the `loginAction` Server Action via `useActionState`.
 */
export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginResult, FormData>(
    loginAction,
    { error: undefined }
  );

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Left Side (Brand & Visuals) ── */}
      <div className="hidden flex-col justify-center bg-blue-600 p-12 text-white lg:flex relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-blue-500/50 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl" />
        </div>
        
        <div className="relative z-10 mx-auto max-w-md text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Welcome Back
          </h1>
          <p className="mb-12 text-lg text-blue-100">
            Manage your <span className="underline decoration-blue-300 underline-offset-4 font-semibold">university consultations</span> efficiently
          </p>

          {/* Aesthetic illustration placeholder */}
          <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-3xl bg-blue-500/30 backdrop-blur-sm border border-blue-400/20 shadow-2xl">
              <GraduationCap className="h-24 w-24 text-blue-50 opacity-90" />
          </div>
        </div>
      </div>

      {/* ── Right Side (Form Area) ── */}
      <div className="flex flex-col justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950 sm:px-12 lg:px-24 relative">
        <div className="absolute top-8 left-8 flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="text-xl font-bold tracking-tight text-blue-900 dark:text-blue-200">Academeet</span>
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-500">
              Log In
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium tracking-wide">
              Enter your valid credentials to proceed
            </p>
          </div>

          {state.error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              {state.error}
            </div>
          )}

          <Form {...form}>
            <form action={formAction} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                      Enter your email address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
                        autoComplete="email"
                        className="bg-transparent border-dashed border-2 border-zinc-300 focus-visible:border-blue-500 focus-visible:ring-0 dark:border-zinc-700 dark:focus-visible:border-blue-500 shadow-none px-4 py-6 text-base"
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
                      Enter your password
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className="bg-transparent border-dashed border-2 border-zinc-300 focus-visible:border-blue-500 focus-visible:ring-0 dark:border-zinc-700 dark:focus-visible:border-blue-500 shadow-none px-4 py-6 text-base"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-600/20 transition-all rounded-md mt-2"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>
          </Form>


          <p className="mt-8 text-center text-sm text-zinc-500">
            Don't have an account?{" "}
            <a href="/signup" className="text-blue-600 font-semibold hover:underline">
               Sign up
            </a>
          </p>

          <div className="mt-12 text-center text-xs font-medium text-zinc-400">
             <span className="italic">In partner with</span>
             <div className="flex justify-center items-center mt-2 gap-2 text-zinc-600 dark:text-zinc-300">
                <GraduationCap className="h-5 w-5" />
                <span className="font-bold tracking-tight text-sm">Academeet</span>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
