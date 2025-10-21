import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="flex min-h-full flex-col items-center justify-center gap-6 bg-slate-900 px-6 py-16 text-slate-100">
    <div className="rounded-2xl border border-slate-800 bg-slate-800/60 px-8 py-10 text-center shadow-lg">
      <p className="text-sm uppercase tracking-[0.3em] text-indigo-400">
        404
      </p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight">
        房间不存在
      </h1>
      <p className="mt-3 max-w-sm text-sm text-slate-300">
        可能是房间已过期或链接输入有误。请检查房间ID或创建一个新房间。
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex items-center justify-center rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        返回首页
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
