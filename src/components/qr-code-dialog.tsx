"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: string;
}

export function QrCodeDialog({ open, onOpenChange, link }: QrCodeDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQrDataUrl(undefined);
      setError(null);
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(link, {
      width: 280,
      margin: 2,
      color: { dark: "#fbbf24", light: "#0a0d14" },
    })
      .then((dataUrl: string) => {
        if (isMounted) setQrDataUrl(dataUrl);
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "二维码生成失败");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [link, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>扫码加入</DialogTitle>
          <DialogDescription>
            扫码即可加入房间，适合现场快速分享。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="房间二维码"
              className="h-56 w-56 rounded-xl border border-border p-2"
            />
          ) : error ? (
            <div className="w-full rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
              二维码生成中...
            </div>
          )}
          <div className="w-full rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground break-all">
            {link}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
