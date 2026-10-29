import React from 'react';
import { useApp } from '../context/AppContext';
import { Activity, ShieldAlert, Globe, Wifi, WifiOff, RefreshCw } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    lang,
    setLang,
    activeTab,
    setActiveTab,
    data,
    refreshData,
    loading,
    highContrast,
    setHighContrast,
    isOfflineSimulated,
    toggleOfflineSimulation,
    activeAlarm,
  } = useApp();

  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-none bg-[#c53737] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm">
            F1
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-stone-900">
                F1 Race Intelligence
              </h1>
            </div>
            <p className="text-xs text-stone-500 font-medium">
              {lang === 'tr'
                ? 'Canlı Yarış Analitiği & Bulut Güvenlik Paneli'
                : 'Live Race Analytics & Cloud Security Hub'}
            </p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <nav className="flex items-center gap-6 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('race')}
            className={`py-2 px-1 font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'race'
                ? 'text-[#c53737] font-bold border-b-2 border-[#c53737]'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>{lang === 'tr' ? 'Yarış Analizi' : 'Race Analysis'}</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'text-[#c53737] font-bold border-b-2 border-[#c53737]'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{lang === 'tr' ? 'Güvenlik & İzleme' : 'Security & Logs'}</span>
            {activeAlarm && (
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
            )}
          </button>
        </nav>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Network Simulation Kill Switch */}
          <button
            onClick={toggleOfflineSimulation}
            title={
              isOfflineSimulated
                ? (lang === 'tr' ? 'Ağ simülasyonunu kapat (Canlı API\'ye dön)' : 'Disable offline simulation (Back to live)')
                : (lang === 'tr' ? 'Ağ kesintisi ve offline fallback simüle et' : 'Simulate network outage and local fallback')
            }
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-mono font-medium border transition-colors ${
              isOfflineSimulated
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {isOfflineSimulated ? (
              <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            ) : (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="hidden sm:inline">
              {isOfflineSimulated
                ? (lang === 'tr' ? 'Çevrimdışı (Önbellek)' : 'Offline (Cache)')
                : (lang === 'tr' ? 'Canlı API' : 'Live API')}
            </span>
          </button>


          {/* Language Switcher */}
          <button
            onClick={() => setLang(lang === 'tr' ? 'en' : 'tr')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-none bg-stone-50 border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-bold font-mono transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-[#c53737]" />
            <span>{lang.toUpperCase()}</span>
          </button>

          {/* Refresh */}
          <button
            onClick={() => refreshData()}
            disabled={loading}
            className="p-2 rounded-none bg-stone-50 border border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition-colors"
            title={lang === 'tr' ? 'Yenile' : 'Refresh'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#c53737]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Offline / Fallback Notification Banner */}
      {(isOfflineSimulated || data?.isOfflineFallback) && (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <strong>{lang === 'tr' ? 'Çevrimdışı / Dayanıklılık Modu Aktif:' : 'Offline Resilience Mode Active:'}</strong>
            <span>
              {lang === 'tr'
                ? 'OpenF1 API bağlantısı kesintili; uygulama son başarılı yarış oturumu önbelleğinden kesintisiz çalışmaktadır.'
                : 'OpenF1 API is offline; serving verified local telemetry snapshot.'}
            </span>
          </div>
          <button
            onClick={toggleOfflineSimulation}
            className="text-[11px] underline text-amber-800 hover:text-amber-950 font-semibold"
          >
            {lang === 'tr' ? 'Canlıya Geç' : 'Switch to Live'}
          </button>
        </div>
      )}
    </header>
  );
};
