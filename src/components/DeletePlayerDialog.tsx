import clsx from "clsx";
import { useState } from "react";
import { createPortal } from "react-dom";

interface DeletePlayerDialogProps {
  open: boolean;
  playerName: string;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const DeletePlayerDialog = ({
  open,
  playerName,
  onCancel,
  onConfirm
}: DeletePlayerDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsProcessing(true);
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <h3 className="text-lg font-semibold text-slate-900">确认删除</h3>
        <p className="mt-2 text-sm text-slate-500">
          确认删除玩家<span className="font-medium text-slate-700">
            {playerName}
          </span>
          吗？该操作会同步给所有成员。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-red-200",
              isProcessing
                ? "bg-red-400/70 cursor-wait"
                : "bg-red-500 hover:bg-red-400"
            )}
          >
            {isProcessing ? "删除中..." : "删除"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DeletePlayerDialog;
