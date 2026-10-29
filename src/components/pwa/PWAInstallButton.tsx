import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Desktop / Android
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition"
      >
        <Download className="w-3.5 h-3.5" />
        <span>PWA Kur (+2 Bonus)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300 hover:text-white"
        >
          <Download className="w-3.5 h-3.5 text-emerald-400" />
          <span>iOS'e Ekle</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-sm rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <h3 className="text-base font-bold text-white">iPhone / iPad'e Yükle</h3>
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                1. Safari araç çubuğundaki <strong>Paylaş (Share)</strong> simgesine dokunun.<br />
                2. Menüyü aşağı kaydırıp <strong>Ana Ekrana Ekle (Add to Home Screen)</strong> seçeneğini seçin.
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-lg bg-slate-800 hover:bg-slate-700 py-2 text-xs font-bold text-white transition"
              >
                Anladım
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
