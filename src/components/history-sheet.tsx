"use client";

import { memo, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  GroupedHistoryItem,
  groupHistoryEntries,
  HistoryTone,
} from "@/lib/history";
import { HistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  HISTORY_GROUP_HEADER_CLASS,
  HISTORY_TIME_LABEL_CLASS,
} from "@/lib/sheet-ui";

interface HistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: HistoryEntry[];
}

const toneClass = (tone: HistoryTone) => {
  if (tone === "positive") return "bg-profit";
  if (tone === "negative") return "bg-loss";
  return "bg-muted-foreground";
};

const valueClass = (tone: HistoryTone) => {
  if (tone === "positive") return "text-profit";
  if (tone === "negative") return "text-loss";
  return "text-muted-foreground";
};

const HistoryRow = memo(function HistoryRow({ item }: { item: GroupedHistoryItem }) {
  const { description } = item;

  return (
    <li key={item.entry.id} className="relative pb-6 pl-6 last:pb-0">
      <span
        className={cn(
          "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ring-4 ring-background",
          toneClass(description.tone)
        )}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {description.title}
          </span>
          <span className="text-xs text-muted-foreground">{description.subtitle}</span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {description.value ? (
            <span className={cn("font-mono text-sm font-bold", valueClass(description.tone))}>
              {description.value}
            </span>
          ) : null}
          <span className={HISTORY_TIME_LABEL_CLASS}>
            {item.relativeLabel} · {item.timeLabel}
          </span>
        </div>
      </div>
    </li>
  );
});

export function HistorySheet({
  open,
  onOpenChange,
  entries,
}: HistorySheetProps) {
  const groupedEntries = useMemo(() => {
    if (!open || entries.length === 0) {
      return [];
    }
    return groupHistoryEntries(entries);
  }, [entries, open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85vh]"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>历史记录</SheetTitle>
        </SheetHeader>
        <div className="max-h-[70vh] overflow-y-auto pl-2 pr-1">
          {entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              暂无历史记录。
            </p>
          ) : (
            <div className="space-y-4 pb-8">
              {groupedEntries.map((section) => (
                <section key={section.key}>
                  <div className={HISTORY_GROUP_HEADER_CLASS}>
                    {section.label}
                  </div>
                  <ul className="relative ml-2 space-y-0 border-l border-border/50">
                    {section.items.map((item) => (
                      <HistoryRow key={item.entry.id} item={item} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
