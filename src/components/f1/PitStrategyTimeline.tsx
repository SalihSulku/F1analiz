import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table, Info, Disc3, ArrowRight } from 'lucide-react';
import { TireCompound } from '../../types/f1';

export const PitStrategyTimeline: React.FC = () => {
  const { lang, data } = useApp();
  const [showTable, setShowTable] = useState(false);
  const [hoveredPit, setHoveredPit] = useState<string | null>(null);

  const drivers = data?.drivers || [];
  const stints = data?.stints || [];
  const pitStops = data?.pitStops || [];
  const totalLaps = data?.session.total_laps || 58;

  const getCompoundStyle = (compound: TireCompound) => {
    switch (compound) {
      case 'SOFT':
        return { bg: 'bg-red-500', border: 'border-red-600', text: 'text-red-600', label: lang === 'tr' ? 'SOFT (Yumuşak)' : 'SOFT (Soft)' };
      case 'MEDIUM':
        return { bg: 'bg-amber-400', border: 'border-amber-500', text: 'text-amber-600', label: lang === 'tr' ? 'MEDIUM (Orta)' : 'MEDIUM (Medium)' };
      case 'HARD':
        return { bg: 'bg-stone-300', border: 'border-stone-400', text: 'text-stone-700', label: lang === 'tr' ? 'HARD (Sert)' : 'HARD (Hard)' };
      default:
        return { bg: 'bg-emerald-500', border: 'border-emerald-600', text: 'text-emerald-600', label: 'INTER' };
    }
  };

  const fastestPit = data?.session.fastest_pit;
  const summarySentence = lang === 'tr'
    ? `Özet: ${data?.session.session_name || 'Grand Prix'} yarışında en hızlı pit stop ${fastestPit?.driver_acronym || 'NOR'} ekibi tarafından ${fastestPit?.duration || 2.1} saniye ile Tur ${fastestPit?.lap || 18}'de gerçekleştirilmiştir.`
    : `Summary: In ${data?.session.session_name || 'Grand Prix'}, the fastest pit stop was executed for ${fastestPit?.driver_acronym || 'NOR'} in ${fastestPit?.duration || 2.1}s on Lap ${fastestPit?.lap || 18}.`;

  return (
    <div className="rounded-none border border-stone-200 bg-white p-5 sm:p-6 shadow-sm relative">
      <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737] mb-1">
        {lang === 'tr' ? 'PİT STRATEJİSİ & LASTİKLER' : 'PIT STRATEGY & TYRES'}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            {lang === 'tr' ? 'Pit Stratejisi & Lastik Zaman Çizelgesi' : 'Pit Strategy & Tyre Stint Timeline'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {lang === 'tr'
              ? 'Pilotların stint uzunlukları, lastik hamurları (Soft/Medium/Hard) ve pitte duraklama süreleri.'
              : 'Stint lap distributions, tyre compounds, and stationary pit lane durations.'}
          </p>
        </div>

        {/* Legend & Table toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 text-xs font-mono bg-stone-50 px-2.5 py-1 rounded-none border border-stone-200 text-stone-700">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-none bg-red-500" /> Soft
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-none bg-amber-400" /> Medium
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-none bg-stone-300 border border-stone-400" /> Hard
            </span>
          </div>

          <button
            onClick={() => setShowTable(!showTable)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-none text-xs border transition ${
              showTable
                ? 'bg-[#c53737] text-white border-[#c53737] font-semibold'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{showTable ? (lang === 'tr' ? 'Çizelge Görünümü' : 'Timeline View') : (lang === 'tr' ? 'Tablo Görünümü' : 'Table View')}</span>
          </button>
        </div>
      </div>

      {!showTable ? (
        <div className="space-y-4">
          {/* Lap Ruler Guide Header */}
          <div className="relative pl-24 pr-4 text-[10px] text-stone-400 font-mono flex justify-between border-b border-stone-100 pb-1">
            <span>{lang === 'tr' ? 'Tur 1 (Start)' : 'Lap 1 (Start)'}</span>
            <span>{lang === 'tr' ? 'Tur 15 (SC)' : 'Lap 15 (SC)'}</span>
            <span>{lang === 'tr' ? 'Tur 30' : 'Lap 30'}</span>
            <span>{lang === 'tr' ? 'Tur 45' : 'Lap 45'}</span>
            <span>{lang === 'tr' ? `Tur ${totalLaps} (Finiş)` : `Lap ${totalLaps} (Finish)`}</span>
          </div>

          {/* Stint Bars for Top Drivers */}
          <div className="space-y-3">
            {[1, 4, 16, 44].map((driverNo) => {
              const driver = drivers.find((d) => d.driver_number === driverNo);
              if (!driver) return null;

              const driverStints = stints.filter((s) => s.driver_number === driverNo);
              const driverPits = pitStops.filter((p) => p.driver_number === driverNo);

              return (
                <div key={driverNo} className="flex items-center gap-3">
                  {/* Driver Label */}
                  <div className="w-20 shrink-0 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: driver.custom_color }} />
                    <span className="text-xs font-mono font-bold text-stone-900">{driver.name_acronym}</span>
                    <span className="text-[10px] text-stone-400 font-mono">#{driver.driver_number}</span>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="flex-1 h-8 bg-stone-100 rounded-none p-0.5 relative flex items-stretch border border-stone-200 overflow-hidden">
                    {driverStints.map((stint) => {
                      const widthPercent = (stint.total_laps / totalLaps) * 100;
                      const style = getCompoundStyle(stint.compound);
                      return (
                        <div
                          key={stint.stint_number}
                          style={{ width: `${widthPercent}%` }}
                          className={`${style.bg} relative flex items-center justify-center border-r border-white/60 transition hover:brightness-105 group cursor-default`}
                        >
                          <span className="text-[10px] font-bold text-stone-900 tracking-tighter truncate px-1">
                            {stint.compound[0]} · {stint.total_laps}{lang === 'tr' ? 'T' : 'L'}
                          </span>

                          <div className="absolute -top-9 z-20 hidden group-hover:flex items-center gap-1.5 bg-stone-900 border border-stone-800 px-2 py-1 rounded-none text-[10px] text-white whitespace-nowrap shadow-xl">
                            <span>Stint #{stint.stint_number}:</span>
                            <strong className="text-amber-300">{style.label}</strong>
                            <span className="text-stone-300 font-mono">({stint.start_lap}-{stint.end_lap}. {lang === 'tr' ? 'turlar' : 'laps'})</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pit Stop Markers */}
                    {driverPits.map((pit) => {
                      const leftPercent = (pit.lap / totalLaps) * 100;
                      const pitKey = `${driverNo}-${pit.lap}`;
                      const isHovered = hoveredPit === pitKey;

                      return (
                        <div
                          key={pit.lap}
                          style={{ left: `${leftPercent}%` }}
                          onMouseEnter={() => setHoveredPit(pitKey)}
                          onMouseLeave={() => setHoveredPit(null)}
                          className="absolute top-0 bottom-0 w-1.5 bg-stone-900 z-10 cursor-pointer hover:w-2 hover:bg-[#c53737] transition-all"
                        >
                          {isHovered && (
                            <div className="absolute -bottom-10 z-30 bg-stone-900 border border-stone-800 rounded-none px-2 py-1 text-[10px] text-white whitespace-nowrap shadow-2xl font-mono">
                              Pit: {lang === 'tr' ? 'Tur' : 'Lap'} {pit.lap} · {lang === 'tr' ? 'Durma:' : 'Stop:'} {pit.stop_duration}s ({lang === 'tr' ? 'Toplam:' : 'Total:'} {pit.pit_duration}s)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Undercut Strategy Explainer Box */}
          <div className="mt-4 p-3 rounded-none bg-stone-50 border border-stone-200 text-xs text-stone-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Disc3 className="w-4 h-4 text-[#c53737] shrink-0" />
              <span>
                <strong>{lang === 'tr' ? 'Strateji Notu (Undercut Avantajı):' : 'Strategy Note (Undercut):'}</strong>{' '}
                {lang === 'tr'
                  ? 'NOR 18. turda pite girerek taze sert lastiklerle 1:33.200 turu attı; LEC bir tur sonra pite girdiğinde 1.8 saniye geriye düşerek pozisyonu kaybetti.'
                  : 'NOR pitted on lap 18 on fresh hard tyres; LEC pitted lap 19 and fell 1.8s behind.'}
              </span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px] font-bold text-[#c53737]">
              Delta: +1.8s <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      ) : (
        /* Accessible Table */
        <div className="max-h-72 overflow-y-auto border border-stone-200 rounded-none">
          <table className="w-full text-xs text-left text-stone-700">
            <thead className="bg-stone-100 text-stone-800 font-mono sticky top-0 border-b border-stone-200">
              <tr>
                <th className="p-2">{lang === 'tr' ? 'Pilot' : 'Driver'}</th>
                <th className="p-2">Stint 1</th>
                <th className="p-2">Pit Stop 1</th>
                <th className="p-2">Stint 2</th>
                <th className="p-2">Pit Stop 2</th>
                <th className="p-2">Stint 3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {[1, 4, 16, 44].map((driverNo) => {
                const driver = drivers.find((d) => d.driver_number === driverNo);
                const dStints = stints.filter((s) => s.driver_number === driverNo);
                const dPits = pitStops.filter((p) => p.driver_number === driverNo);

                return (
                  <tr key={driverNo} className="hover:bg-stone-50">
                    <td className="p-2 font-bold text-stone-900 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: driver?.custom_color }} />
                      #{driverNo} {driver?.name_acronym}
                    </td>
                    <td className="p-2">{dStints[0] ? `${dStints[0].compound} (${dStints[0].total_laps} ${lang === 'tr' ? 'tur' : 'laps'})` : '-'}</td>
                    <td className="p-2 text-[#c53737]">{dPits[0] ? `${lang === 'tr' ? 'Tur' : 'Lap'} ${dPits[0].lap} (${dPits[0].stop_duration}s)` : '-'}</td>
                    <td className="p-2">{dStints[1] ? `${dStints[1].compound} (${dStints[1].total_laps} ${lang === 'tr' ? 'tur' : 'laps'})` : '-'}</td>
                    <td className="p-2 text-[#c53737]">{dPits[1] ? `${lang === 'tr' ? 'Tur' : 'Lap'} ${dPits[1].lap} (${dPits[1].stop_duration}s)` : '-'}</td>
                    <td className="p-2">{dStints[2] ? `${dStints[2].compound} (${dStints[2].total_laps} ${lang === 'tr' ? 'tur' : 'laps'})` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-stone-200 flex items-start gap-2 text-xs text-stone-500">
        <Info className="w-4 h-4 text-[#c53737] shrink-0 mt-0.5" />
        <p className="leading-relaxed font-normal">{summarySentence}</p>
      </div>
    </div>
  );
};
