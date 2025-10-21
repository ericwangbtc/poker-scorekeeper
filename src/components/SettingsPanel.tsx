import clsx from "clsx";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

interface SettingsPanelProps {
  open: boolean;
  chipsPerHand: number;
  chipValue: number;
  onSave: (values: { chipsPerHand: number; chipValue: number }) => Promise<void>;
  onClose: () => void;
}

const overlayRoot =
  typeof document !== "undefined" ? document.body : undefined;

const SettingsPanel = ({
  open,
  chipsPerHand,
  chipValue,
  onSave,
  onClose
}: SettingsPanelProps) => {
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

  useEffect(() => {
    if (!open) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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
        chipValue: Number(value)
      });
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "保存失败，请重试。";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !overlayRoot) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl">
        <header className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">房间设置</h2>
            <p className="text-sm text-slate-500">
              随时调整筹码配置，所有成员实时同步。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          >
            ✕
          </button>
        </header>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">
              每手筹码数
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={chips}
              onChange={(event) => setChips(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              placeholder="500"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-slate-700">
              筹码单价 (元/个)
            </span>
            <input
              type="number"
              inputMode="decimal"
              min={0.01}
              step={0.01}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
              placeholder="0.1"
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          ) : null}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving || !isValid}
              className={clsx(
                "rounded-xl px-5 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-indigo-300",
                saving || !isValid
                  ? "bg-indigo-400/60"
                  : "bg-indigo-500 hover:bg-indigo-400"
              )}
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    overlayRoot
  );
};

export default SettingsPanel;
