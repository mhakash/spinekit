/**
 * Delete Record Confirmation Dialog
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteRecordDialog({
  open,
  onOpenChange,
  tableName,
  onConfirm,
  isDeleting = false,
}: DeleteRecordDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delete Record</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this record from {tableName}?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">
              This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              This record will be permanently deleted.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
