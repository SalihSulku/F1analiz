import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, ArrowUpDown, Download } from 'lucide-react';

type SortField = 'position' | 'driver' | 'team' | 'fastestLap' | 'pitCount';

export const DriverTable: React.FC = () => {
  const { lang, data } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('position');
  const [sortAsc, setSortAsc] = useState(true);

  const drivers = data?.drivers || [];
  const laps = data?.laps || [];
  const pitStops = data?.pitStops || [];
  const positions = data?.positions || [];
  const totalLaps = data?.session.total_laps || 57;

  const driverRows = useMemo(() => {
    return drivers.map((driver) => {
      const finalPos = positions.find((p) => p.driver_number === driver.driver_number && p.lap_number === totalLaps)?.position || 10;
      const startPos = positions.find((p) => p.driver_number === driver.driver_number && p.lap_number === 1)?.position || 10;
      const dLaps = laps.filter((l) => l.driver_number === driver.driver_number);
      const fastestDuration = dLaps.length ? Math.min(...dLaps.map((l) => l.lap_duration)) : 93.0;
      const dPits = pitStops.filter((p) => p.driver_number === driver.driver_number);
      const lastLap = dLaps[dLaps.length - 1];

      const m = Math.floor(fastestDuration / 60);
      const s = Math.floor(fastestDuration % 60);
      const ms = Math.floor((fastestDuration % 1) * 1000);
      const formattedTime = `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;

      return {
        driver,
        position: finalPos,
        startPos,
        gain: startPos - finalPos,
        fastestLap: fastestDuration,
        fastestLapFormatted: formattedTime,
        pitCount: dPits.length,
        currentCompound: lastLap?.compound || 'HARD',
        tireAge: lastLap?.tire_age || 15,
      };
    });
  }, [drivers, laps, pitStops, positions, totalLaps]);

  const filteredRows = useMemo(() => {
    return driverRows.filter((row) => {
      const q = searchTerm.toLowerCase();
      return (
        row.driver.full_name.toLowerCase().includes(q) ||
        row.driver.name_acronym.toLowerCase().includes(q) ||
        row.driver.team_name.toLowerCase().includes(q)
      );
    });
  }, [driverRows, searchTerm]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      let comp = 0;
      if (sortField === 'position') comp = a.position - b.position;
      else if (sortField === 'driver') comp = a.driver.full_name.localeCompare(b.driver.full_name);
      else if (sortField === 'team') comp = a.driver.team_name.localeCompare(b.driver.team_name);
      else if (sortField === 'fastestLap') comp = a.fastestLap - b.fastestLap;
      else if (sortField === 'pitCount') comp = a.pitCount - b.pitCount;
      return sortAsc ? comp : -comp;
    });
  }, [filteredRows, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const exportCsv = () => {
    const headers = ['Pozisyon', 'No', 'Pilot', 'Takim', 'Grid_Start', 'Net_Kazanc', 'En_Hizli_Tur', 'Pit_Sayisi', 'Son_Lastik'];
    const rows = sortedRows.map((r) => [
      r.position,
      r.driver.driver_number,
      `"${r.driver.full_name} (${r.driver.name_acronym})"`,
      `"${r.driver.team_name}"`,
      r.startPos,
      r.gain,
      r.fastestLapFormatted,
      r.pitCount,
      r.currentCompound,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `f1_bahrain_telemetry_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="rounded-none border border-stone-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737] mb-1">
        {lang === 'tr' ? 'DETAYLI VERİ TABLOSU' : 'DETAILED TELEMETRY GRID'}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            {lang === 'tr' ? 'Yarış Sıralaması & Detaylı İstatistikler' : 'Race Standings & Detailed Statistics'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {lang === 'tr'
              ? 'Tüm pilotların nihai pozisyonları, en hızlı turları ve pit sayıları.'
              : 'Standings, fastest laps, pit frequencies, and CSV dataset download.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'tr' ? 'Pilot veya takım ara...' : 'Search driver or team...'}
              className="pl-8 pr-3 py-1.5 rounded-none bg-stone-50 border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#c53737] w-44 sm:w-56"
            />
          </div>

        </div>
      </div>

      {/* Sortable Table */}
      <div className="overflow-x-auto rounded-none border border-stone-200">
        <table className="w-full text-xs text-left text-stone-700">
          <thead className="bg-stone-50 text-stone-700 font-mono border-b border-stone-200">
            <tr>
              <th
                onClick={() => handleSort('position')}
                className="p-3 cursor-pointer hover:text-stone-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>{lang === 'tr' ? 'Sıra' : 'Pos'}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('driver')}
                className="p-3 cursor-pointer hover:text-stone-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>{lang === 'tr' ? 'Pilot (Kısaltma)' : 'Driver'}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('team')}
                className="p-3 cursor-pointer hover:text-stone-900 select-none hidden sm:table-cell"
              >
                <div className="flex items-center gap-1">
                  <span>{lang === 'tr' ? 'Takım / Renk' : 'Team / Color'}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3 select-none hidden md:table-cell">
                <span>{lang === 'tr' ? 'Grid ➔ Finiş' : 'Grid ➔ Finish'}</span>
              </th>
              <th
                onClick={() => handleSort('fastestLap')}
                className="p-3 cursor-pointer hover:text-stone-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>{lang === 'tr' ? 'En Hızlı Tur' : 'Best Lap'}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('pitCount')}
                className="p-3 cursor-pointer hover:text-stone-900 select-none"
              >
                <div className="flex items-center gap-1">
                  <span>{lang === 'tr' ? 'Pit' : 'Pits'}</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="p-3 select-none">
                <span>{lang === 'tr' ? 'Son Lastik' : 'Tyre'}</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 font-mono">
            {sortedRows.map((row) => (
              <tr key={row.driver.driver_number} className="hover:bg-stone-50 transition">
                <td className="p-3 font-bold text-stone-900">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-none font-bold text-xs ${
                      row.position === 1
                        ? 'bg-[#c53737] text-white'
                        : row.position === 2
                        ? 'bg-stone-200 text-stone-900'
                        : row.position === 3
                        ? 'bg-amber-100 text-amber-900'
                        : 'text-stone-500'
                    }`}
                  >
                    P{row.position}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-none shrink-0"
                      style={{ backgroundColor: row.driver.custom_color }}
                    />
                    <div>
                      <div className="font-bold text-stone-900 text-xs">{row.driver.full_name}</div>
                      <div className="text-[10px] text-stone-400">
                        #{row.driver.driver_number} · <strong>{row.driver.name_acronym}</strong>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-stone-600 hidden sm:table-cell">
                  <span className="text-xs">{row.driver.team_name}</span>
                </td>
                <td className="p-3 text-xs hidden md:table-cell">
                  <span className="text-stone-400">P{row.startPos} ➔ </span>
                  <span
                    className={`font-bold ${
                      row.gain > 0 ? 'text-emerald-600' : row.gain < 0 ? 'text-red-600' : 'text-stone-400'
                    }`}
                  >
                    {row.gain > 0 ? `+${row.gain}` : row.gain}
                  </span>
                </td>
                <td className="p-3 font-bold text-stone-800">
                  {row.fastestLapFormatted}
                </td>
                <td className="p-3 text-stone-700">
                  {row.pitCount} {lang === 'tr' ? 'Pit' : 'Pits'}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-none text-[10px] font-bold ${
                      row.currentCompound === 'SOFT'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : row.currentCompound === 'MEDIUM'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-stone-100 text-stone-700 border border-stone-200'
                    }`}
                  >
                    {row.currentCompound} ({row.tireAge}{lang === 'tr' ? 'T' : 'L'})
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
