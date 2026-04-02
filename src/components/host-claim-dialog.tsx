"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HostClaimDialogProps {
  open: boolean;
  submitting: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (pin: string) => Promise<void>;
}

export function HostClaimDialog({
  open,
  submitting,
  onOpenChange,
  onSubmit,
}: HostClaimDialogProps) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    if (!open) {
      setPin("");
    }
  }, [open]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await onSubmit(pin);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>PIN 认领房主</DialogTitle>
          <DialogDescription>
            输入房主 PIN 后可获得手数编辑权限。
          </DialogDescription>
        </DialogHeader>
        <form className="mt-2 flex flex-col gap-4" onSubmit={handleSubmit}>
          <Input
            inputMode="numeric"
            pattern="\d*"
            placeholder="输入 6 位 PIN"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            className="text-center tracking-[0.3em]"
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={submitting || pin.trim().length === 0}
              className="gold-gradient text-primary-foreground"
            >
              {submitting ? "认领中..." : "确认认领"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
