export function DownloadPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">📱 TempTalk App</h1>

        <p className="text-slate-400 mb-6">
          Download the latest Android version of TempTalk.
        </p>

        <a
          href="/TempTalk-g2.apk"
          download
          className="inline-block bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-xl font-semibold"
        >
          Download APK
        </a>
      </div>
    </div>
  );
}