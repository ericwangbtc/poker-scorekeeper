import { DisplayMode } from "../types";

interface DisplayModeToggleProps {
  mode: DisplayMode;
  onChange: (mode: DisplayMode) => void;
  disabled?: boolean;
}

const DisplayModeToggle = ({
  mode,
  onChange,
  disabled
}: DisplayModeToggleProps) => {
  const handleToggle = (next: DisplayMode) => () => {
    if (disabled || next === mode) {
      return;
    }
    onChange(next);
  };

  return (
    <div
      role="group"
      aria-label="显示模式"
      className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-xs font-medium text-slate-600 shadow-sm"
    >
      <button
        type="button"
        onClick={handleToggle("chip")}
        disabled={disabled}
        className={`rounded-full px-3 py-1 transition ${
          mode === "chip"
            ? "bg-indigo-500 text-white shadow-sm"
            : "hover:bg-slate-100"
        } ${disabled ? "opacity-60" : ""}`}
      >
        筹码
      </button>
      <button
        type="button"
        onClick={handleToggle("cash")}
        disabled={disabled}
        className={`rounded-full px-3 py-1 transition ${
          mode === "cash"
            ? "bg-indigo-500 text-white shadow-sm"
            : "hover:bg-slate-100"
        } ${disabled ? "opacity-60" : ""}`}
      >
        金额
      </button>
    </div>
  );
};

export default DisplayModeToggle;
