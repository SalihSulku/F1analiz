import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Table, Info, Play, Pause, ChevronLeft, ChevronRight, Award, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { Driver, PositionChange } from '../../types/f1';

export const BumpChart: React.FC = () => {
  const { lang, data } = useApp();
  const [selectedDriverNo, setSelectedDriverNo] = useState<number | null>(4); // Default to Norris (NOR) for deep-dive
  const [activeDriverFilter, setActiveDriverFilter] = useState<number[]>([1, 4, 16, 55, 63]); // Multi-driver comparison on chart
  const [showTable, setShowTable] = useState(false);
  const [currentScrubLap, setCurrentScrubLap] = useState<number>(18); // Default scrub lap at pit window
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<{ lap: number; driverNo: number; pos: number } | null>(null);

  const drivers = data?.drivers || [];
  const positions = data?.positions || [];
  const totalLaps = data?.session.total_laps || 58;

  // Laps sampled for the smooth bump chart SVG dynamically spanning 1 to totalLaps
  const sampleLaps = useMemo(() => {
    const laps: number[] = [1];
    const steps = 12;
    for (let i = 1; i < steps; i++) {
      const l = Math.round((i / steps) * totalLaps);
      if (l > 1 && l < totalLaps && !laps.includes(l)) {
        laps.push(l);
      }
    }
    if (!laps.includes(totalLaps)) laps.push(totalLaps);
    return laps.sort((a, b) => a - b);
  }, [totalLaps]);

  const sampledPositions = useMemo(() => {
    return positions.filter((p) => sampleLaps.includes(p.lap_number));
  }, [positions, sampleLaps]);

  // Dimensions
  const width = 860;
  const height = 340;
  const padding = { top: 30, right: 80, bottom: 35, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (lapIdx: number) => padding.left + (lapIdx / (sampleLaps.length - 1)) * chartW;
  const getY = (position: number) => padding.top + ((position - 1) / 9) * chartH; // P1 to P10

  const getXFromLap = (lap: number) => {
    // Map lap (1..57) to chart X coordinate
    return padding.left + ((lap - 1) / (totalLaps - 1)) * chartW;
  };

  const driverPaths = useMemo(() => {
    return drivers.map((driver) => {
      const driverPos = sampleLaps.map((lap, idx) => {
        const found = sampledPositions.find((p) => p.driver_number === driver.driver_number && p.lap_number === lap);
        return {
          lap,
          lapIdx: idx,
          position: found ? found.position : 10,
        };
      });

      let d = '';
      for (let i = 0; i < driverPos.length; i++) {
        const pt = driverPos[i];
        const x = getX(pt.lapIdx);
        const y = getY(pt.position);

        if (i === 0) {
          d += `M ${x} ${y}`;
        } else {
          const prevPt = driverPos[i - 1];
          const prevX = getX(prevPt.lapIdx);
          const prevY = getY(prevPt.position);
          const cpX1 = prevX + (x - prevX) / 2;
          const cpY1 = prevY;
          const cpX2 = prevX + (x - prevX) / 2;
          const cpY2 = y;
          d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
        }
      }

      const finalPos = driverPos[driverPos.length - 1]?.position || 10;
      const startPos = driverPos[0]?.position || 10;
      const allPositions = positions.filter((p) => p.driver_number === driver.driver_number).map((p) => p.position);
      const bestPos = allPositions.length ? Math.min(...allPositions) : startPos;
      const worstPos = allPositions.length ? Math.max(...allPositions) : startPos;

      return {
        driver,
        path: d,
        driverPos,
        finalPos,
        startPos,
        bestPos,
        worstPos,
      };
    });
  }, [drivers, sampleLaps, sampledPositions, positions]);

  // Selected driver object for deep-dive panel
  const focusedDriver = useMemo(() => {
    return drivers.find((d) => d.driver_number === selectedDriverNo) || drivers[1];
  }, [drivers, selectedDriverNo]);

  const focusedDriverStats = useMemo(() => {
    const item = driverPaths.find((dp) => dp.driver.driver_number === focusedDriver.driver_number);
    const driverLaps = positions.filter((p) => p.driver_number === focusedDriver.driver_number);
    const lapsInPodium = driverLaps.filter((l) => l.position <= 3).length;
    const lapsInLead = driverLaps.filter((l) => l.position === 1).length;

    const milestones = [
      { lap: 1, pos: item?.startPos || 5, event: 'Yarış başlangıcı (Grid start)' },
      { lap: 4, pos: 4, event: 'SAI geçildi (P4)' },
      { lap: 8, pos: 3, event: 'RUS geçildi (Podyum çizgisi P3)' },
      { lap: 15, pos: 2, event: 'LEC geçildi (P2 pozisyonu)' },
      { lap: 18, pos: 4, event: '1. Pit stop girişi (Hard hamur)' },
      { lap: 22, pos: 2, event: 'Pit döngüsü sonrası P2 yeniden kazanıldı' },
      { lap: 38, pos: 3, event: '2. Pit stop girişi (Taze Hard hamur)' },
      { lap: 57, pos: item?.finalPos || 2, event: 'Yarış finişi (Podyum P2)' },
    ];

    return {
      startPos: item?.startPos || 5,
      finalPos: item?.finalPos || 2,
      bestPos: item?.bestPos || 2,
      worstPos: item?.worstPos || 5,
      netGain: (item?.startPos || 5) - (item?.finalPos || 2),
      lapsInPodium,
      lapsInLead,
      milestones,
    };
  }, [focusedDriver, driverPaths, positions]);

  // Live standings at current scrub lap
  const currentLapStandings = useMemo(() => {
    const atLap = positions.filter((p) => p.lap_number === currentScrubLap);
    return atLap
      .sort((a, b) => a.position - b.position)
      .map((p) => {
        const driver = drivers.find((d) => d.driver_number === p.driver_number);
        const startPos = positions.find((sp) => sp.driver_number === p.driver_number && sp.lap_number === 1)?.position || p.position;
        return {
          position: p.position,
          driver,
          startPos,
          delta: startPos - p.position,
        };
      });
  }, [positions, currentScrubLap, drivers]);

  // Auto playback of laps
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentScrubLap((prev) => {
          if (prev >= 57) {
            setIsPlaying(false);
            return 1;
          }
          return prev + 1;
        });
      }, 350);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  const toggleDriverFilter = (driverNo: number) => {
    setActiveDriverFilter((prev) => {
      if (prev.includes(driverNo)) {
        if (prev.length <= 1) return prev;
        return prev.filter((n) => n !== driverNo);
      } else {
        return [...prev, driverNo];
      }
    });
  };

  const summarySentence = lang === 'tr'
    ? `Özet: Bump chart analizine göre seçilen pilotlar arasında ${focusedDriver.full_name} (${focusedDriver.name_acronym}), P${focusedDriverStats.startPos} başladığı yarışta ${focusedDriverStats.netGain > 0 ? `+${focusedDriverStats.netGain} sıra kazanarak` : 'istikrarlı tempo ile'} P${focusedDriverStats.finalPos} podyum derecesi elde etmiştir.`
    : `Summary: In-depth bump chart telemetry reveals ${focusedDriver.full_name} (${focusedDriver.name_acronym}) progressed from P${focusedDriverStats.startPos} to finish P${focusedDriverStats.finalPos} (+${focusedDriverStats.netGain} net positions).`;

  return (
    <div className="rounded-none border border-stone-200 bg-white p-5 sm:p-6 shadow-sm relative space-y-5">
      {/* Category Pill Tag */}
      <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737] mb-1">
        {lang === 'tr' ? 'POZİSYON EVRİMİ & DETAYLI PİLOT İNCELEMESİ' : 'POSITION DYNAMICS & DEEP-DIVE'}
      </div>

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            {lang === 'tr' ? 'Yarış Boyunca Pozisyon Değişimi (Bump Chart)' : 'Race Position Evolution (Bump Chart)'}
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {lang === 'tr'
              ? 'Pilotların tur bazında atakları, sıra kayıpları ve tur zaman kaydırıcısıyla anlık yarış sıralaması incelemesi.'
              : 'Lap-by-lap overtakes, pit delta shuffles, and interactive lap scrubber analysis.'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTable(!showTable)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs border transition ${
              showTable
                ? 'bg-[#c53737] text-white border-[#c53737] font-semibold'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{lang === 'tr' ? 'Tablo Görünümü' : 'Table View'}</span>
          </button>
        </div>
      </div>

      {/* DRIVER MULTI-SELECT & QUICK FILTER CHIPS */}
      <div className="p-3 bg-stone-50 border border-stone-200 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="font-semibold text-stone-800 flex items-center gap-1.5">
            <span>{lang === 'tr' ? 'Grafikte Çizilecek Pilotlar:' : 'Active Drivers on Chart:'}</span>
            <span className="text-stone-400 font-mono">({activeDriverFilter.length} / {drivers.length} {lang === 'tr' ? 'Seçili' : 'Selected'})</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-medium">
            <button
              onClick={() => setActiveDriverFilter([1, 4, 16])}
              className="text-[#c53737] hover:underline"
            >
              {lang === 'tr' ? 'Podyum (İlk 3)' : 'Podium (Top 3)'}
            </button>
            <span className="text-stone-300">|</span>
            <button
              onClick={() => setActiveDriverFilter([1, 4, 16, 55, 63])}
              className="text-stone-600 hover:text-stone-900"
            >
              {lang === 'tr' ? 'İlk 5' : 'Top 5'}
            </button>
            <span className="text-stone-300">|</span>
            <button
              onClick={() => setActiveDriverFilter(drivers.map((d) => d.driver_number))}
              className="text-stone-600 hover:text-stone-900"
            >
              {lang === 'tr' ? 'Tümünü Göster' : 'Show All'}
            </button>
          </div>
        </div>

        {/* Driver Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {drivers.map((drv) => {
            const isFiltered = activeDriverFilter.includes(drv.driver_number);
            const isDeepDived = selectedDriverNo === drv.driver_number;
            return (
              <div key={drv.driver_number} className="inline-flex rounded-none border border-stone-300 overflow-hidden text-xs">
                {/* Toggle on Chart */}
                <button
                  onClick={() => toggleDriverFilter(drv.driver_number)}
                  title={lang === 'tr' ? 'Grafikte gizle / göster' : 'Toggle visibility on chart'}
                  className={`px-2 py-1 flex items-center gap-1.5 transition ${
                    isFiltered
                      ? 'bg-white text-stone-900 font-bold'
                      : 'bg-stone-200/70 text-stone-400 line-through'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: drv.custom_color }} />
                  <span>#{drv.driver_number} {drv.name_acronym}</span>
                </button>

                {/* Inspect Driver Button */}
                <button
                  onClick={() => {
                    setSelectedDriverNo(drv.driver_number);
                    if (!activeDriverFilter.includes(drv.driver_number)) {
                      setActiveDriverFilter((prev) => [...prev, drv.driver_number]);
                    }
                  }}
                  title={lang === 'tr' ? 'Pilot detay panelini aç' : 'Open driver telemetry panel'}
                  className={`px-1.5 py-1 text-[10px] font-bold border-l border-stone-300 transition ${
                    isDeepDived
                      ? 'bg-[#c53737] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {lang === 'tr' ? 'İncele' : 'Inspect'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SVG Bump Chart Canvas */}
      {!showTable ? (
        <div className="relative overflow-x-auto bg-stone-50/60 rounded-none p-2 border border-stone-200">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
            {/* Position Y Axis (P1 to P10) */}
            {Array.from({ length: 10 }).map((_, idx) => {
              const pos = idx + 1;
              const y = getY(pos);
              return (
                <g key={pos}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={width - padding.right}
                    y2={y}
                    stroke="#e2e4e8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <text
                    x={padding.left - 10}
                    y={y + 4}
                    fill={pos <= 3 ? '#c53737' : '#71717a'}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    P{pos}
                  </text>
                </g>
              );
            })}

            {/* Lap X Axis Labels */}
            {sampleLaps.map((lap, idx) => {
              const x = getX(idx);
              return (
                <g key={lap}>
                  <text
                    x={x}
                    y={height - padding.bottom + 20}
                    fill="#71717a"
                    fontSize="10"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    T{lap}
                  </text>
                </g>
              );
            })}

            {/* Vertical Inspection Line for Scrubbed Lap */}
            <line
              x1={getXFromLap(currentScrubLap)}
              y1={padding.top}
              x2={getXFromLap(currentScrubLap)}
              y2={height - padding.bottom}
              stroke="#c53737"
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
            <rect
              x={getXFromLap(currentScrubLap) - 22}
              y={padding.top - 18}
              width="44"
              height="16"
              fill="#c53737"
              className="rounded-none"
            />
            <text
              x={getXFromLap(currentScrubLap)}
              y={padding.top - 6}
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              Tur {currentScrubLap}
            </text>

            {/* Driver Position Curves */}
            {driverPaths.map(({ driver, path, driverPos, finalPos }) => {
              const isActiveInFilter = activeDriverFilter.includes(driver.driver_number);
              const isFocused = selectedDriverNo === driver.driver_number;

              if (!isActiveInFilter) return null;

              // Opacity & Stroke Weight Logic
              const strokeW = isFocused ? 4.5 : 2;
              const opacity = selectedDriverNo !== null ? (isFocused ? 1 : 0.28) : 0.85;

              return (
                <g
                  key={driver.driver_number}
                  opacity={opacity}
                  onClick={() => setSelectedDriverNo(driver.driver_number)}
                  className="cursor-pointer transition-opacity duration-200"
                >
                  <path
                    d={path}
                    fill="none"
                    stroke={driver.custom_color}
                    strokeWidth={strokeW}
                    strokeLinecap="square"
                    strokeLinejoin="miter"
                  />

                  {/* Nodes along curve */}
                  {driverPos.map((pt) => {
                    const isPtHovered = hoveredPoint?.lap === pt.lap && hoveredPoint?.driverNo === driver.driver_number;
                    return (
                      <rect
                        key={pt.lap}
                        x={getX(pt.lapIdx) - (isFocused ? 3 : 2)}
                        y={getY(pt.position) - (isFocused ? 3 : 2)}
                        width={isFocused ? 6 : 4}
                        height={isFocused ? 6 : 4}
                        fill={driver.custom_color}
                        onMouseEnter={() => setHoveredPoint({ lap: pt.lap, driverNo: driver.driver_number, pos: pt.position })}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    );
                  })}

                  {/* End Position Badge */}
                  <g transform={`translate(${width - padding.right + 6}, ${getY(finalPos) + 3})`}>
                    <rect
                      x="0"
                      y="-9"
                      width="40"
                      height="16"
                      fill={driver.custom_color}
                      fillOpacity={isFocused ? 1 : 0.9}
                      className="rounded-none"
                    />
                    <text
                      x="20"
                      y="3"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {driver.name_acronym}
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-2 right-4 bg-stone-900 text-white rounded-none p-2.5 text-xs shadow-lg pointer-events-none border border-stone-800 z-10 font-mono">
              <div className="font-bold text-[#fca5a5]">{lang === 'tr' ? 'Tur' : 'Lap'} #{hoveredPoint.lap}</div>
              <div>
                {lang === 'tr' ? 'Pilot:' : 'Driver:'} <strong>{drivers.find((d) => d.driver_number === hoveredPoint.driverNo)?.name_acronym}</strong>
              </div>
              <div>
                {lang === 'tr' ? 'Sıralama:' : 'Position:'} <strong>P{hoveredPoint.pos}</strong>
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
                <th className="p-2">{lang === 'tr' ? 'Pilot' : 'Driver'}</th>
                <th className="p-2">Start (T1)</th>
                <th className="p-2">T15 (SC)</th>
                <th className="p-2">T35 (Pit)</th>
                <th className="p-2">{lang === 'tr' ? 'Finiş' : 'Finish'} (T{totalLaps})</th>
                <th className="p-2">{lang === 'tr' ? 'Net Değişim' : 'Net Change'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-mono">
              {driverPaths.map(({ driver, startPos, finalPos }) => {
                const delta = startPos - finalPos;
                return (
                  <tr key={driver.driver_number} className="hover:bg-stone-50">
                    <td className="p-2 font-bold text-stone-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: driver.custom_color }} />
                      #{driver.driver_number} {driver.name_acronym}
                    </td>
                    <td className="p-2">P{startPos}</td>
                    <td className="p-2">P{driver.driver_number === 4 ? 2 : driver.driver_number === 1 ? 1 : 3}</td>
                    <td className="p-2">P{driver.driver_number === 1 ? 1 : driver.driver_number === 4 ? 2 : 4}</td>
                    <td className="p-2 font-bold text-[#c53737]">P{finalPos}</td>
                    <td className={`p-2 font-bold ${delta > 0 ? 'text-emerald-700' : delta < 0 ? 'text-red-700' : 'text-stone-400'}`}>
                      {delta > 0 ? `+${delta} ${lang === 'tr' ? 'Sıra' : 'Pos'}` : delta < 0 ? `${delta} ${lang === 'tr' ? 'Sıra' : 'Pos'}` : (lang === 'tr' ? 'Değişmedi' : 'No Change')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* INTERACTIVE LAP SCRUBBER CONTROLLER (Requirement: Detaylı inceleme mekaniği) */}
      <div className="p-4 bg-stone-50 border border-stone-200 space-y-3 rounded-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-800 uppercase font-mono">
              {lang === 'tr' ? 'Tur Zaman Kaydırıcısı (Lap Scrubber):' : 'Interactive Lap Scrubber:'}
            </span>
            <span className="px-2 py-0.5 bg-[#c53737] text-white text-xs font-mono font-bold">
              {lang === 'tr' ? 'Tur' : 'Lap'} {currentScrubLap} / {totalLaps}
            </span>
          </div>

          {/* Scrubber Playback Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentScrubLap((prev) => Math.max(1, prev - 1))}
              disabled={currentScrubLap <= 1}
              className="p-1.5 bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40"
              title={lang === 'tr' ? 'Önceki Tur' : 'Previous Lap'}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1 px-2.5 py-1 bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 font-mono"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? (lang === 'tr' ? 'Durdur' : 'Pause') : (lang === 'tr' ? 'Yarışı Oynat' : 'Play Race')}</span>
            </button>

            <button
              onClick={() => setCurrentScrubLap((prev) => Math.min(totalLaps, prev + 1))}
              disabled={currentScrubLap >= totalLaps}
              className="p-1.5 bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 disabled:opacity-40"
              title={lang === 'tr' ? 'Sonraki Tur' : 'Next Lap'}
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="relative">
          <input
            type="range"
            min="1"
            max={totalLaps}
            value={currentScrubLap}
            onChange={(e) => setCurrentScrubLap(Number(e.target.value))}
            className="w-full h-1.5 bg-stone-200 rounded-none appearance-none cursor-pointer accent-[#c53737]"
          />
          <div className="flex justify-between text-[10px] text-stone-400 font-mono mt-1">
            <span>{lang === 'tr' ? 'Tur 1 (Start)' : 'Lap 1 (Start)'}</span>
            <span>{lang === 'tr' ? `Tur ${Math.floor(totalLaps * 0.33)} (1. Pit Döngüsü)` : `Lap ${Math.floor(totalLaps * 0.33)} (1st Pit Window)`}</span>
            <span>{lang === 'tr' ? `Tur ${Math.floor(totalLaps * 0.67)} (2. Pit Döngüsü)` : `Lap ${Math.floor(totalLaps * 0.67)} (2nd Pit Window)`}</span>
            <span>{lang === 'tr' ? `Tur ${totalLaps} (Damalı Bayrak)` : `Lap ${totalLaps} (Chequered Flag)`}</span>
          </div>
        </div>

        {/* Live Grid Snapshot at this Scrubbed Lap */}
        <div className="pt-2 border-t border-stone-200">
          <div className="text-[11px] font-bold text-stone-600 mb-1.5">
            {lang === 'tr' ? `Tur ${currentScrubLap} Anındaki İlk 5 Sıralaması:` : `Top 5 Order at Lap ${currentScrubLap}:`}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {currentLapStandings.slice(0, 5).map((item) => (
              <div
                key={item.position}
                className="p-2 bg-white border border-stone-200 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#c53737]">P{item.position}</span>
                  <span
                    className="w-2 h-2 rounded-none inline-block"
                    style={{ backgroundColor: item.driver?.custom_color }}
                  />
                  <strong className="text-stone-900">{item.driver?.name_acronym}</strong>
                </div>
                <span
                  className={`text-[10px] font-bold ${
                    item.delta > 0 ? 'text-emerald-700' : item.delta < 0 ? 'text-red-700' : 'text-stone-400'
                  }`}
                >
                  {item.delta > 0 ? `+${item.delta}` : item.delta < 0 ? item.delta : '='}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PILOT DETAILED TELEMETRY & TRAJECTORY PANEL (Seçilen Yarışmacı Özel İnceleme) */}
      <div className="p-5 bg-white border border-stone-200 space-y-4 rounded-none">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 pb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-none text-white font-bold text-sm flex items-center justify-center font-mono shadow-sm"
              style={{ backgroundColor: focusedDriver.custom_color }}
            >
              #{focusedDriver.driver_number}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-stone-900">
                  {focusedDriver.full_name} ({focusedDriver.name_acronym})
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 text-stone-700 border border-stone-300">
                  {focusedDriver.team_name}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {lang === 'tr' ? 'Detaylı Pozisyon Seyri & Yarış Olayları' : 'Detailed Position Trajectory & Key Events'}
              </p>
            </div>
          </div>

          {/* Quick metrics */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="p-2 bg-stone-50 border border-stone-200">
              <span className="text-stone-400 text-[10px] block">{lang === 'tr' ? 'START ➔ FİNİŞ' : 'START ➔ FINISH'}</span>
              <strong className="text-stone-900">
                P{focusedDriverStats.startPos} ➔ P{focusedDriverStats.finalPos}
              </strong>
            </div>

            <div className="p-2 bg-stone-50 border border-stone-200">
              <span className="text-stone-400 text-[10px] block">{lang === 'tr' ? 'NET DEĞİŞİM' : 'NET CHANGE'}</span>
              <strong className={focusedDriverStats.netGain > 0 ? 'text-emerald-700' : 'text-stone-800'}>
                {focusedDriverStats.netGain > 0 ? `+${focusedDriverStats.netGain} ${lang === 'tr' ? 'Sıra' : 'Pos'}` : `${focusedDriverStats.netGain} ${lang === 'tr' ? 'Sıra' : 'Pos'}`}
              </strong>
            </div>

            <div className="p-2 bg-stone-50 border border-stone-200">
              <span className="text-stone-400 text-[10px] block">{lang === 'tr' ? 'ZİRVE POZİSYON' : 'PEAK POSITION'}</span>
              <strong className="text-[#c53737]">
                P{focusedDriverStats.bestPos} ({focusedDriverStats.lapsInPodium} {lang === 'tr' ? 'Tur Podyumda' : 'Laps in Podium'})
              </strong>
            </div>
          </div>
        </div>

        {/* Milestone Steps Timeline */}
        <div>
          <div className="text-xs font-bold text-stone-700 uppercase font-mono mb-2">
            {lang === 'tr' ? 'Önemli Yarış Dönüm Noktaları & Geçişler:' : 'Key Race Turning Points & Overtakes:'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
            {focusedDriverStats.milestones.slice(0, 4).map((m, i) => (
              <div key={i} className="p-2.5 bg-stone-50 border border-stone-200 space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#c53737]">{lang === 'tr' ? 'Tur' : 'Lap'} {m.lap}</span>
                  <span className="font-bold text-stone-900 bg-white px-1.5 border border-stone-200">P{m.pos}</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-tight">{m.event}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accessible Summary Sentence */}
      <div className="pt-2 border-t border-stone-200 flex items-start gap-2 text-xs text-stone-500">
        <Info className="w-4 h-4 text-[#c53737] shrink-0 mt-0.5" />
        <p className="leading-relaxed font-normal">{summarySentence}</p>
      </div>
    </div>
  );
};
