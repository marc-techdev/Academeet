"use client";

import { useState, useTransition } from "react";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { deletePastSlot } from "@/app/professor/dashboard/actions";

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

export function DeleteUpcomingSlotButton({ slotId, customTrigger }: { slotId: string, customTrigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      // Re-using the same server action since it just deletes a slot by ID
      const result = await deletePastSlot(slotId);
      
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Single timeslot deleted.");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customTrigger ? (
          <div className="inline-block" title="Delete single timeslot">
             {customTrigger}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-500 hover:text-red-600 hover:bg-red-50"
            title="Delete individual timeslot"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete timeslot</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Individual Timeslot
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this specific 20-minute slot? This will only remove this single block of time, not the entire consultation session.
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
            onClick={handleDelete}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Single Slot"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
