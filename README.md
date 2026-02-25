<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3FCF8E?logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss" alt="Tailwind" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
</p>

# 🎓 Academeet — Faculty Consultation Scheduler

**Academeet** is a modern, real-time faculty consultation scheduling platform that connects university students with professors. Students can browse available consultation windows, book time slots, and manage their appointments — while professors can create consultation windows, track bookings, and manage their schedules from a dedicated dashboard.

🔗 **Live Demo:** [academeet-snowy.vercel.app](https://academeet-snowy.vercel.app)

---

## ✨ Features

### For Students

- 📅 **Interactive Calendar** — Browse available consultation windows on a full-size calendar (desktop) or a responsive mobile calendar with topic dot indicators
- ⚡ **Real-time Updates** — Slots update live via Supabase Realtime; no refresh needed
- 📝 **Booking Management** — Book slots, edit agendas, and cancel appointments
- 🔔 **Notification Bell** — Persistent inbox that alerts students when a professor cancels their appointment, with dismissible notifications stored in local storage
- 🎨 **Category Filtering** — Filter by consultation topics (General, Thesis, Practicum, Capstone, etc.)
- 📱 **Fully Responsive** — Optimized layout for desktop, tablet, and mobile

### For Professors

- 🗓️ **Consultation Window Creator** — Set date, time range, slot duration, and topic for consultation blocks
- 📊 **Appointment Grid** — View upcoming and past appointments with student details
- ❌ **Cancellation with Reason** — Cancel booked appointments with a reason that gets logged and pushed to the student's notification inbox
- 🗑️ **Granular Deletion** — Delete individual slots or entire empty consultation windows
- ✏️ **Edit Windows** — Modify existing consultation window details
- ⏱️ **Live Expiration** — Slots automatically move from "Upcoming" to "Past" in real-time

---

## 🛠️ Tech Stack

| Layer              | Technology                                                                        |
| ------------------ | --------------------------------------------------------------------------------- |
| **Framework**      | [Next.js 16](https://nextjs.org/) (App Router, Server Components, Server Actions) |
| **Language**       | [TypeScript 5](https://www.typescriptlang.org/)                                   |
| **Styling**        | [Tailwind CSS 4](https://tailwindcss.com/)                                        |
| **UI Components**  | [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)       |
| **Icons**          | [Lucide React](https://lucide.dev/)                                               |
| **Backend / Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime, RLS)               |
| **Forms**          | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)         |
| **Dates**          | [date-fns](https://date-fns.org/)                                                 |
| **Notifications**  | [Sonner](https://sonner.emilkowal.dev/) (toast) + Custom Notification Bell        |
| **Deployment**     | [Vercel](https://vercel.com/)                                                     |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project with the required tables and RLS policies

### 1. Clone the repository

```bash
git clone https://github.com/marc-techdev/Academeet.git
cd Academeet
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages & server actions
│   ├── (auth)/             # Login & Signup routes
│   ├── student/dashboard/  # Student dashboard (server component + actions)
│   └── professor/dashboard/# Professor dashboard (server component + actions)
├── components/
│   ├── student/            # Student-specific components
│   │   ├── StudentDashboardLayout.tsx  # Main responsive calendar layout
│   │   ├── BookingDialog.tsx           # Slot booking form
│   │   ├── DaySlotsModal.tsx           # Day detail modal with available slots
│   │   ├── StudentNotificationBell.tsx # Cancellation notification inbox
│   │   └── StudentManageBookingDialog.tsx
│   ├── professor/          # Professor-specific components
│   │   ├── ProfessorBookingsGrid.tsx   # Appointment grid with tabs
│   │   ├── BookedSlotDialog.tsx        # Slot details & cancellation dialog
│   │   ├── CreateWindowForm.tsx        # Consultation window creator
│   │   └── EditWindowDialog.tsx        # Edit existing windows
│   └── ui/                 # shadcn/ui base components
├── types/
│   └── database.ts         # TypeScript types mirroring Supabase schema
└── utils/
    └── supabase/           # Supabase client (browser + server)
```

---

## 🗄️ Database Schema

| Table                  | Purpose                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `users`                | Stores student and professor profiles with roles                                      |
| `consultation_windows` | Professor-created time blocks with date, time range, and topic                        |
| `slots`                | Individual bookable time slots within windows (status: `open`, `booked`, `cancelled`) |

---

## 👥 User Roles

| Role          | Signup Route        | Dashboard              |
| ------------- | ------------------- | ---------------------- |
| **Student**   | `/signup`           | `/student/dashboard`   |
| **Professor** | `/signup/professor` | `/professor/dashboard` |

---

## 📄 License

This project is for educational purposes.

---

<p align="center">
  Built with 💜 using Next.js + Supabase
</p>
