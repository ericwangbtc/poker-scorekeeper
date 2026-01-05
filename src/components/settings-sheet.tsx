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

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chipsPerHand: number;
  chipValue: number;
  onSave: (values: { chipsPerHand: number; chipValue: number }) => Promise<void>;
}

export function SettingsSheet({
  open,
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>房间设置</SheetTitle>
          <SheetDescription>
            调整筹码配置，所有成员实时同步。
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
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
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <SheetFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
