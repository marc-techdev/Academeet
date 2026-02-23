// ============================================================
// Faculty Consultation Scheduler — Database Type Definitions
// ============================================================
// These types mirror the exact Supabase/PostgreSQL schema deployed
// via `supabase/schema.sql`.  They are consumed by the typed
// Supabase clients in `src/utils/supabase/`.
// ============================================================

// ────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────

/** Matches the `user_role` PostgreSQL enum. */
export type UserRole = "student" | "professor";

/** Matches the `slot_status` PostgreSQL enum. */
export type SlotStatus = "open" | "booked" | "cancelled";

// ────────────────────────────────────────────────────────────
// Row types  (what you get back from a SELECT)
// ────────────────────────────────────────────────────────────

/** A row in the `users` table. */
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  id_number: string;
  created_at: string;
}

/** A row in the `consultation_windows` table. */
export interface ConsultationWindow {
  id: string;
  professor_id: string;
  date: string;           // DATE  → ISO "YYYY-MM-DD"
  start_time: string;     // TIME  → "HH:MM:SS"
  end_time: string;       // TIME  → "HH:MM:SS"
  created_at: string;
}

/** A row in the `slots` table. */
export interface Slot {
  id: string;
  window_id: string;
  professor_id: string;
  student_id: string | null;
  start_time: string;     // TIMESTAMPTZ → ISO 8601
  end_time: string;       // TIMESTAMPTZ → ISO 8601
  status: SlotStatus;
  agenda: string | null;
  created_at: string;
}

// ────────────────────────────────────────────────────────────
// Insert types  (what you send for an INSERT — omits defaults)
// ────────────────────────────────────────────────────────────

/** Payload for inserting a new `users` row. */
export interface UserInsert {
  id: string;             // must match auth.users.id
  email: string;
  full_name: string;
  role: UserRole;
  id_number: string;
  created_at?: string;
}

/** Payload for inserting a new `consultation_windows` row. */
export interface ConsultationWindowInsert {
  id?: string;
  professor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  created_at?: string;
}

/** Payload for inserting a new `slots` row. */
export interface SlotInsert {
  id?: string;
  window_id: string;
  professor_id: string;
  student_id?: string | null;
  start_time: string;
  end_time: string;
  status?: SlotStatus;
  agenda?: string | null;
  created_at?: string;
}

// ────────────────────────────────────────────────────────────
// Update types  (what you send for an UPDATE — all optional)
// ────────────────────────────────────────────────────────────

/** Payload for updating a `users` row. */
export interface UserUpdate {
  email?: string;
  full_name?: string;
  role?: UserRole;
  id_number?: string;
}

/** Payload for updating a `consultation_windows` row. */
export interface ConsultationWindowUpdate {
  professor_id?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
}

/** Payload for updating a `slots` row. */
export interface SlotUpdate {
  student_id?: string | null;
  start_time?: string;
  end_time?: string;
  status?: SlotStatus;
  agenda?: string | null;
}

// ────────────────────────────────────────────────────────────
// Supabase-compatible Database type
// ────────────────────────────────────────────────────────────
// This follows the shape expected by `createServerClient<Database>()`
// and `createBrowserClient<Database>()` from @supabase/ssr.
// ────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
      };
      consultation_windows: {
        Row: ConsultationWindow;
        Insert: ConsultationWindowInsert;
        Update: ConsultationWindowUpdate;
      };
      slots: {
        Row: Slot;
        Insert: SlotInsert;
        Update: SlotUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      slot_status: SlotStatus;
    };
  };
}
