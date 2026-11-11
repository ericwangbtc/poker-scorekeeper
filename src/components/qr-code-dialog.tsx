"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { focusDialogHeading } from "@/lib/dialog-focus";
import Image from "next/image";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface QrCodeDialogProps {
  onCloseAutoFocus: (event: Event) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  link: string;
  onCopy: () => void;
}

function QrCodeDisplay({ link }: { link: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(link, {
      width: 280,
      margin: 2,
      color: { dark: "#0a0d14", light: "#ffffff" },
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
  }, [link]);

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {qrDataUrl ? (
        <Image
          src={qrDataUrl}
          alt="房间二维码"
          width={224}
          height={224}
          className="h-56 w-56 rounded-xl border border-border p-2"
          unoptimized
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
      <div className="w-full break-all rounded-lg bg-muted px-4 py-3 text-xs text-muted-foreground">
        {link}
      </div>
    </div>
  );
}

export function QrCodeDialog({ open, onOpenChange, link, onCopy, onCloseAutoFocus }: QrCodeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={focusDialogHeading} onCloseAutoFocus={onCloseAutoFocus} className="max-w-sm">
        <DialogHeader>
          <DialogTitle data-dialog-heading tabIndex={-1} className="outline-none">邀请加入房间</DialogTitle>
          <DialogDescription>
            扫描二维码或打开房间链接即可加入。
          </DialogDescription>
        </DialogHeader>
        {open && link && <QrCodeDisplay link={link} />}
        <Button onClick={onCopy} disabled={!link}>复制房间链接</Button>
      </DialogContent>
    </Dialog>
  );
}
