import clsx from "clsx";
import { createPortal } from "react-dom";

interface CreateRoomConfirmDialogProps {
  open: boolean;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

const CreateRoomConfirmDialog = ({
  open,
  isLoading,
  onCancel,
  onConfirm
}: CreateRoomConfirmDialogProps) => {
  if (!open) {
    return null;
  }

  const handleConfirm = async () => {
    if (isLoading) {
      return;
    }
    await onConfirm();
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">创建新房间</h3>
        <p className="mt-2 text-sm text-slate-500">
          创建新房间会生成一个全新的对局链接，当前房间仍可继续使用。确认继续吗？
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            再想想
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={clsx(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-indigo-200",
              isLoading
                ? "cursor-wait bg-indigo-400/70"
                : "bg-indigo-500 hover:bg-indigo-400"
            )}
          >
            {isLoading ? "创建中..." : "确认创建"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default CreateRoomConfirmDialog;
