import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRoom } from "../services/roomService";

const HomePage = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setIsCreating(true);
      setError(null);
      const roomId = await createRoom(displayName.trim() || undefined);
      navigate(`/room/${roomId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "创建房间失败，请稍后再试。";
      setError(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-900 text-slate-50">
      <div className="mx-auto flex h-full max-w-xl flex-col items-center px-6 py-16">
        <header className="flex flex-col items-center gap-3 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-300">
            <span role="img" aria-label="poker">
              🎲
            </span>
            Texas Hold&apos;em
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            德州扑克记分板
          </h1>
          <p className="max-w-md text-sm text-slate-300 sm:text-base">
            创建一个实时同步的房间，邀请好友一起记录筹码，支持移动端随时查看与编辑。
          </p>
        </header>

        <main className="mt-12 w-full rounded-2xl bg-slate-800/70 p-6 shadow-xl backdrop-blur">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-slate-200">
                主持人昵称（可选）
              </span>
              <input
                type="text"
                placeholder="用于自动添加的首位玩家"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-base text-slate-50 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/50"
              />
            </label>

            {error ? (
              <div className="rounded-lg border border-red-500/60 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-base font-semibold text-white transition focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-not-allowed disabled:bg-indigo-500/40"
            >
              {isCreating ? "创建中..." : "创建新局"}
            </button>
          </form>
        </main>

        <footer className="mt-auto w-full pt-16 text-center text-xs text-slate-500">
          房间将保留30天，无需注册，分享链接即可进入。
        </footer>
      </div>
    </div>
  );
};

export default HomePage;
