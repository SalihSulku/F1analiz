import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table, Info, LineChart } from 'lucide-react';
import { Driver, LapData } from '../../types/f1';

export const LapComparisonChart: React.FC = () => {
  const {
    lang,
    data,
    selectedDriverNumbers,
    toggleDriverSelection,
    setSelectedDriverNumbers,
  } = useApp();

  const [showTable, setShowTable] = useState(false);
  const [hoveredLap, setHoveredLap] = useState<number | null>(null);

  const drivers = data?.drivers || [];
  const allLaps = data?.laps || [];
  const totalLaps = data?.session.total_laps || 58;

  // Selected driver objects
  const selectedDrivers: Driver[] = useMemo(() => {
    return drivers.filter((d) => selectedDriverNumbers.includes(d.driver_number));
  }, [drivers, selectedDriverNumbers]);

  // Calculations for each selected driver (laps, median, raw laps)
  const driverAnalysisMap = useMemo(() => {
    const map = new Map<number, {
      driver: Driver;
      medianTime: number;
      rawLaps: LapData[];
    }>();

    selectedDrivers.forEach((driver) => {
      const rawLaps = allLaps.filter((l) => l.driver_number === driver.driver_number);
      const durations = rawLaps.map((l) => l.lap_duration).filter((d) => typeof d === 'number' && d > 0);
      durations.sort((a, b) => a - b);
      const medianTime = durations.length > 0 ? durations[Math.floor(durations.length / 2)] : 92.5;
      map.set(driver.driver_number, { driver, medianTime, rawLaps });
    });

    return map;
  }, [selectedDrivers, allLaps]);

  // Combined lap comparison array for chart rendering (pure, uninterrupted lap times)
  const comparisonData = useMemo(() => {
    const lapsArray: Array<{
      lap: number;
      times: Record<number, number | undefined>;
    }> = [];

    for (let lap = 1; lap <= totalLaps; lap++) {
      const times: Record<number, number | undefined> = {};

      selectedDrivers.forEach((driver) => {
        const item = driverAnalysisMap.get(driver.driver_number);
        if (!item) return;

        const lapData = item.rawLaps.find((l) => l.lap_number === lap);
        if (lapData) {
          times[driver.driver_number] = lapData.lap_duration;
        }
      });

      lapsArray.push({ lap, times });
    }

    return lapsArray;
  }, [selectedDrivers, driverAnalysisMap, totalLaps]);

  // Quick selection presets
  const selectTop3 = () => setSelectedDriverNumbers([1, 4, 16]); // VER, NOR, LEC
  const selectTop5 = () => setSelectedDriverNumbers([1, 4, 16, 81, 55]);
  const selectAll = () => setSelectedDriverNumbers(drivers.map((d) => d.driver_number));

  // SVG Chart bounds
  const validTimes = comparisonData.flatMap((d) => Object.values(d.times).filter((t): t is number => typeof t === 'number'));
  const minTime = validTimes.length ? Math.floor(Math.min(...validTimes) - 0.5) : 90;
  const maxTime = validTimes.length ? Math.ceil(Math.max(...validTimes) + 0.5) : 98;

  const width = 820;
  const height = 290;
  const padding = { top: 20, right: 30, bottom: 35, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (lap: number) => padding.left + ((lap - 1) / (totalLaps - 1)) * chartW;
  const getY = (time: number) => padding.top + ((time - minTime) / (maxTime - minTime)) * chartH;

  // Build SVG path for a given driver
  const getDriverPath = (driverNo: number) => {
    let pathStr = '';
    let inSegment = false;

    comparisonData.forEach((pt) => {
      const val = pt.times[driverNo];
      if (typeof val === 'number') {
        const x = getX(pt.lap);
        const y = getY(val);
        if (!inSegment) {
          pathStr += `M ${x} ${y}`;
          inSegment = true;
        } else {
          pathStr += ` L ${x} ${y}`;
        }
      } else {
        inSegment = false;
      }
    });
    return pathStr;
  };

  // Find overall fastest median driver among selected
  const fastestSelected = useMemo<{ acronym: string; median: number } | null>(() => {
    let best: { acronym: string; median: number } | null = null;
    selectedDrivers.forEach((d) => {
      const item = driverAnalysisMap.get(d.driver_number);
      if (item) {
        if (!best || item.medianTime < best.median) {
          best = { acronym: d.name_acronym, median: item.medianTime };
        }
      }
    });
    return best;
  }, [selectedDrivers, driverAnalysisMap]);

  const fastestText = fastestSelected
    ? `${fastestSelected.acronym} (medyan: ${fastestSelected.median.toFixed(2)}s)`
    : '';

  const summarySentence = lang === 'tr'
    ? `Özet: Seçilen ${selectedDrivers.length} pilot arasında ${fastestText} en istikrarlı ve hızlı yarış temposuna sahip olmuştur.`
    : `Summary: Across ${selectedDrivers.length} selected drivers, ${fastestText} demonstrated the most consistent race pace.`;

  // Sampled laps for X-axis labels
  const axisLaps = useMemo(() => {
    const list = [1];
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      list.push(Math.round((i / steps) * totalLaps));
    }
    list.push(totalLaps);
    return Array.from(new Set(list)).sort((a, b) => a - b);
  }, [totalLaps]);

  return (
    <div className="rounded-none border border-stone-200 bg-white p-5 sm:p-6 shadow-sm relative">
      {/* Category Tag */}
      <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737] mb-1">
        {lang === 'tr' ? 'TELEMETRİ & YARIŞ TEMPOSU' : 'TELEMETRY & RACE PACE'}
      </div>

      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            {lang === 'tr' ? 'Çoklu Pilot Tur Süresi Karşılaştırması' : 'Multi-Driver Lap Time Comparison'}
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            {lang === 'tr'
              ? 'Birden fazla pilot seçerek tur bazında saf yarış tempolarını ve tur sürelerini tek bir grafikte karşılaştırın.'
              : 'Select multiple drivers to benchmark race pace and lap durations on a single telemetry canvas.'}
          </p>
        </div>

        {/* View toggle button */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTable(!showTable)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs border font-medium transition ${
              showTable
                ? 'bg-[#c53737] text-white border-[#c53737] font-semibold'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            {showTable ? <LineChart className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
            <span>{showTable ? (lang === 'tr' ? 'Grafik Görünümü' : 'Chart View') : (lang === 'tr' ? 'Tablo Görünümü' : 'Table View')}</span>
          </button>
        </div>
      </div>

      {/* MULTI-SELECT DRIVER CHIPS */}
      <div className="mb-4 p-3 rounded-none bg-stone-50 border border-stone-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-semibold text-stone-700 flex items-center gap-1">
            <span>{lang === 'tr' ? 'Grafikte Karşılaştırılacak Pilotlar:' : 'Select Drivers to Compare:'}</span>
            <span className="text-stone-400 font-mono">({selectedDriverNumbers.length} seçili)</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <button
              onClick={selectTop3}
              className="text-[#c53737] hover:underline"
            >
              Podyum (İlk 3)
            </button>
            <span className="text-stone-300">|</span>
            <button
              onClick={selectTop5}
              className="text-stone-600 hover:text-stone-900"
            >
              İlk 5
            </button>
            <span className="text-stone-300">|</span>
            <button
              onClick={selectAll}
              className="text-stone-600 hover:text-stone-900"
            >
              Tümünü Seç
            </button>
          </div>
        </div>

        {/* Driver Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {drivers.map((drv) => {
            const isSelected = selectedDriverNumbers.includes(drv.driver_number);
            const item = driverAnalysisMap.get(drv.driver_number);
            return (
              <button
                key={drv.driver_number}
                onClick={() => toggleDriverSelection(drv.driver_number)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-none text-xs font-mono font-medium border transition ${
                  isSelected
                    ? 'bg-white border-stone-400 text-stone-900 shadow-sm font-bold ring-1 ring-stone-300'
                    : 'bg-stone-100 border-stone-200 text-stone-500 hover:border-stone-300'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-none"
                  style={{ backgroundColor: drv.custom_color }}
                />
                <span>#{drv.driver_number} {drv.name_acronym}</span>
                {isSelected && (
                  <span className="text-[10px] text-stone-400 font-normal">
                    {item ? `${item.medianTime.toFixed(1)}s` : ''}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Canvas Multi-Line Graph */}
      {!showTable ? (
        <div className="relative overflow-x-auto bg-stone-50/50 rounded-none p-2 border border-stone-100">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            {/* Horizontal Grid Lines */}
            {[minTime, (minTime + maxTime) / 2, maxTime].map((t) => (
              <g key={t}>
                <line
                  x1={padding.left}
                  y1={getY(t)}
                  x2={width - padding.right}
                  y2={getY(t)}
                  stroke="#e2e4e8"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={getY(t) + 4}
                  fill="#71717a"
                  fontSize="10"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {t.toFixed(1)}s
                </text>
              </g>
            ))}

            {/* X-Axis Laps */}
            {axisLaps.map((lap) => (
              <g key={lap}>
                <line
                  x1={getX(lap)}
                  y1={height - padding.bottom}
                  x2={getX(lap)}
                  y2={height - padding.bottom + 5}
                  stroke="#cbd5e1"
                />
                <text
                  x={getX(lap)}
                  y={height - padding.bottom + 18}
                  fill="#71717a"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  Tur {lap}
                </text>
              </g>
            ))}

            {/* Render lines for all selected drivers */}
            {selectedDrivers.map((driver) => {
              const path = getDriverPath(driver.driver_number);
              return (
                <path
                  key={driver.driver_number}
                  d={path}
                  fill="none"
                  stroke={driver.custom_color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Interactive Hit Areas & Circles */}
            {comparisonData.map((pt) => {
              const isHovered = hoveredLap === pt.lap;
              return (
                <g
                  key={pt.lap}
                  onMouseEnter={() => setHoveredLap(pt.lap)}
                  onMouseLeave={() => setHoveredLap(null)}
                  className="cursor-pointer"
                >
                  {/* Invisible Hit Area */}
                  <rect
                    x={getX(pt.lap) - 4}
                    y={padding.top}
                    width={8}
                    height={chartH}
                    fill="transparent"
                  />

                  {/* Vertical dashed guideline when hovered */}
                  {isHovered && (
                    <line
                      x1={getX(pt.lap)}
                      y1={padding.top}
                      x2={getX(pt.lap)}
                      y2={height - padding.bottom}
                      stroke="#c53737"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                  )}

                  {/* Points for each selected driver on this lap */}
                  {selectedDrivers.map((driver) => {
                    const time = pt.times[driver.driver_number];
                    if (typeof time !== 'number') return null;
                    return (
                      <circle
                        key={driver.driver_number}
                        cx={getX(pt.lap)}
                        cy={getY(time)}
                        r={isHovered ? 4.5 : 2}
                        fill={driver.custom_color}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Box */}
          {hoveredLap && (
            <div className="absolute top-2 right-4 bg-stone-900 text-white rounded-none p-3 text-xs shadow-xl pointer-events-none border border-stone-800 z-10">
              <div className="font-bold text-[#fca5a5] font-mono mb-1.5">Tur #{hoveredLap} Detayı</div>
              <div className="space-y-1">
                {selectedDrivers.map((drv) => {
                  const pt = comparisonData.find((p) => p.lap === hoveredLap);
                  const time = pt?.times[drv.driver_number];
                  return (
                    <div key={drv.driver_number} className="flex items-center justify-between gap-4 font-mono">
                      <span className="flex items-center gap-1.5 text-stone-300">
                        <span className="w-2 h-2 rounded-none" style={{ backgroundColor: drv.custom_color }} />
                        {drv.name_acronym}:
                      </span>
                      <strong className="text-white">
                        {typeof time === 'number' ? `${time.toFixed(3)}s` : '-'}
                      </strong>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="max-h-72 overflow-y-auto border border-stone-200 rounded-none">
          <table className="w-full text-xs text-left text-stone-700">
            <thead className="bg-stone-100 text-stone-800 font-mono sticky top-0 border-b border-stone-200">
              <tr>
                <th className="p-2">Tur</th>
                {selectedDrivers.map((drv) => (
                  <th key={drv.driver_number} className="p-2">
                    {drv.name_acronym} Süre
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {comparisonData.slice(0, 35).map((pt) => (
                <tr key={pt.lap} className="hover:bg-stone-50">
                  <td className="p-2 font-bold text-stone-900">Tur {pt.lap}</td>
                  {selectedDrivers.map((drv) => {
                    const time = pt.times[drv.driver_number];
                    return (
                      <td key={drv.driver_number} className="p-2">
                        {typeof time === 'number' ? `${time.toFixed(3)}s` : '-'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Sentence */}
      <div className="mt-3 pt-3 border-t border-stone-200 flex items-start gap-2 text-xs text-stone-500">
        <Info className="w-4 h-4 text-[#c53737] shrink-0 mt-0.5" />
        <p className="leading-relaxed font-normal">{summarySentence}</p>
      </div>
    </div>
  );
};
