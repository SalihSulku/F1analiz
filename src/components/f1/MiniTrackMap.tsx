import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Play, Pause, RotateCcw, Compass, Gauge, Zap, Info, Table } from 'lucide-react';
import { Driver } from '../../types/f1';

// Circuit Path Geometry & Turn Definitions
interface CircuitConfig {
  name: string;
  circuitKey: string;
  lengthKm: string;
  turnsCount: number;
  svgPath: string;
  turns: Array<{ label: string; x: number; y: number }>;
  startLine: { x: number; y: number; angle?: number };
}

const CIRCUITS: Record<number, CircuitConfig> = {
  // 9662: Abu Dhabi - Yas Marina Circuit (2024 Season Finale)
  9662: {
    name: 'Yas Marina Circuit (Abu Dhabi)',
    circuitKey: 'yas_marina',
    lengthKm: '5.281 km',
    turnsCount: 16,
    svgPath: `
      M 160 360
      L 540 360
      C 580 360, 610 340, 615 300
      L 615 250
      C 615 220, 590 200, 560 195
      L 480 185
      C 455 180, 440 160, 445 135
      L 450 100
      C 455 75, 435 60, 410 60
      L 290 60
      C 265 60, 245 75, 240 100
      L 230 160
      C 225 185, 205 200, 180 195
      L 120 185
      C 95 180, 75 205, 85 230
      L 115 290
      C 125 320, 115 345, 130 355
      L 160 360
      Z
    `,
    turns: [
      { label: 'T1', x: 620, y: 320 },
      { label: 'T5', x: 570, y: 180 },
      { label: 'T6', x: 440, y: 80 },
      { label: 'T9', x: 230, y: 80 },
      { label: 'T12', x: 100, y: 210 },
      { label: 'T16', x: 140, y: 340 },
    ],
    startLine: { x: 210, y: 350 },
  },

  // 9636: Brazil - Interlagos (Autódromo José Carlos Pace)
  9636: {
    name: 'Autódromo de Interlagos (São Paulo)',
    circuitKey: 'interlagos',
    lengthKm: '4.309 km',
    turnsCount: 15,
    svgPath: `
      M 180 360
      L 460 360
      C 520 360, 570 320, 560 260
      C 550 200, 490 180, 450 190
      L 380 210
      C 340 220, 310 195, 320 160
      L 340 100
      C 350 65, 310 50, 270 55
      L 180 70
      C 130 80, 100 120, 110 170
      L 130 240
      C 140 280, 120 330, 150 355
      L 180 360
      Z
    `,
    turns: [
      { label: 'S do Senna', x: 575, y: 270 },
      { label: 'Curva do Sol', x: 470, y: 175 },
      { label: 'Descida', x: 330, y: 80 },
      { label: 'Bico de Pato', x: 110, y: 150 },
      { label: 'Junção', x: 160, y: 345 },
    ],
    startLine: { x: 240, y: 350 },
  },

  // 9558: Great Britain - Silverstone Circuit
  9558: {
    name: 'Silverstone Circuit (İngiltere)',
    circuitKey: 'silverstone',
    lengthKm: '5.891 km',
    turnsCount: 18,
    svgPath: `
      M 160 340
      L 520 340
      C 560 340, 595 315, 600 275
      C 605 235, 575 210, 535 210
      L 460 210
      C 425 210, 400 180, 410 145
      L 430 90
      C 440 60, 410 45, 375 55
      L 270 85
      C 235 95, 215 125, 220 160
      L 230 200
      C 235 230, 210 255, 180 250
      L 110 240
      C 80 235, 65 265, 80 295
      L 120 335
      C 135 345, 150 340, 160 340
      Z
    `,
    turns: [
      { label: 'Abbey', x: 610, y: 290 },
      { label: 'Copse', x: 550, y: 195 },
      { label: 'Maggotts', x: 430, y: 70 },
      { label: 'Becketts', x: 360, y: 45 },
      { label: 'Stowe', x: 210, y: 180 },
      { label: 'Club', x: 100, y: 260 },
    ],
    startLine: { x: 230, y: 330 },
  },

  // 9472: Bahrain - Sakhir Circuit
  9472: {
    name: 'Bahrain International Circuit (Sakhir)',
    circuitKey: 'sakhir',
    lengthKm: '5.412 km',
    turnsCount: 15,
    svgPath: `
      M 140 370
      L 520 370
      C 560 370, 590 355, 600 325
      C 605 310, 595 290, 575 285
      L 510 275
      C 490 270, 480 250, 490 230
      L 535 155
      C 545 140, 535 125, 515 125
      L 410 125
      C 385 125, 370 140, 365 160
      L 355 200
      C 350 215, 335 225, 320 220
      L 270 205
      C 255 200, 245 185, 250 170
      L 265 130
      C 275 105, 255 85, 230 85
      L 170 85
      C 145 85, 125 100, 115 125
      L 95 180
      C 85 210, 105 240, 135 245
      L 230 260
      C 250 265, 260 280, 250 300
      L 215 340
      C 200 365, 175 370, 140 370
      Z
    `,
    turns: [
      { label: 'T1', x: 615, y: 340 },
      { label: 'T4', x: 530, y: 110 },
      { label: 'T8', x: 370, y: 220 },
      { label: 'T10', x: 250, y: 80 },
      { label: 'T14', x: 195, y: 345 },
    ],
    startLine: { x: 180, y: 360 },
  },

  // 11234: Australia - Albert Park Circuit (Melbourne, 2026 Season Opener)
  11234: {
    name: 'Albert Park Circuit (Melbourne)',
    circuitKey: 'melbourne',
    lengthKm: '5.278 km',
    turnsCount: 14,
    svgPath: `
      M 180 370
      L 500 370
      C 540 370, 570 350, 580 310
      L 580 270
      C 570 240, 530 230, 480 220
      L 450 200
      C 420 180, 410 140, 430 100
      L 440 70
      C 440 45, 410 40, 370 45
      L 290 60
      C 260 70, 240 100, 230 140
      L 200 230
      C 190 260, 160 280, 130 290
      L 100 305
      C 80 320, 95 360, 130 368
      L 180 370
      Z
    `,
    turns: [
      { label: 'Jones (T1)', x: 590, y: 320 },
      { label: 'Whiteford (T3)', x: 490, y: 220 },
      { label: 'Lakeside (T6)', x: 440, y: 80 },
      { label: 'Clark (T9)', x: 280, y: 55 },
      { label: 'Waite (T11)', x: 210, y: 150 },
      { label: 'Ascari (T12)', x: 110, y: 300 },
    ],
    startLine: { x: 230, y: 360 },
  },
};

