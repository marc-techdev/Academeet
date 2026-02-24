"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { deleteMultiplePastSlots } from "@/app/professor/dashboard/actions";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ClearPastSlotsButton({ slotIds }: { slotIds: string[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!slotIds || slotIds.length === 0) return null;

  function handleClearAll() {
    startTransition(async () => {
      const result = await deleteMultiplePastSlots(slotIds);
      
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(`Successfully deleted ${slotIds.length} past appointment${slotIds.length > 1 ? 's' : ''}.`);
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 border-zinc-200 shadow-sm font-semibold h-[42px] px-5 rounded-xl text-[13px] ml-2"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Clear All Past Appointments
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to permanently delete <strong>{slotIds.length}</strong> past appointment records? This will clear them from your history and cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleClearAll}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              "Clear All Records"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
