"use client";

import { useState } from "react";
import { User as UserIcon, Mail, GraduationCap } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface StudentProfileProps {
  id: string;
  full_name: string;
  email: string;
  id_number: string;
}

export function StudentProfileDialog({ student }: { student: StudentProfileProps }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors shadow-sm border border-blue-200/50">
          View Profile
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-blue-600" />
            Student Profile
          </DialogTitle>
          <DialogDescription>
            Details and contact information for {student.full_name}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 border-b border-zinc-100">
          <div className="w-20 h-20 rounded-full bg-linear-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 font-bold text-3xl mb-4 shadow-sm border border-blue-100">
            {student.full_name.charAt(0).toUpperCase()}
          </div>
          <h3 className="font-bold text-xl text-zinc-900">{student.full_name}</h3>
          <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1">
            <GraduationCap className="w-4 h-4" /> Student ID: {student.id_number}
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Email Address</label>
            <div className="flex items-center gap-2 font-medium text-zinc-800">
              <Mail className="w-4 h-4 text-zinc-400" />
              {student.email}
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 block">Status</label>
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-medium px-2.5 py-1 rounded-md text-sm border border-emerald-200/60">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
              Active Enrollment
            </div>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
