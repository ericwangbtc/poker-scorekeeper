import { ReactNode } from "react";
import { createPortal } from "react-dom";

interface ToastProps {
  open: boolean;
  message: ReactNode;
}

const Toast = ({ open, message }: ToastProps) => {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-slate-900/90 px-4 py-2 text-sm text-white shadow-lg">
        {message}
      </div>
    </div>,
    document.body
  );
};

export default Toast;
