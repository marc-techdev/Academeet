"use client";

import { useActionState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod/v4";
import { Loader2, ShieldCheck, GraduationCap } from "lucide-react";
import * as anime from "animejs";
import Image from "next/image";

import { signUpUser, type SignUpResult } from "../actions";

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

// ── Zod schema (professor — no role selector) ───────────────

const signUpFormSchema = z.object({
  full_name: z.string().min(2, "Full name is required."),
  id_number: z.string().min(1, "Faculty ID number is required."),
  email: z.email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignUpFormValues = z.infer<typeof signUpFormSchema>;

/**
 * Professor Sign-Up Page — hidden route only accessible via direct URL.
 * Students cannot see or navigate to this page.
 */
export default function ProfessorSignUpPage() {
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

  // Animation References
  const formContainerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<(HTMLDivElement | HTMLButtonElement | HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    // 1. Initial State Setup
    anime.set([formContainerRef.current, ...elementsRef.current], {
      opacity: 0,
      translateY: 20,
    });

    // 2. Timeline Animation setup for AnimeJS
    setTimeout(() => {
        if (!formContainerRef.current) return;
        const tl = anime.createTimeline({
          defaults: {
              ease: "outExpo",
              duration: 800,
          }
        });
    
        tl.add(formContainerRef.current, {
          opacity: [0, 1],
          translateY: [30, 0],
          duration: 1000,
        }).add(elementsRef.current, {
            opacity: [0, 1],
            translateY: [20, 0],
            delay: anime.stagger(80, { start: 100 }), // Slightly faster stagger for more fields
        }, "-=600");
    }, 100)
  }, []);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Left Side (Brand & Visuals) ── */}
      <div className="hidden relative bg-zinc-900 lg:block overflow-hidden">
        {/* Aesthetic Background Image */}
         <Image
          src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
          alt="Lecture Hall / Classroom"
          fill
          className="object-cover opacity-60 mix-blend-overlay"
          priority
        />
        {/* Dark Gradient Overlay for readability and premium feel */}
        <div className="absolute inset-0 bg-linear-to-t from-indigo-900/90 via-zinc-900/60 to-zinc-900/30" />
        
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-12 text-white/90">
             <div className="flex items-center gap-2">
                 <div className="bg-indigo-500/20 p-2 rounded-xl backdrop-blur-md border border-indigo-400/20 shadow-[0_0_15px_rgba(99,102,241,0.5)]">
                    <GraduationCap className="h-6 w-6 text-indigo-200" />
                 </div>
                <span className="text-xl font-bold tracking-tight text-white">Academeet</span>
            </div>

            <div className="max-w-md space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white">
                 Faculty <br/> <span className="text-indigo-400">Portal</span>
              </h1>
              <p className="text-lg text-indigo-100/80 font-medium max-w-sm">
                 Manage your consultation hours in one centralized place with ease and precision.
              </p>
            </div>
            
             <div className="text-sm font-medium text-white/50">
               © {new Date().getFullYear()} Academeet Inc.
             </div>
        </div>
      </div>

      {/* ── Right Side (Form Area) ── */}
      <div className="flex flex-col justify-center bg-zinc-50 px-6 py-12 dark:bg-zinc-950 sm:px-12 lg:px-24 relative">
         {/* Mobile Header (Hidden on LG) */}
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
            <GraduationCap className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <span className="text-2xl font-bold tracking-tight text-indigo-900 dark:text-indigo-200">Academeet</span>
        </div>

        <div className="mx-auto w-full max-w-sm" ref={formContainerRef}>
          <div className="mb-8 flex flex-col items-center space-y-3 lg:items-start" ref={(el) => { elementsRef.current[0] = el; }}>
             <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Faculty Registration
             </h2>
             <div className="flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">
               <ShieldCheck className="h-3.5 w-3.5" />
               AUTHORIZED FACULTY ONLY
             </div>
          </div>

          {state.error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
              {state.error}
            </div>
          )}

          <Form {...form}>
            <form action={formAction} className="space-y-4">
              <input type="hidden" name="role" value="professor" />

              <div ref={(el) => { elementsRef.current[1] = el; }}>
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
                            placeholder="Dr. Maria Santos"
                            autoComplete="name"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:border-zinc-800 dark:focus-visible:border-indigo-500 transition-all shadow-sm px-4 py-6 text-base rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div ref={(el) => { elementsRef.current[2] = el; }}>
                  <FormField
                    control={form.control}
                    name="id_number"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Faculty ID Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="FAC-2024-001"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:border-zinc-800 dark:focus-visible:border-indigo-500 transition-all shadow-sm px-4 py-6 text-base rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div ref={(el) => { elementsRef.current[3] = el; }}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
                          Institutional Email
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="professor@university.edu"
                            autoComplete="email"
                            className="bg-white dark:bg-zinc-900 border-zinc-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:border-zinc-800 dark:focus-visible:border-indigo-500 transition-all shadow-sm px-4 py-6 text-base rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div ref={(el) => { elementsRef.current[4] = el; }}>
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
                            className="bg-white dark:bg-zinc-900 border-zinc-200 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 dark:border-zinc-800 dark:focus-visible:border-indigo-500 transition-all shadow-sm px-4 py-6 text-base rounded-xl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <div ref={(el) => { elementsRef.current[5] = el as HTMLDivElement; }}>
                  <Button
                    type="submit"
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-lg shadow-indigo-600/20 transition-all rounded-xl mt-4"
                    disabled={isPending}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Register as Professor"
                    )}
                  </Button>
              </div>
            </form>
          </Form>

          <p className="mt-8 text-center lg:text-left text-sm text-zinc-500" ref={(el) => { elementsRef.current[6] = el; }}>
            Already have an account?{" "}
            <a href="/login" className="text-indigo-600 font-semibold hover:underline">
               Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
