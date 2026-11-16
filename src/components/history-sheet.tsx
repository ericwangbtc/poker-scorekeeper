"use client";

import { memo, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  filterPlayerChipHistory,
  GroupedHistoryItem,
  groupHistoryEntries,
  HistoryTone,
} from "@/lib/history";
import { HistoryEntry, Player } from "@/lib/types";
import { focusDialogHeading } from "@/lib/dialog-focus";
import { cn } from "@/lib/utils";
import {
  HISTORY_GROUP_HEADER_CLASS,
  HISTORY_TIME_LABEL_CLASS,
} from "@/lib/sheet-ui";

interface HistorySheetProps {
  onCloseAutoFocus: (event: Event) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entries: HistoryEntry[];
  player: Player | null;
}

const valueClass = (tone: HistoryTone) => {
  if (tone === "positive") return "text-profit";
  if (tone === "negative") return "text-loss";
  return "text-muted-foreground";
};

const HistoryRow = memo(function HistoryRow({ item }: { item: GroupedHistoryItem }) {
  const { description } = item;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1.5 border-b border-border/60 py-4 last:border-b-0">
      <span className="min-w-0 break-words text-[15px] font-semibold leading-snug text-foreground">
        {description.title}
      </span>
      <time
        dateTime={new Date(item.entry.timestamp).toISOString()}
        title={`${item.relativeLabel} · ${item.timeLabel}`}
        className={HISTORY_TIME_LABEL_CLASS}
      >
        {item.timeLabel}
      </time>
      <span className="min-w-0 text-sm leading-relaxed text-foreground/80">
        {description.subtitle}
      </span>
      {description.value ? (
        <span className={cn("whitespace-nowrap text-base font-semibold tabular-nums", valueClass(description.tone))}>
          {description.value}
          {item.entry.type === "hands_adjusted" && <span className="ml-1 text-xs font-normal text-muted-foreground">手</span>}
        </span>
      ) : null}
    </li>
  );
});

export function HistorySheet({
  open,
  onCloseAutoFocus,
  onOpenChange,
  entries,
  player,
}: HistorySheetProps) {
  const playerId = player?.id;
  const groupedEntries = useMemo(() => {
    const visibleEntries = playerId
      ? filterPlayerChipHistory(entries, playerId)
      : entries;
    return groupHistoryEntries(visibleEntries);
  }, [entries, playerId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        onCloseAutoFocus={onCloseAutoFocus}
        side="bottom"
        className="gap-0"
        onOpenAutoFocus={focusDialogHeading}
        aria-describedby={undefined}
      >
        <SheetHeader className="shrink-0 border-b border-border/50 pr-14">
          <SheetTitle data-dialog-heading tabIndex={-1} className="break-words outline-none">
            {player ? `${player.name}的筹码变更记录` : "历史记录"}
          </SheetTitle>
        </SheetHeader>
        <div
          role="region"
          aria-label="记录列表"
          tabIndex={0}
          className="min-h-0 overflow-y-auto overscroll-contain px-4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {groupedEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {player ? "暂无筹码变更记录。" : "暂无历史记录。"}
            </p>
          ) : (
            <div className="space-y-4 pb-5 pt-2">
              {groupedEntries.map((section) => (
                <section key={section.key}>
                  <div className={HISTORY_GROUP_HEADER_CLASS}>
                    {section.label}
                  </div>
                  <ul className="px-1">
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
