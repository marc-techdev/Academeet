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
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-zinc-50 via-emerald-50/40 to-teal-50/30 dark:from-zinc-950 dark:via-emerald-950/20 dark:to-teal-950/10 px-4 py-10">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl dark:bg-emerald-900/20" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl dark:bg-teal-900/20" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-zinc-200/60 shadow-xl shadow-zinc-900/5 backdrop-blur dark:border-zinc-800/60 dark:shadow-zinc-950/30">
        <CardHeader className="items-center space-y-3 pb-2">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25">
            <BookOpen className="h-7 w-7" />
          </div>

          <div className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight">
              Student Sign Up
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Create your student account to book consultations
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
              {/* Hidden role field — always "student" */}
              <input type="hidden" name="role" value="student" />

              {/* Full Name */}
              <FormField
                control={form.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Juan Dela Cruz"
                        autoComplete="name"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ID Number */}
              <FormField
                control={form.control}
                name="id_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>University ID Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="2021-00123"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        autoComplete="new-password"
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
                className="w-full cursor-pointer bg-linear-to-r from-emerald-600 to-teal-600 font-medium text-white shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:shadow-emerald-600/30 hover:brightness-110"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account…
                  </>
                ) : (
                  "Sign Up as Student"
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-medium text-emerald-600 underline-offset-4 hover:underline dark:text-emerald-400"
            >
              Log in
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
