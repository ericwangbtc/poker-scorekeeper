import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";

interface QRCodeModalProps {
  open: boolean;
  link: string;
  onClose: () => void;
}

const QRCodeModal = ({ open, link, onClose }: QRCodeModalProps) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQrDataUrl(undefined);
      setError(null);
      return;
    }

    let isMounted = true;
    QRCode.toDataURL(link, {
      width: 280,
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" }
    })
      .then((dataUrl: string) => {
        if (isMounted) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "二维码生成失败");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [link, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">扫码加入</h3>
            <p className="text-sm text-slate-500">
              扫码即可加入房间，适合现场快速分享。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            ✕
          </button>
        </header>
        <div className="flex flex-col items-center gap-4">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="房间二维码"
              className="h-56 w-56 rounded-2xl border border-slate-200 p-2"
            />
          ) : error ? (
            <div className="w-full rounded-xl border border-red-400/40 bg-red-100/40 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          ) : (
            <div className="flex h-56 w-56 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
              二维码生成中...
            </div>
          )}
          <div className="w-full rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-600 break-all">
            {link}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QRCodeModal;
