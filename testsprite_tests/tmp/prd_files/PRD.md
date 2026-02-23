# Product Requirements Document (PRD)

## Faculty Consultation Scheduler ("Academeet")

### 1. Overview

The Faculty Consultation Scheduler is a real-time web application to streamline academic consultations. It organizes interactions between faculty and students using an automated 15-minute slot reservation model, preventing double-bookings and ensuring professors have necessary context before meetings.

### 2. Core Features

#### 2.1 Role-Based Authentication

- **Roles:** The system enforces strict separation between `student` and `professor` roles.
- **Sign-Up Flow:** Users must provide Full Name, University ID Number, Email, Password, and select their Role.
- **Constraint:** The University ID Number (`id_number`) must be unique system-wide.
- **Access Control:** Middleware prevents users from accessing interfaces not meant for their role (e.g., students cannot access `/professor/dashboard`).

#### 2.2 Professor Dashboard & Automated Slot Generation

- **Consultation Windows:** Professors define blocks of availability by setting a `date`, `start_time`, and `end_time`.
- **Automated 15-Minute Intervals:** The backend automatically computes and generates contiguous 15-minute `slots` within the specified window.
- **View Appointments:** Professors can view their generated slots, monitoring statuses (`open`, `booked`, `cancelled`) and reading the student's agenda for booked slots.

#### 2.3 Student Dashboard & Real-Time Booking

- **Unified Availability:** Students can browse upcoming windows posted by any professor.
- **Real-Time Data:** The slot grid uses Supabase Realtime subscriptions to instantly update slot statuses (e.g., flipping a slot to `booked` instantly if another student reserves it) without a page refresh.
- **Visual States:** distinct visual rendering for `Open` (clickable), `Your Booking` (disabled), `Taken` (disabled), and `Cancelled` (disabled) slots.
- **The 'Forced Agenda' Requirement:**
  - When clicking an `open` slot, a booking dialog mandates a "Pre-Consultation Agenda".
  - **Validation:** Strict minimum of 10 characters enforced on both the client and server to ensure students describe their thesis topic or technical issue adequately.
- **Race-Condition Safety:** The booking database update explicitly requires the slot to be `open`, avoiding concurrent double-bookings.

### 3. Tech Stack Requirements

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4, mobile-first approach, using `@apply` where appropriate.
- **Components:** Shadcn UI, Lucide React icons
- **Backend/Auth:** Supabase with `@supabase/ssr`
- **Validation:** React Hook Form + Zod
- **Date Utilities:** `date-fns`

### 4. Database Schema Structure

- `users`: Stores user profile info (`full_name`, `id_number`, `role`), linked to Supabase Auth.
- `consultation_windows`: Parent availability blocks belonging to a professor.
- `slots`: Child rows representing 15-minute chunks, containing `status`, `student_id`, and `agenda`. Protected by database-level Check Constraints (e.g., minimum agenda length if booked).
