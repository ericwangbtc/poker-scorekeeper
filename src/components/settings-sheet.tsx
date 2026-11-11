"use client";

import { useState, useMemo, FormEvent, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { focusDialogHeading } from "@/lib/dialog-focus";

interface SettingsSheetProps {
  onCloseAutoFocus: (event: Event) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chipsPerHand: number;
  chipValue: number;
  onSave: (values: { chipsPerHand: number; chipValue: number }) => Promise<void>;
}

export function SettingsSheet({
  open,
  onCloseAutoFocus,
  onOpenChange,
  chipsPerHand,
  chipValue,
  onSave,
}: SettingsSheetProps) {
  const [chips, setChips] = useState(`${chipsPerHand}`);
  const [value, setValue] = useState(`${chipValue}`);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setChips(`${chipsPerHand}`);
      setValue(`${chipValue}`);
      setError(null);
    }
  }, [chipValue, chipsPerHand, open]);

  const isValid = useMemo(() => {
    const parsedChips = Number(chips);
    const parsedValue = Number(value);
    return (
      Number.isFinite(parsedChips) &&
      parsedChips > 0 &&
      Number.isFinite(parsedValue) &&
      parsedValue > 0
    );
  }, [chips, value]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    if (!isValid) {
      setError("请输入有效的数字");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        chipsPerHand: Number(chips),
        chipValue: Number(value),
      });
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "保存失败，请重试。";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => { if (!saving) onOpenChange(next); }}>
      <SheetContent
        onCloseAutoFocus={onCloseAutoFocus}
        side="bottom"
        className="gap-0"
        onOpenAutoFocus={focusDialogHeading}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 pr-14">
          <SheetTitle data-dialog-heading tabIndex={-1} className="outline-none">房间设置</SheetTitle>
          <SheetDescription>
            调整筹码配置，所有成员实时同步。
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-col">
          <div className="flex min-h-0 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-4 [&>div]:shrink-0">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="chipsPerHand"
                className="text-sm font-medium text-foreground"
              >
                每手筹码数
              </label>
              <Input
                id="chipsPerHand"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={chips}
                onChange={(e) => setChips(e.target.value)}
                className="h-12"
                placeholder="500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="chipValue"
                className="text-sm font-medium text-foreground"
              >
                筹码单价 (元/个)
              </label>
              <Input
                id="chipValue"
                type="number"
                inputMode="decimal"
                min={0.01}
                step={0.01}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-12"
                placeholder="0.1"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

          </div>
          <SheetFooter className="shrink-0 flex-row border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={saving || !isValid}
              className="gold-gradient text-primary-foreground"
            >
              {saving ? "保存中..." : "保存"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
