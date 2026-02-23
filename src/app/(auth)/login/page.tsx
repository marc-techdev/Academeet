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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-zinc-50 via-blue-50/40 to-indigo-50/30 dark:from-zinc-950 dark:via-blue-950/20 dark:to-indigo-950/10 px-4">
      {/* Subtle background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl dark:bg-indigo-900/20" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-zinc-200/60 shadow-xl shadow-zinc-900/5 backdrop-blur dark:border-zinc-800/60 dark:shadow-zinc-950/30">
        <CardHeader className="items-center space-y-3 pb-2">
          {/* Logo / icon */}
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/25">
            <GraduationCap className="h-7 w-7" />
          </div>

          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Welcome to Academeet
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sign in to manage your consultation schedule
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {/* Server-side error banner */}
          {state.error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <Form {...form}>
            <form action={formAction} className="space-y-4">
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@university.edu"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Password */}
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit */}
              <Button
                type="submit"
                className="w-full cursor-pointer bg-linear-to-r from-blue-600 to-indigo-600 font-medium text-white shadow-md shadow-blue-600/20 transition-all hover:shadow-lg hover:shadow-blue-600/30 hover:brightness-110"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Sign up
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
