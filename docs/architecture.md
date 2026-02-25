# Architecture Documentation

## Overview

The Faculty Consultation Scheduler ("Academeet") is a real-time web application built with Next.js 15 and Supabase. It uses a 15-minute slot reservation model for academic consultations.

## Data Flow

1. **Authentication**: Handled by Supabase Auth (SSR). Users are assigned roles (`student` or `professor`).
2. **Consultation Windows**: Professors create windows in the `consultation_windows` table.
3. **Slot Generation**: The system (likely via a database trigger or API) generates 15-minute slots in the `slots` table for each window.
4. **Booking**: Students book slots by providing a mandatory "Pre-Consultation Agenda".
5. **Real-time Updates**: Supabase Realtime is used to update slot statuses in the student dashboard instantly.

## Component Boundaries

- **Auth**: Logic for user registration and role-based redirect.
- **Professor Dashboard**: Component for managing windows and viewing appointments.
- **Student Dashboard**: Component for browsing availability and booking slots (Realtime).
- **Common Components**: Shared UI elements using Shadcn UI and Lucide icons.

## Tech Stack

- **Next.js 15 (App Router)**: Core framework.
- **TypeScript**: Type safety.
- **Tailwind CSS v4**: Styling with `@apply` for clean HTML.
- **Supabase**: Backend, Auth, and Realtime database.
- **Lucide Icons**: Consistent iconography.
