/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { KpiCards } from './components/f1/KpiCards';
import { LapComparisonChart } from './components/f1/LapComparisonChart';
import { BumpChart } from './components/f1/BumpChart';
import { PitStrategyTimeline } from './components/f1/PitStrategyTimeline';
import { DriverTable } from './components/f1/DriverTable';
import { MiniTrackMap } from './components/f1/MiniTrackMap';
import { SecurityDashboard } from './components/security/SecurityDashboard';
import { Radio, Flag, AlertCircle, Compass, MapPin } from 'lucide-react';
import { ALL_OPENF1_SESSIONS } from './data/fallbackF1Data';

const MainContent: React.FC = () => {
  const {
    lang,
    activeTab,
    loading,
    error,
    data,
    highContrast,
    selectedYear,
    setSelectedYear,
    selectedSessionKey,
    setSelectedSessionKey,
  } = useApp();

  // Filter all 120+ OpenF1 sessions by selected year
  const racesForSelectedYear = useMemo(() => {
    return ALL_OPENF1_SESSIONS.filter((s) => s.year === selectedYear);
  }, [selectedYear]);

  // Handle switching year
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const firstRace = ALL_OPENF1_SESSIONS.find((s) => s.year === year);
    if (firstRace) {
      setSelectedSessionKey(firstRace.session_key);
    }
  };

  // Skeleton loading state
  if (loading && !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-none border border-stone-200" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-white rounded-none border border-stone-200" />
          <div className="h-24 bg-white rounded-none border border-stone-200" />
          <div className="h-24 bg-white rounded-none border border-stone-200" />
          <div className="h-24 bg-white rounded-none border border-stone-200" />
        </div>
        <div className="h-80 bg-white rounded-none border border-stone-200" />
        <div className="h-80 bg-white rounded-none border border-stone-200" />
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="max-w-xl mx-auto my-16 p-6 rounded-none bg-red-50 border border-red-200 text-center space-y-3">
        <AlertCircle className="w-10 h-10 text-[#c53737] mx-auto" />
        <h2 className="text-base font-bold text-stone-900">Bağlantı Hatası Oluştu</h2>
        <p className="text-xs text-stone-600">{error}</p>
      </div>
    );
  }

  return (
    <main className={`max-w-7xl mx-auto px-4 py-6 space-y-6 ${highContrast ? 'contrast-125' : ''}`}>
      {/* RACE ANALYSIS TAB */}
      {activeTab === 'race' && (
        <div className="space-y-6">
          {/* Master Race Hero Header & Global Selector */}
          <div className="rounded-none border border-stone-200 bg-white p-5 sm:p-6 shadow-sm space-y-4">
            {/* Top Row: Year Toggles & Grand Prix Master Dropdown */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200">
              {/* Season Year Selector Tabs */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="font-bold text-stone-700 mr-1 hidden sm:inline">{lang === 'tr' ? 'Sezon:' : 'Season:'}</span>
                {[2026, 2025, 2024, 2023].map((yr) => (
                  <button
                    key={yr}
                    onClick={() => handleYearChange(yr)}
                    className={`px-2.5 py-1 font-bold border transition ${
                      selectedYear === yr
                        ? 'bg-[#c53737] text-white border-[#c53737]'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900'
                    }`}
                  >
                    {yr} {yr === 2026 && (lang === 'tr' ? '(Güncel)' : '(Current)')}
                  </button>
                ))}
              </div>

              {/* Master Grand Prix Selector Dropdown */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="font-bold text-stone-700 hidden md:inline">{lang === 'tr' ? 'Yarış / Grand Prix:' : 'Race / Grand Prix:'}</span>
                <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-300 px-2 py-1.5">
                  <Flag className="w-3.5 h-3.5 text-[#c53737]" />
                  <select
                    value={selectedSessionKey}
                    onChange={(e) => setSelectedSessionKey(Number(e.target.value))}
                    aria-label={lang === 'tr' ? 'Tüm Grafiklerin Senkronize Olduğu Grand Prix Yarışı' : 'Grand Prix Race Session'}
                    className="bg-transparent font-bold text-stone-900 focus:outline-none cursor-pointer max-w-xs sm:max-w-md font-sans text-xs"
                  >
                    {racesForSelectedYear.map((sess) => (
                      <option key={sess.session_key} value={sess.session_key} className="bg-white text-stone-900">
                        {sess.year} {sess.country_name} GP ({sess.circuit_short_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Middle Row: Active Race Details */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 text-xs text-stone-500 font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-700">
                    <span className="w-2 h-2 rounded-none bg-emerald-500" />
                    {lang === 'tr' ? 'Canlı Telemetri Devrede' : 'Live Telemetry Active'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {data?.session.location || data?.session.circuit_short_name}, {data?.session.country_name}
                  </span>
                </div>

                <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737]">
                  {lang === 'tr'
                    ? `FORMULA 1 ${data?.session.year} SEZONU · TÜM GRAFİKLER BU YARIŞA GÖRE ŞEKİLLENİR`
                    : `FORMULA 1 ${data?.session.year} SEASON · ALL CHARTS SYNCHRONIZED TO THIS RACE`}
                </div>

                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
                  {data?.session.session_name}
                </h2>
                <p className="text-sm font-medium text-[#c53737]">
                  {lang === 'tr'
                    ? 'Resmi OpenF1 telemetri analizi, tur zamanları, pozisyon dinamikleri ve pit stratejisi.'
                    : 'Official OpenF1 telemetry analytics, lap times, position dynamics, and pit stop strategy.'}
                </p>
              </div>

              {/* Circuit and API Details */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-stone-600 bg-stone-50 p-3 rounded-none border border-stone-200">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-stone-400" />
                  <span>{lang === 'tr' ? 'Pist:' : 'Circuit:'} <strong>{data?.session.circuit_short_name} ({data?.session.circuit_length || '5.412 km'})</strong></span>
                </div>
                <span>•</span>
                <div>
                  <span>{lang === 'tr' ? 'Tur Sayısı:' : 'Total Laps:'} <strong>{data?.session.total_laps || 58} {lang === 'tr' ? 'Tur' : 'Laps'}</strong></span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>
                    {lang === 'tr' ? 'Kaynak:' : 'Source:'} <a href="https://api.openf1.org/v1" target="_blank" rel="noreferrer" className="text-stone-900 font-bold hover:underline">OpenF1 API</a>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 KPI Cards */}
          <KpiCards />

          {/* Interactive Mini Track Map with Synchronized Car Positions */}
          <MiniTrackMap />

          {/* Advanced Visualizations */}
          <div className="space-y-6">
            {/* Multi-Driver Lap Time Comparison */}
            <LapComparisonChart />

            {/* Bump Chart: Lap-by-lap positions */}
            <BumpChart />

            {/* Pit Strategy Timeline */}
            <PitStrategyTimeline />
          </div>

          {/* Sortable Detail Grid & CSV Download */}
          <DriverTable />
        </div>
      )}

      {/* SECURITY & OBSERVABILITY TAB */}
      {activeTab === 'security' && <SecurityDashboard />}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-[#f4f3ef] text-stone-900 flex flex-col font-sans transition-colors">
        <Header />
        <div className="flex-1">
          <MainContent />
        </div>

        
        <footer className="border-t border-stone-200 bg-white py-4 px-4 text-center text-xs text-stone-500 space-y-1">
          <div>
            F1 Race Intelligence · Canlı Telemetri ve Güvenli Bulut Gözlemlenebilirlik Sistemi
          </div>
          <div className="text-[11px] text-stone-400">
            Tasarım Kısıtı: Takım logosu ve marka görseli bulunmamaktadır; pilotlar özel renk sistemi ve kısaltmalarla temsil edilmektedir.
          </div>
        </footer>
      </div>
    </AppProvider>
  );
}
