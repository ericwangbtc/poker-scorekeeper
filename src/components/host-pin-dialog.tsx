"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sendRoomCommand } from "@/lib/room-service";

function HostPin({ roomId }: { roomId: string }) {
  const [pin, setPin] = useState<string>();
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    sendRoomCommand<{ pin: string }>(roomId, { type: "pin" }).then(
      ({ pin }) => { if (active) setPin(pin); },
      (err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "读取 PIN 失败。");
      },
    );
    return () => { active = false; };
  }, [roomId, attempt]);

  const copy = async () => {
    if (!pin) return;
    try {
      await navigator.clipboard.writeText(pin);
      toast.success("房主 PIN 已复制");
    } catch {
      toast.error("复制失败，请选中 PIN 手动复制。");
    }
  };

  if (error) {
    return (
      <>
        <p role="alert" className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={() => {
          setError(undefined);
          setAttempt((value) => value + 1);
        }}>重试</Button>
      </>
    );
  }
  if (!pin) return <p role="status" className="text-sm text-muted-foreground">正在读取 PIN…</p>;

  return (
    <>
      <p className="select-all rounded-lg border border-primary/30 bg-primary/10 py-4 text-center font-mono text-3xl tracking-widest text-primary">
        {pin}
      </p>
      <Button onClick={copy}>复制 PIN</Button>
    </>
  );
}

export function HostPinDialog({ roomId, open, onOpenChange, onCloseAutoFocus }: {
  roomId: string;
  onCloseAutoFocus: (event: Event) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onCloseAutoFocus={onCloseAutoFocus} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>房主 PIN</DialogTitle>
          <DialogDescription>换设备时可用此 PIN 认领房主权限。请妥善保管。</DialogDescription>
        </DialogHeader>
        {open && <HostPin key={roomId} roomId={roomId} />}
      </DialogContent>
    </Dialog>
  );
}
