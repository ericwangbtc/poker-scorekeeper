"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AddPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string) => Promise<void>;
}

export function AddPlayerDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddPlayerDialogProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    } else {
      setName("");
    }
  }, [open]);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onSubmit(trimmed);
      setName("");
      onOpenChange(false);
    } catch {
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>添加玩家</DialogTitle>
          <DialogDescription>
            输入玩家昵称，点击确认即可加入房间。
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="输入玩家昵称"
            className="h-12"
            disabled={isSubmitting}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || name.trim().length === 0}
            className="gold-gradient text-primary-foreground"
          >
            {isSubmitting ? "添加中..." : "确认添加"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
