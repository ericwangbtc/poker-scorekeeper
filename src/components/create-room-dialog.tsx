"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface CreateRoomDialogProps {
  onCloseAutoFocus: (event: Event) => void;
  open: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export function CreateRoomDialog({
  open,
  onCloseAutoFocus,
  isLoading,
  onCancel,
  onConfirm,
}: CreateRoomDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(open) => { if (!open && !isLoading) onCancel(); }}>
      <AlertDialogContent onCloseAutoFocus={onCloseAutoFocus} className="max-w-sm">
        <AlertDialogHeader>
          <AlertDialogTitle>创建新房间</AlertDialogTitle>
          <AlertDialogDescription>
            创建新房间会生成一个全新的对局链接，当前房间仍可继续使用。确认继续吗？
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            再想想
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              void onConfirm();
            }}
            disabled={isLoading}
            className="gold-gradient text-primary-foreground"
          >
            {isLoading ? "创建中..." : "确认创建"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
