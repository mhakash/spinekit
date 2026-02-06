/**
 * Delete Table Confirmation Dialog
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

interface DeleteTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableName: string;
  displayName: string;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export function DeleteTableDialog({
  open,
  onOpenChange,
  tableName,
  displayName,
  onConfirm,
  isDeleting = false,
}: DeleteTableDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Delete Table</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the table "{displayName}" ({tableName})?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive font-medium">
              This action cannot be undone.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              All data in this table will be permanently deleted.
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
            {isDeleting ? "Deleting..." : "Delete Table"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
