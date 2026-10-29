import React from 'react';
import { useApp } from '../../context/AppContext';
import { Timer, Gauge, TrendingUp, Trophy } from 'lucide-react';

export const KpiCards: React.FC = () => {
  const { lang, data } = useApp();

  const totalLaps = data?.session.total_laps || 58;
  const fastestLap = data?.session.fastest_lap;
  const fastestPit = data?.session.fastest_pit;

  // Calculate Net Position Gainer (Comparing start grid vs finish lap)
  const posStart = data?.positions.filter((p) => p.lap_number === 1) || [];
  const posFinish = data?.positions.filter((p) => p.lap_number === totalLaps) || [];

  let topGainer = { driver_number: 4, acronym: 'NOR', delta: 4, from: 6, to: 2 };
  if (posStart.length && posFinish.length) {
    let maxGain = -999;
    posStart.forEach((start) => {
      const finish = posFinish.find((f) => f.driver_number === start.driver_number);
      if (finish) {
        const gain = start.position - finish.position;
        if (gain > maxGain) {
          maxGain = gain;
          const driver = data?.drivers.find((d) => d.driver_number === start.driver_number);
          topGainer = {
            driver_number: start.driver_number,
            acronym: driver?.name_acronym || 'DRV',
            delta: gain,
            from: start.position,
            to: finish.position,
          };
        }
      }
    });
  }

  // Calculate fastest lap average speed from circuit length
  const circuitKm = parseFloat(data?.session.circuit_length || '5.3') || 5.278;
  const speedUnit = lang === 'tr' ? 'km/sa' : 'km/h';
  let avgSpeedStr = `228.4 ${speedUnit}`;
  if (fastestLap?.lap_time) {
    const parts = fastestLap.lap_time.split(':');
    const sec = (parseFloat(parts[0]) || 1) * 60 + (parseFloat(parts[1]) || 20);
    if (sec > 0) {
      avgSpeedStr = `${(circuitKm / (sec / 3600)).toFixed(1)} ${speedUnit}`;
    }
  }

  // Calculate Race Winner (P1 at final lap)
  const winnerPos = posFinish.find((p) => p.position === 1) || { driver_number: 1, position: 1 };
  const winnerDriver = data?.drivers.find((d) => d.driver_number === winnerPos.driver_number) || data?.drivers[0];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Fastest Lap */}
      <div className="rounded-none border border-stone-200 bg-white p-5 shadow-sm hover:border-stone-400 transition">
        <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737] mb-1 flex items-center justify-between">
          <span>{lang === 'tr' ? 'EN HIZLI TUR' : 'FASTEST LAP'}</span>
          <Timer className="w-4 h-4 text-stone-400" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-stone-900 font-mono tracking-tight">
            {fastestLap?.lap_time || '1:18.420'}
          </span>
          <span className="px-2 py-0.5 rounded-none text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300 font-mono">
            {fastestLap?.driver_acronym || 'NOR'}
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-2 flex items-center justify-between">
          <span>{lang === 'tr' ? `Tur ${fastestLap?.lap_number || 42} / ${totalLaps}` : `Lap ${fastestLap?.lap_number || 42} / ${totalLaps}`}</span>
          <span className="text-emerald-600 font-mono text-[11px] font-semibold">{avgSpeedStr}</span>
        </p>
      </div>

      {/* KPI 2: Fastest Pit Stop */}
      <div className="rounded-none border border-stone-200 bg-white p-5 shadow-sm hover:border-stone-400 transition">
        <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737] mb-1 flex items-center justify-between">
          <span>{lang === 'tr' ? 'EN HIZLI PİT STOP' : 'FASTEST PIT STOP'}</span>
          <Gauge className="w-4 h-4 text-stone-400" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-stone-900 font-mono tracking-tight">
            {fastestPit?.duration ? `${fastestPit.duration.toFixed(2)}s` : '2.04s'}
          </span>
          <span className="px-2 py-0.5 rounded-none text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300 font-mono">
            {fastestPit?.driver_acronym || 'VER'}
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-2 flex items-center justify-between">
          <span>{lang === 'tr' ? `Tur ${fastestPit?.lap || 21} Girişi` : `Lap ${fastestPit?.lap || 21} Entry`}</span>
          <span className="text-stone-600 font-mono text-[11px]">{lang === 'tr' ? 'Sert Lastik' : 'Hard Tyre'}</span>
        </p>
      </div>

      {/* KPI 3: Net Position Gainer */}
      <div className="rounded-none border border-stone-200 bg-white p-5 shadow-sm hover:border-stone-400 transition">
        <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737] mb-1 flex items-center justify-between">
          <span>{lang === 'tr' ? 'POZİSYON KAZANCI' : 'POSITION GAINER'}</span>
          <TrendingUp className="w-4 h-4 text-stone-400" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-stone-900 font-mono tracking-tight">
            {topGainer.delta > 0 ? `+${topGainer.delta}` : topGainer.delta} {lang === 'tr' ? 'Sıra' : 'Pos'}
          </span>
          <span className="px-2 py-0.5 rounded-none text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300 font-mono">
            {topGainer.acronym}
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-2 flex items-center justify-between">
          <span>{lang === 'tr' ? `Grid P${topGainer.from} ➔ Finiş P${topGainer.to}` : `Grid P${topGainer.from} ➔ Finish P${topGainer.to}`}</span>
          <span className="text-emerald-600 font-mono text-[11px] font-bold">
            {topGainer.to <= 3 ? (lang === 'tr' ? 'Podyum' : 'Podium') : (lang === 'tr' ? 'Puan Barajı' : 'Points')}
          </span>
        </p>
      </div>

      {/* KPI 4: Race Winner */}
      <div className="rounded-none border border-stone-200 bg-white p-5 shadow-sm hover:border-stone-400 transition">
        <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737] mb-1 flex items-center justify-between">
          <span>{lang === 'tr' ? 'YARIŞ KAZANANI' : 'RACE WINNER'}</span>
          <Trophy className="w-4 h-4 text-[#c53737]" />
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-2xl font-bold text-stone-900 font-mono tracking-tight">
            {lang === 'tr' ? 'P1 GALİBİYET' : 'P1 VICTORY'}
          </span>
          <span className="px-2 py-0.5 rounded-none text-xs font-bold bg-stone-100 text-stone-800 border border-stone-300 font-mono">
            {winnerDriver?.name_acronym || 'VER'}
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-2 flex items-center justify-between">
          <span className="truncate max-w-[150px] font-medium text-stone-700">{winnerDriver?.full_name}</span>
          <span className="text-[#c53737] font-mono text-[11px] font-bold truncate max-w-[110px]">{winnerDriver?.team_name}</span>
        </p>
      </div>
    </div>
  );
};
