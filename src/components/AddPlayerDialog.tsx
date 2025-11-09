import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface AddPlayerDialogProps {
  open: boolean;
  isSubmitting: boolean;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
}

const AddPlayerDialog = ({
  open,
  isSubmitting,
  onSubmit,
  onClose
}: AddPlayerDialogProps) => {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
    } else {
      setName("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed || isSubmitting) {
      return;
    }
    try {
      await onSubmit(trimmed);
      setName("");
    } catch (error) {
      // 父组件会提示错误，这里保持输入框内容方便重试。
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">添加玩家</h3>
        <p className="mt-2 text-sm text-slate-500">输入玩家昵称，点击确认即可加入房间。</p>
        <div className="mt-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleSubmit();
              }
              if (event.key === "Escape") {
                event.preventDefault();
                handleClose();
              }
            }}
            placeholder="输入玩家昵称"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
            disabled={isSubmitting}
          />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            disabled={isSubmitting}
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || name.trim().length === 0}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-indigo-200",
              isSubmitting
                ? "cursor-wait bg-indigo-400/80"
                : "bg-indigo-500 hover:bg-indigo-400"
            )}
          >
            {isSubmitting ? "添加中..." : "确认添加"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AddPlayerDialog;