// Dynamic circuit selector resolving known tracks or falling back seamlessly
const getCircuitConfig = (sessionKey: number, sessionName?: string, circuitShortName?: string): CircuitConfig => {
  if (CIRCUITS[sessionKey]) return CIRCUITS[sessionKey];
  const q = `${sessionName || ''} ${circuitShortName || ''}`.toLowerCase();
  if (q.includes('melbourne') || q.includes('albert') || q.includes('australia')) return CIRCUITS[11234];
  if (q.includes('bahrain') || q.includes('sakhir')) return CIRCUITS[9472];
  if (q.includes('silverstone') || q.includes('britain')) return CIRCUITS[9558];
  if (q.includes('interlagos') || q.includes('brazil') || q.includes('paulo')) return CIRCUITS[9636];
  if (q.includes('yas marina') || q.includes('abu dhabi')) return CIRCUITS[9662];

  // Dynamic Grand Prix representation
  return {
    name: circuitShortName || 'Grand Prix Circuit',
    circuitKey: 'dynamic_gp',
    lengthKm: '5.278 km',
    turnsCount: 14,
    svgPath: CIRCUITS[11234].svgPath,
    turns: CIRCUITS[11234].turns,
    startLine: CIRCUITS[11234].startLine,
  };
};

export const MiniTrackMap: React.FC = () => {
  const { lang, data, selectedSessionKey } = useApp();
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [simTime, setSimTime] = useState<number>(14);
  const [selectedDriverNo, setSelectedDriverNo] = useState<number>(4); // NOR (Winner/Podium)
  const [showTable, setShowTable] = useState<boolean>(false);

  // Active Circuit Config dynamically resolved
  const activeCircuit = useMemo(() => {
    return getCircuitConfig(selectedSessionKey, data?.session.session_name, data?.session.circuit_short_name);
  }, [selectedSessionKey, data?.session]);

  // Pre-cached static coordinates lookup table to avoid synchronous SVG reflows during mouse movement
  const pathRef = useRef<SVGPathElement | null>(null);
  const [cachedPoints, setCachedPoints] = useState<Array<{ x: number; y: number }>>([]);

  const drivers = data?.drivers || [];
  const lapDurationSec = 90.0;

  // Measure and pre-sample 600 static (x, y) coordinates whenever the circuit changes.
  // This completely eliminates calling path.getPointAtLength() on render, fixing the mouse hover freeze!
  useEffect(() => {
    if (pathRef.current) {
      const len = pathRef.current.getTotalLength();
      const numSamples = 600;
      const pts: Array<{ x: number; y: number }> = [];

      for (let i = 0; i < numSamples; i++) {
        const pt = pathRef.current.getPointAtLength((i / numSamples) * len);
        pts.push({ x: Math.round(pt.x * 10) / 10, y: Math.round(pt.y * 10) / 10 });
      }
      setCachedPoints(pts);
    }
  }, [activeCircuit.svgPath]);

  // Animation Loop decoupled from heavy DOM reflows
  useEffect(() => {
    let animFrame: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      if (isPlaying) {
        setSimTime((prev) => (prev + delta * playbackSpeed * 2.2) % lapDurationSec);
      }
      animFrame = requestAnimationFrame(loop);
    };

    animFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrame);
  }, [isPlaying, playbackSpeed, lapDurationSec]);

  // Car telemetries calculated purely mathematically without SVG calls
  const carsTelemetry = useMemo(() => {
    const offsets: Record<number, { offset: number; rank: number; gap: string }> = {
      4: { offset: 0.0, rank: 1, gap: 'LİDER' }, // NOR
      1: { offset: -0.025, rank: 2, gap: '+1.45s' }, // VER
      16: { offset: -0.052, rank: 3, gap: '+3.10s' }, // LEC
      55: { offset: -0.078, rank: 4, gap: '+5.20s' }, // SAI
      81: { offset: -0.105, rank: 5, gap: '+7.40s' }, // PIA
      63: { offset: -0.135, rank: 6, gap: '+9.80s' }, // RUS
      44: { offset: -0.165, rank: 7, gap: '+12.10s' }, // HAM
      14: { offset: -0.200, rank: 8, gap: '+15.60s' }, // ALO
    };

    return drivers.slice(0, 8).map((driver) => {
      const meta = offsets[driver.driver_number] || { offset: -0.25, rank: 9, gap: '+20s' };
      const progress = ((simTime / lapDurationSec) + meta.offset + 10) % 1;

      // Realistic speed and telemetry based on track location
      let speed = 250;
      let gear = 6;
      let throttle = 90;
      let brake = 0;
      let drs = false;
      let sector: 1 | 2 | 3 = 1;

      if (progress < 0.28) {
        speed = 325 + Math.sin(progress * 25) * 12;
        gear = 8;
        throttle = 100;
        drs = true;
        sector = 1;
      } else if (progress < 0.45) {
        speed = 105 + Math.sin(progress * 20) * 35;
        gear = 3;
        throttle = 40;
        brake = 80;
        drs = false;
        sector = 1;
      } else if (progress < 0.70) {
        speed = 285 + Math.cos(progress * 15) * 20;
        gear = 7;
        throttle = 95;
        drs = true;
        sector = 2;
      } else if (progress < 0.88) {
        speed = 145 + Math.sin(progress * 18) * 40;
        gear = 4;
        throttle = 65;
        brake = 35;
        drs = false;
        sector = 2;
      } else {
        speed = 305 + Math.sin(progress * 20) * 15;
        gear = 8;
        throttle = 100;
        drs = false;
        sector = 3;
      }

      return {
        driver,
        progress,
        speedKmh: Math.round(speed),
        gear,
        throttlePct: throttle,
        brakePct: brake,
        drsActive: drs,
        currentSector: sector,
        raceRank: meta.rank,
        gapToLeader: meta.gap,
      };
    });
  }, [drivers, simTime, lapDurationSec]);

  // Instant O(1) position lookup from cachedPoints (No layout reflow on mousemove!)
  const getPositionFromCache = (progress: number) => {
    if (cachedPoints.length === 0) return { x: 300, y: 350 };
    const idx = Math.floor(progress * cachedPoints.length) % cachedPoints.length;
    return cachedPoints[idx] || cachedPoints[0];
  };

  const activeCar = carsTelemetry.find((c) => c.driver.driver_number === selectedDriverNo) || carsTelemetry[0];

  const summarySentence = lang === 'tr'
    ? `Özet: ${activeCircuit.name} pistinde seçili ${activeCar?.driver.full_name} (${activeCar?.driver.name_acronym}), Sektör ${activeCar?.currentSector}'te ${activeCar?.speedKmh} km/sa hız ve ${activeCar?.gear}. viteste yarışmaktadır.`
    : `Summary: On ${activeCircuit.name}, ${activeCar?.driver.full_name} (${activeCar?.driver.name_acronym}) is tracked in Sector ${activeCar?.currentSector} at ${activeCar?.speedKmh} km/h in Gear ${activeCar?.gear}.`;

  return (
    <div className="rounded-none border border-stone-200 bg-white p-5 sm:p-6 shadow-sm relative space-y-5">
      {/* Category Tag */}
      <div className="text-[11px] font-bold tracking-wider uppercase text-[#c53737] mb-1">
        {lang === 'tr' ? 'CANLI PİST TELEMETRİSİ & YARIŞ SEÇİCİ' : 'LIVE TRACK TELEMETRY & RACE SELECTOR'}
      </div>

      {/* Header Bar with Grand Prix Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#c53737]" />
            <span>{lang === 'tr' ? 'Etkileşimli Mini Pist Haritası' : 'Interactive Mini Track Map'}</span>
            <span className="text-xs font-mono font-bold text-stone-500">({activeCircuit.name})</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            {lang === 'tr'
              ? 'OpenF1 veri tabanıyla senkronize canlı araç konumları ve telemetri göstergesi.'
              : 'Synchronized vehicle GPS positions and live telemetry HUD.'}
          </p>
        </div>

        {/* Controls: Play/Pause, Speed, Reset */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 px-2.5 py-1 text-xs font-mono text-stone-700">
            <span className="w-2 h-2 bg-emerald-500 rounded-none inline-block animate-pulse" />
            <span className="font-bold text-stone-900">{data?.session.circuit_short_name || activeCircuit.name}</span>
            <span className="text-stone-400">({activeCircuit.lengthKm})</span>
          </div>

          {/* Play / Pause Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white text-xs font-mono font-bold hover:bg-stone-800 transition rounded-none"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Durdur' : 'Oynat'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center border border-stone-300 bg-stone-50 text-xs font-mono">
            {[1, 2, 4].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 font-bold transition ${
                  playbackSpeed === spd
                    ? 'bg-[#c53737] text-white'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={() => setSimTime(0)}
            className="p-1.5 border border-stone-300 bg-stone-50 text-stone-600 hover:text-stone-900"
            title="Turu Başa Al"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Table Alternative */}
          <button
            onClick={() => setShowTable(!showTable)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border transition ${
              showTable
                ? 'bg-[#c53737] text-white border-[#c53737] font-semibold'
                : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>{lang === 'tr' ? 'Tablo' : 'Table'}</span>
          </button>
        </div>
      </div>

      {/* DRIVER CHIPS */}
      <div className="p-3 bg-stone-50 border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-semibold text-stone-700">
          {lang === 'tr' ? 'Pistte Odaklanılacak Pilotu Seç:' : 'Focus Driver on Track:'}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {carsTelemetry.map((car) => {
            const isSelected = selectedDriverNo === car.driver.driver_number;
            return (
              <button
                key={car.driver.driver_number}
                onClick={() => setSelectedDriverNo(car.driver.driver_number)}
                className={`flex items-center gap-1.5 px-2.5 py-1 font-mono text-xs font-medium border transition ${
                  isSelected
                    ? 'bg-stone-900 text-white border-stone-900 font-bold shadow-sm'
                    : 'bg-white text-stone-700 border-stone-200 hover:border-stone-300'
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-none"
                  style={{ backgroundColor: car.driver.custom_color }}
                />
                <span>P{car.raceRank} {car.driver.name_acronym}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!showTable ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* SVG TRACK MAP */}
          <div className="lg:col-span-2 relative bg-stone-50/70 border border-stone-200 p-3 flex items-center justify-center min-h-[360px]">
            {/* Sector Legends in Track Map Corner */}
            <div className="absolute top-3 left-3 bg-white/95 border border-stone-200 p-2 text-[10px] font-mono text-stone-600 space-y-1 shadow-sm z-10 pointer-events-none">
              <div className="font-bold text-stone-800 uppercase">{activeCircuit.name}</div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-blue-500 rounded-none inline-block" /> {lang === 'tr' ? 'Sektör 1 (Hız & T1-T3)' : 'Sector 1 (Speed & T1-T3)'}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-none inline-block" /> {lang === 'tr' ? 'Sektör 2 (Teknik Bölge)' : 'Sector 2 (Technical Section)'}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-amber-500 rounded-none inline-block" /> {lang === 'tr' ? 'Sektör 3 (Finiş Düzlüğü)' : 'Sector 3 (Finish Straight)'}
              </div>
              <div className="flex items-center gap-1.5 text-red-600 font-bold">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-none inline-block" /> {lang === 'tr' ? 'DRS Algılama Noktası' : 'DRS Detection Point'}
              </div>
            </div>

            {/* Circuit SVG Graphic */}
            <svg viewBox="0 0 700 420" className="w-full h-auto select-none max-h-[380px]">
              {/* Outer Asphalt Outline */}
              <path
                d={activeCircuit.svgPath}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="22"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Main Asphalt Track Surface */}
              <path
                d={activeCircuit.svgPath}
                fill="none"
                stroke="#334155"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Reference path for mount pre-sampling (invisible) */}
              <path
                ref={pathRef}
                d={activeCircuit.svgPath}
                fill="none"
                stroke="transparent"
                strokeWidth="1"
              />

              {/* Start / Finish Line */}
              <g transform={`translate(${activeCircuit.startLine.x}, ${activeCircuit.startLine.y})`}>
                <line x1="0" y1="0" x2="0" y2="20" stroke="#ffffff" strokeWidth="4" />
                <rect x="-4" y="-12" width="28" height="12" fill="#c53737" className="rounded-none" />
                <text x="10" y="-3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  START
                </text>
              </g>

              {/* Corner Turn Labels (Sleek minimalist F1 Apex Badges) */}
              {activeCircuit.turns.map((c) => {
                const badgeWidth = Math.max(22, c.label.length * 6.2 + 8);
                const badgeHeight = 14;
                return (
                  <g key={c.label} className="pointer-events-none select-none">
                    {/* Tiny Apex Pinpoint Dot on Asphalt */}
                    <circle cx={c.x} cy={c.y} r="2.5" fill="#c53737" stroke="#ffffff" strokeWidth="0.75" />
                    {/* Badge Container */}
                    <rect
                      x={c.x - badgeWidth / 2}
                      y={c.y - 18}
                      width={badgeWidth}
                      height={badgeHeight}
                      fill="#18181b"
                      stroke="#52525b"
                      strokeWidth="0.75"
                      className="rounded-none shadow-sm"
                    />
                    {/* Connecting Apex Tick */}
                    <line
                      x1={c.x}
                      y1={c.y - 4}
                      x2={c.x}
                      y2={c.y}
                      stroke="#c53737"
                      strokeWidth="1"
                    />
                    {/* Badge Text */}
                    <text
                      x={c.x}
                      y={c.y - 8}
                      fill="#f4f4f5"
                      fontSize="7.5"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                      letterSpacing="0.04em"
                    >
                      {c.label}
                    </text>
                  </g>
                );
              })}

              {/* Car Markers Moving Smoothly (No CSS transitions fighting rendering) */}
              {carsTelemetry.map((car) => {
                const coords = getPositionFromCache(car.progress);
                const isSelected = selectedDriverNo === car.driver.driver_number;

                return (
                  <g
                    key={car.driver.driver_number}
                    transform={`translate(${coords.x}, ${coords.y})`}
                    onClick={() => setSelectedDriverNo(car.driver.driver_number)}
                    className="cursor-pointer"
                  >
                    {/* Selected Radar Highlight Ring */}
                    {isSelected && (
                      <circle
                        cx="0"
                        cy="0"
                        r="14"
                        fill="none"
                        stroke="#c53737"
                        strokeWidth="2"
                        strokeDasharray="2 2"
                      />
                    )}

                    {/* Sharp Rectangular Car Token */}
                    <rect
                      x="-14"
                      y="-8"
                      width="28"
                      height="16"
                      fill={car.driver.custom_color}
                      stroke={isSelected ? '#ffffff' : '#1e293b'}
                      strokeWidth={isSelected ? '2' : '1'}
                      className="rounded-none shadow"
                    />

                    {/* Driver Acronym */}
                    <text
                      x="0"
                      y="3.5"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {car.driver.name_acronym}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* TELEMETRY HUD */}
          <div className="bg-stone-50 border border-stone-200 p-4 space-y-4 font-mono text-xs">
            {/* Selected Driver Banner */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-none"
                  style={{ backgroundColor: activeCar.driver.custom_color }}
                />
                <div>
                  <h3 className="font-bold text-sm text-stone-900">
                    #{activeCar.driver.driver_number} {activeCar.driver.full_name}
                  </h3>
                  <div className="text-[10px] text-stone-500">
                    {activeCar.driver.name_acronym} · {activeCar.driver.team_name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="px-2 py-0.5 bg-[#c53737] text-white font-bold text-xs inline-block">
                  P{activeCar.raceRank}
                </span>
                <div className="text-[10px] text-stone-500 mt-0.5">{activeCar.gapToLeader}</div>
              </div>
            </div>

            {/* Speed & Gear Gauge */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white border border-stone-200 text-center">
                <div className="text-[10px] text-stone-400 font-bold uppercase flex items-center justify-center gap-1">
                  <Gauge className="w-3 h-3 text-[#c53737]" /> {lang === 'tr' ? 'HIZ' : 'SPEED'}
                </div>
                <div className="text-2xl font-bold text-stone-900 mt-1">
                  {activeCar.speedKmh} <span className="text-xs text-stone-500 font-normal">{lang === 'tr' ? 'km/sa' : 'km/h'}</span>
                </div>
              </div>

              <div className="p-3 bg-white border border-stone-200 text-center">
                <div className="text-[10px] text-stone-400 font-bold uppercase flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500" /> {lang === 'tr' ? 'VİTES' : 'GEAR'}
                </div>
                <div className="text-2xl font-bold text-stone-900 mt-1">
                  {activeCar.gear} <span className="text-xs text-stone-500 font-normal">{lang === 'tr' ? '. Vites' : 'th Gear'}</span>
                </div>
              </div>
            </div>

            {/* Throttle and Brake Bars */}
            <div className="space-y-2 bg-white p-3 border border-stone-200">
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-emerald-700 font-bold">{lang === 'tr' ? 'Gaz (Throttle):' : 'Throttle:'}</span>
                  <span className="font-bold text-stone-800">%{activeCar.throttlePct}</span>
                </div>
                <div className="h-2 bg-stone-100 border border-stone-200 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${activeCar.throttlePct}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-red-700 font-bold">{lang === 'tr' ? 'Fren (Brake):' : 'Brake:'}</span>
                  <span className="font-bold text-stone-800">%{activeCar.brakePct}</span>
                </div>
                <div className="h-2 bg-stone-100 border border-stone-200 overflow-hidden">
                  <div
                    className="h-full bg-red-500"
                    style={{ width: `${activeCar.brakePct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* DRS & Sector Status */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-white border border-stone-200 flex items-center justify-between">
                <span className="text-stone-500">DRS:</span>
                <span
                  className={`px-1.5 py-0.5 font-bold ${
                    activeCar.drsActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {activeCar.drsActive ? (lang === 'tr' ? 'AKTİF' : 'ACTIVE') : (lang === 'tr' ? 'KAPALI' : 'OFF')}
                </span>
              </div>

              <div className="p-2.5 bg-white border border-stone-200 flex items-center justify-between">
                <span className="text-stone-500">{lang === 'tr' ? 'Sektör:' : 'Sector:'}</span>
                <span className="font-bold text-[#c53737] bg-red-50 px-2 py-0.5 border border-red-200">
                  {lang === 'tr' ? 'Sektör' : 'Sector'} {activeCar.currentSector}
                </span>
              </div>
            </div>

            {/* Circuit Metadata */}
            <div className="p-2.5 bg-stone-100 border border-stone-200 text-[10px] text-stone-600 space-y-1">
              <div className="font-bold text-stone-800">{activeCircuit.name} {lang === 'tr' ? 'Bilgileri:' : 'Specifications:'}</div>
              <div>{lang === 'tr' ? 'Uzunluk:' : 'Length:'} <strong>{activeCircuit.lengthKm}</strong> · {activeCircuit.turnsCount} {lang === 'tr' ? 'Viraj' : 'Turns'}</div>
              <div>OpenF1 {lang === 'tr' ? 'Sezon:' : 'Season:'} <strong>{lang === 'tr' ? 'F1 Dünya Şampiyonası' : 'F1 World Championship'}</strong></div>
            </div>
          </div>
        </div>
      ) : (
        /* Accessible Table Alternative */
        <div className="max-h-72 overflow-y-auto border border-stone-200 rounded-none">
          <table className="w-full text-xs text-left text-stone-700 font-mono">
            <thead className="bg-stone-100 text-stone-800 sticky top-0 border-b border-stone-200">
              <tr>
                <th className="p-2">{lang === 'tr' ? 'Sıra' : 'Pos'}</th>
                <th className="p-2">{lang === 'tr' ? 'Pilot' : 'Driver'}</th>
                <th className="p-2">{lang === 'tr' ? 'Takım' : 'Team'}</th>
                <th className="p-2">{lang === 'tr' ? 'Anlık Hız' : 'Speed'}</th>
                <th className="p-2">{lang === 'tr' ? 'Vites' : 'Gear'}</th>
                <th className="p-2">{lang === 'tr' ? 'Sektör' : 'Sector'}</th>
                <th className="p-2">DRS</th>
                <th className="p-2">{lang === 'tr' ? 'Lidere Fark' : 'Gap to Leader'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {carsTelemetry.map((car) => (
                <tr key={car.driver.driver_number} className="hover:bg-stone-50">
                  <td className="p-2 font-bold text-[#c53737]">P{car.raceRank}</td>
                  <td className="p-2 font-bold text-stone-900 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-none" style={{ backgroundColor: car.driver.custom_color }} />
                    #{car.driver.driver_number} {car.driver.name_acronym}
                  </td>
                  <td className="p-2 text-stone-600">{car.driver.team_name}</td>
                  <td className="p-2 font-bold text-stone-800">{car.speedKmh} {lang === 'tr' ? 'km/sa' : 'km/h'}</td>
                  <td className="p-2">{car.gear}{lang === 'tr' ? '. Vites' : 'th'}</td>
                  <td className="p-2">{lang === 'tr' ? 'Sektör' : 'Sector'} {car.currentSector}</td>
                  <td className="p-2">{car.drsActive ? (lang === 'tr' ? 'AKTİF' : 'ACTIVE') : (lang === 'tr' ? 'KAPALI' : 'OFF')}</td>
                  <td className="p-2 text-stone-700">{car.gapToLeader}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Accessible Summary Sentence */}
      <div className="pt-2 border-t border-stone-200 flex items-start gap-2 text-xs text-stone-500">
        <Info className="w-4 h-4 text-[#c53737] shrink-0 mt-0.5" />
        <p className="leading-relaxed font-normal">{summarySentence}</p>
      </div>
    </div>
  );
};
