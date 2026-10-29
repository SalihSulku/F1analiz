import { Driver, LapData, PitStop, PositionChange, RaceSession, Stint, StrideThreat } from '../types/f1';
import rawOpenF1Sessions from './openF1Sessions.json';

export const DRIVERS: Driver[] = [
  { driver_number: 1, name_acronym: 'VER', broadcast_name: 'M. VERSTAPPEN', full_name: 'Max Verstappen', team_name: 'RB Racing', custom_color: '#3B82F6' },
  { driver_number: 4, name_acronym: 'NOR', broadcast_name: 'L. NORRIS', full_name: 'Lando Norris', team_name: 'Papaya Speed', custom_color: '#F97316' },
  { driver_number: 16, name_acronym: 'LEC', broadcast_name: 'C. LECLERC', full_name: 'Charles Leclerc', team_name: 'Maranello Corse', custom_color: '#EF4444' },
  { driver_number: 81, name_acronym: 'PIA', broadcast_name: 'O. PIASTRI', full_name: 'Oscar Piastri', team_name: 'Papaya Speed', custom_color: '#FB923C' },
  { driver_number: 55, name_acronym: 'SAI', broadcast_name: 'C. SAINZ', full_name: 'Carlos Sainz', team_name: 'Maranello Corse', custom_color: '#DC2626' },
  { driver_number: 44, name_acronym: 'HAM', broadcast_name: 'L. HAMILTON', full_name: 'Lewis Hamilton', team_name: 'Silver Arrows', custom_color: '#06B6D4' },
  { driver_number: 63, name_acronym: 'RUS', broadcast_name: 'G. RUSSELL', full_name: 'George Russell', team_name: 'Silver Arrows', custom_color: '#0EA5E9' },
  { driver_number: 14, name_acronym: 'ALO', broadcast_name: 'F. ALONSO', full_name: 'Fernando Alonso', team_name: 'Emerald GP', custom_color: '#10B981' },
  { driver_number: 22, name_acronym: 'TSU', broadcast_name: 'Y. TSUNODA', full_name: 'Yuki Tsunoda', team_name: 'Faenza Tech', custom_color: '#6366F1' },
  { driver_number: 27, name_acronym: 'HUL', broadcast_name: 'N. HULKENBERG', full_name: 'Nico Hülkenberg', team_name: 'Kanon Racing', custom_color: '#EC4899' },
];

export function getTrackBaseSeconds(circuitName: string, circuitLen: string): number {
  const c = (circuitName || '').toLowerCase();
  if (c.includes('spielberg') || c.includes('austria') || c.includes('red bull')) return 66.2;
  if (c.includes('interlagos') || c.includes('brazil') || c.includes('paulo')) return 71.4;
  if (c.includes('zandvoort')) return 71.8;
  if (c.includes('monaco') || c.includes('monte')) return 73.4;
  if (c.includes('montreal') || c.includes('canada')) return 73.1;
  if (c.includes('imola') || c.includes('enzo')) return 75.8;
  if (c.includes('hungaroring')) return 77.2;
  if (c.includes('melbourne') || c.includes('albert')) return 78.4;
  if (c.includes('mexico') || c.includes('rodriguez')) return 78.9;
  if (c.includes('monza')) return 81.3;
  if (c.includes('lusail') || c.includes('qatar')) return 83.7;
  if (c.includes('yas marina') || c.includes('abu dhabi')) return 85.2;
  if (c.includes('shanghai')) return 85.8;
  if (c.includes('austin') || c.includes('cota') || c.includes('americas')) return 86.4;
  if (c.includes('miami')) return 88.2;
  if (c.includes('silverstone')) return 88.6;
  if (c.includes('jeddah')) return 88.9;
  if (c.includes('suzuka')) return 90.7;
  if (c.includes('singapore') || c.includes('marina bay')) return 92.1;
  if (c.includes('bahrain') || c.includes('sakhir')) return 92.6;
  if (c.includes('vegas')) return 93.1;
  if (c.includes('baku')) return 93.8;
  if (c.includes('spa') || c.includes('francorchamps')) return 105.8;

  const km = parseFloat(circuitLen) || 5.2;
  return km * 16.2;
}

export function formatLapTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec - Math.floor(sec)) * 1000);
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

export const ALL_OPENF1_SESSIONS: RaceSession[] = (rawOpenF1Sessions as Array<{
  session_key: number;
  session_name: string;
  circuit_short_name: string;
  country_name: string;
  year: number;
  date: string;
  location?: string;
}>).map((s) => {
  let laps = 57;
  let len = '5.412 km';
  const cName = (s.circuit_short_name || '').toLowerCase();

  if (cName.includes('spa')) { laps = 44; len = '7.004 km'; }
  else if (cName.includes('monaco') || cName.includes('monte')) { laps = 78; len = '3.337 km'; }
  else if (cName.includes('interlagos') || cName.includes('brazil') || cName.includes('paulo')) { laps = 71; len = '4.309 km'; }
  else if (cName.includes('silverstone')) { laps = 52; len = '5.891 km'; }
  else if (cName.includes('monza')) { laps = 53; len = '5.793 km'; }
  else if (cName.includes('yas marina') || cName.includes('abu dhabi')) { laps = 58; len = '5.281 km'; }
  else if (cName.includes('melbourne') || cName.includes('albert')) { laps = 58; len = '5.278 km'; }
  else if (cName.includes('suzuka')) { laps = 53; len = '5.807 km'; }
  else if (cName.includes('shanghai')) { laps = 56; len = '5.451 km'; }
  else if (cName.includes('vegas')) { laps = 50; len = '6.201 km'; }
  else if (cName.includes('spielberg') || cName.includes('austria')) { laps = 71; len = '4.318 km'; }
  else if (cName.includes('hungaroring')) { laps = 70; len = '4.381 km'; }
  else if (cName.includes('zandvoort')) { laps = 72; len = '4.259 km'; }
  else if (cName.includes('baku')) { laps = 51; len = '6.003 km'; }
  else if (cName.includes('singapore') || cName.includes('marina')) { laps = 62; len = '4.940 km'; }
  else if (cName.includes('austin')) { laps = 56; len = '5.513 km'; }
  else if (cName.includes('mexico')) { laps = 71; len = '4.304 km'; }
  else if (cName.includes('lusail') || cName.includes('qatar')) { laps = 57; len = '5.419 km'; }
  else if (cName.includes('jeddah')) { laps = 50; len = '6.174 km'; }
  else if (cName.includes('miami')) { laps = 57; len = '5.412 km'; }
  else if (cName.includes('montreal') || cName.includes('canada')) { laps = 70; len = '4.361 km'; }
  else if (cName.includes('imola')) { laps = 63; len = '4.909 km'; }

  const seed = Math.abs((s.session_key * 1337) ^ (s.year * 7919));
  const baseSec = getTrackBaseSeconds(s.circuit_short_name, len);

  // Fastest lap driver selection among top contenders
  const driverCandidates = [4, 1, 16, 81, 63, 44, 55]; // NOR, VER, LEC, PIA, RUS, HAM, SAI
  const fastestDriverNo = driverCandidates[seed % driverCandidates.length];
  const fastestDriver = DRIVERS.find((d) => d.driver_number === fastestDriverNo) || DRIVERS[1];
  const fastestSec = baseSec - 0.75 - ((seed % 75) / 100);
  const fastestLapNum = Math.min(laps - 3, Math.max(12, Math.floor(laps * 0.72) + (seed % 7)));

  // Fastest pit stop crew
  const pitCandidates = ['NOR', 'VER', 'LEC', 'PIA', 'RUS', 'HAM'];
  const pitDriver = pitCandidates[(seed >> 3) % pitCandidates.length];
  const pitDuration = Number((1.92 + ((seed * 7) % 36) / 100).toFixed(2));
  const pitLap = Math.floor(laps * 0.34) + ((seed * 11) % 5);

  return {
    session_key: s.session_key,
    session_name: `${s.country_name} Grand Prix (${s.circuit_short_name})`,
    circuit_short_name: s.circuit_short_name,
    country_name: s.country_name,
    year: s.year,
    date: s.date,
    location: s.location || s.circuit_short_name,
    total_laps: laps,
    circuit_length: len,
    fastest_lap: {
      driver_acronym: fastestDriver.name_acronym,
      driver_number: fastestDriver.driver_number,
      lap_time: formatLapTime(fastestSec),
      lap_number: fastestLapNum,
    },
    fastest_pit: {
      driver_acronym: pitDriver,
      duration: pitDuration,
      lap: pitLap,
    },
  };
});

export const CURRENT_SESSION: RaceSession =
  ALL_OPENF1_SESSIONS.find((s) => s.session_key === 11234) ||
  ALL_OPENF1_SESSIONS.find((s) => s.year === 2026) ||
  ALL_OPENF1_SESSIONS[0];

export const AVAILABLE_SESSIONS = ALL_OPENF1_SESSIONS;


export function generateRaceDataForSession(session: RaceSession): {
  laps: LapData[];
  positions: PositionChange[];
  pitStops: PitStop[];
  stints: Stint[];
} {
  const totalLaps = session.total_laps;
  const baseSec = getTrackBaseSeconds(session.circuit_short_name, session.circuit_length || '5.3 km');
  const seed = Math.abs((session.session_key * 2654435761) ^ (session.year * 1013904223));

  // Pseudo-random deterministic generator
  let state = seed;
  const rand = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };

  const driversList = [1, 4, 16, 81, 55, 44, 63, 14, 22, 27];

  // 1. DYNAMIC STARTING GRID
  // Determine starting positions based on seed (e.g. pole can be NOR, VER, LEC, etc.)
  const driverPaces: Record<number, number> = {
    1: -0.35 + (rand() * 0.2 - 0.1),
    4: -0.32 + (rand() * 0.2 - 0.1),
    16: -0.28 + (rand() * 0.2 - 0.1),
    81: -0.20 + (rand() * 0.2 - 0.1),
    55: -0.15 + (rand() * 0.2 - 0.1),
    44: -0.12 + (rand() * 0.2 - 0.1),
    63: -0.10 + (rand() * 0.2 - 0.1),
    14: 0.10 + (rand() * 0.2 - 0.1),
    22: 0.25 + (rand() * 0.2 - 0.1),
    27: 0.35 + (rand() * 0.2 - 0.1),
  };

  // Starting grid arrangement:
  let currentOrder = [...driversList].sort((a, b) => {
    const rA = driverPaces[a] + ((a * seed) % 7) * 0.1;
    const rB = driverPaces[b] + ((b * seed) % 7) * 0.1;
    return rA - rB;
  });

  // Pick one driver to be the outstanding position gainer of the race
  const gainerCandidates = [4, 16, 44, 81, 14, 55, 63];
  const starGainerNo = gainerCandidates[seed % gainerCandidates.length];
  // Ensure the star gainer starts further back on the grid (e.g. P6 - P9)
  const initialGainerIdx = currentOrder.indexOf(starGainerNo);
  if (initialGainerIdx < 5) {
    const targetIdx = 6 + (seed % 3);
    const temp = currentOrder[targetIdx];
    currentOrder[targetIdx] = starGainerNo;
    currentOrder[initialGainerIdx] = temp;
  }

  // Safety Car lap window
  const hasSafetyCar = (seed % 10) > 2; // 70% chance of SC/VSC
  const scStartLap = hasSafetyCar ? Math.floor(totalLaps * 0.22) + (seed % 12) : -1;
  const scDuration = 2 + (seed % 2); // 2-3 laps

  // Pit Windows
  const pit1Lap = Math.floor(totalLaps * 0.32) + (seed % 5);
  const pit2Lap = Math.floor(totalLaps * 0.65) + (seed % 5);

  // 2. GENERATE POSITIONS (BUMP CHART)
  const positions: PositionChange[] = [];

  for (let lap = 1; lap <= totalLaps; lap++) {
    // Dynamic position battles at designated lap milestones
    if (lap === Math.floor(totalLaps * 0.15)) {
      // Star gainer begins charge
      const idx = currentOrder.indexOf(starGainerNo);
      if (idx > 2) {
        const swapWith = currentOrder[idx - 1];
        currentOrder[idx - 1] = starGainerNo;
        currentOrder[idx] = swapWith;
      }
    } else if (lap === pit1Lap) {
      // Pit stop shuffle
      const first = currentOrder[0];
      const second = currentOrder[1];
      currentOrder[0] = second;
      currentOrder[1] = first;
      // Gainer undercuts someone ahead
      const idx = currentOrder.indexOf(starGainerNo);
      if (idx > 1) {
        const swapWith = currentOrder[idx - 1];
        currentOrder[idx - 1] = starGainerNo;
        currentOrder[idx] = swapWith;
      }
    } else if (lap === Math.floor(totalLaps * 0.50)) {
      // Mid-race overtake
      const idx = currentOrder.indexOf(starGainerNo);
      if (idx > 1) {
        const swapWith = currentOrder[idx - 1];
        currentOrder[idx - 1] = starGainerNo;
        currentOrder[idx] = swapWith;
      }
    } else if (lap === pit2Lap) {
      // Second pit cycle shuffle
      const idx = currentOrder.indexOf(starGainerNo);
      if (idx > 1) {
        const swapWith = currentOrder[idx - 1];
        currentOrder[idx - 1] = starGainerNo;
        currentOrder[idx] = swapWith;
      }
    } else if (lap === Math.floor(totalLaps * 0.85)) {
      // Late race podium battle
      if (currentOrder.indexOf(starGainerNo) > 1 && (seed % 2 === 0)) {
        const idx = currentOrder.indexOf(starGainerNo);
        const swapWith = currentOrder[idx - 1];
        currentOrder[idx - 1] = starGainerNo;
        currentOrder[idx] = swapWith;
      }
    }

    currentOrder.forEach((dNo, posIdx) => {
      positions.push({
        lap_number: lap,
        driver_number: dNo,
        position: posIdx + 1,
      });
    });
  }

  // 3. GENERATE LAPS
  const laps: LapData[] = [];
  const fastestLapObj = session.fastest_lap;

  driversList.forEach((driverNo) => {
    let compound: 'SOFT' | 'MEDIUM' | 'HARD' = (seed + driverNo) % 2 === 0 ? 'MEDIUM' : 'SOFT';
    let tireAge = 1;
    const pOffset = driverPaces[driverNo] || 0;

    // Driver specific pit laps
    const dPit1 = pit1Lap + ((driverNo * 3) % 4) - 2;
    const dPit2 = pit2Lap + ((driverNo * 2) % 4) - 2;

    for (let lap = 1; lap <= totalLaps; lap++) {
      tireAge++;
      let duration = baseSec + pOffset + Math.sin(lap * 0.35 + driverNo) * 0.22 + (tireAge * 0.07);
      let isOutlier = false;
      let isPitOut = false;

      // Standing start lap 1
      if (lap === 1) {
        duration += 7.8 + ((driverNo * 7) % 15) / 10;
        isOutlier = true;
      }
      // Safety Car period
      else if (hasSafetyCar && lap >= scStartLap && lap < scStartLap + scDuration) {
        duration += 23.5 + Math.sin(driverNo) * 0.8;
        isOutlier = true;
      }
      // Pit Stop 1 (In-lap and Out-lap)
      else if (lap === dPit1) {
        duration += 22.8 + ((driverNo * 5) % 12) / 10;
        isOutlier = true;
        compound = 'HARD';
        tireAge = 1;
      } else if (lap === dPit1 + 1) {
        duration += 4.2;
        isPitOut = true;
        isOutlier = true;
      }
      // Pit Stop 2 (In-lap and Out-lap)
      else if (lap === dPit2) {
        duration += 22.4 + ((driverNo * 4) % 10) / 10;
        isOutlier = true;
        compound = driverNo === 1 ? 'SOFT' : 'MEDIUM';
        tireAge = 1;
      } else if (lap === dPit2 + 1) {
        duration += 3.9;
        isPitOut = true;
        isOutlier = true;
      }

      // Fastest lap spike
      if (fastestLapObj && fastestLapObj.driver_number === driverNo && lap === fastestLapObj.lap_number) {
        const parts = fastestLapObj.lap_time.split(':');
        const minVal = parseFloat(parts[0]) || 1;
        const secVal = parseFloat(parts[1]) || 20;
        duration = minVal * 60 + secVal;
        isOutlier = false;
      }

      const s1 = parseFloat((duration * 0.315).toFixed(3));
      const s2 = parseFloat((duration * 0.425).toFixed(3));
      const s3 = parseFloat((duration - s1 - s2).toFixed(3));

      laps.push({
        lap_number: lap,
        driver_number: driverNo,
        lap_duration: parseFloat(duration.toFixed(3)),
        is_pit_out_lap: isPitOut,
        is_outlier: isOutlier,
        sector_1: s1,
        sector_2: s2,
        sector_3: s3,
        compound,
        tire_age: tireAge,
      });
    }
  });

  // 4. PIT STOPS
  const pitStops: PitStop[] = [];
  driversList.forEach((driverNo) => {
    const dPit1 = pit1Lap + ((driverNo * 3) % 4) - 2;
    const dPit2 = pit2Lap + ((driverNo * 2) % 4) - 2;

    const stop1Dur = session.fastest_pit?.driver_acronym === DRIVERS.find((d) => d.driver_number === driverNo)?.name_acronym
      ? session.fastest_pit.duration
      : Number((2.10 + ((driverNo * 7) % 65) / 100).toFixed(2));

    pitStops.push({
      driver_number: driverNo,
      lap: dPit1,
      pit_duration: Number((stop1Dur + 19.5).toFixed(2)),
      stop_duration: stop1Dur,
      from_compound: 'SOFT',
      to_compound: 'HARD',
    });

    pitStops.push({
      driver_number: driverNo,
      lap: dPit2,
      pit_duration: Number((2.35 + 19.5).toFixed(2)),
      stop_duration: Number((2.20 + ((driverNo * 9) % 60) / 100).toFixed(2)),
      from_compound: 'HARD',
      to_compound: 'MEDIUM',
    });
  });

  // 5. STINTS
  const stints: Stint[] = [];
  driversList.slice(0, 6).forEach((driverNo) => {
    const dPit1 = pit1Lap + ((driverNo * 3) % 4) - 2;
    const dPit2 = pit2Lap + ((driverNo * 2) % 4) - 2;

    stints.push(
      { driver_number: driverNo, stint_number: 1, compound: 'SOFT', start_lap: 1, end_lap: dPit1, total_laps: dPit1 },
      { driver_number: driverNo, stint_number: 2, compound: 'HARD', start_lap: dPit1 + 1, end_lap: dPit2, total_laps: dPit2 - dPit1 },
      { driver_number: driverNo, stint_number: 3, compound: 'MEDIUM', start_lap: dPit2 + 1, end_lap: totalLaps, total_laps: totalLaps - dPit2 }
    );
  });

  return { laps, positions, pitStops, stints };
}

// Initial default sets
const defaultData = generateRaceDataForSession(CURRENT_SESSION);
export const FALLBACK_LAPS: LapData[] = defaultData.laps;
export const FALLBACK_POSITIONS: PositionChange[] = defaultData.positions;
export const FALLBACK_PIT_STOPS: PitStop[] = defaultData.pitStops;
export const FALLBACK_STINTS: Stint[] = defaultData.stints;

// STRIDE Threat Model Data
export const STRIDE_THREATS: StrideThreat[] = [
  {
    id: 'THREAT-01',
    category: 'Spoofing',
    threatDescription: 'Saldırganın OpenF1 API kimliğini taklit ederek manipüle edilmiş sahte telemetri ve tur süresi göndermesi.',
    component: 'OpenF1 Gateway',
    likelihood: 2,
    impact: 4,
    riskScore: 8,
    mitigation: 'DNS over HTTPS (DoH), TLS 1.3 zorunluluğu ve API yanıtlarının hash doğrulaması.',
    residualRisk: 'Düşük',
    isPriorityForCard: false,
  },
  {
    id: 'THREAT-02',
    category: 'Tampering',
    threatDescription: 'Yarış sırasında telemetri veri akışına aradaki adam (MitM) saldırısıyla sahte bayrak veya tur verisi enjekte edilmesi.',
    component: 'WebSocket / Telemetry Stream',
    likelihood: 2,
    impact: 4,
    riskScore: 8,
    mitigation: 'HSTS (max-age 31536000), SHA-256 bütünlük kontrolü ve JWT yetkilendirme doğrulaması.',
    residualRisk: 'Düşük',
    isPriorityForCard: false,
  },
  {
    id: 'THREAT-03',
    category: 'Repudiation',
    threatDescription: 'Yetkisiz bir istemcinin güvenlik duvarını aşarak sorgu yapması ve log kayıtlarının reddedilmesi.',
    component: 'Security Logger & Audit Trail',
    likelihood: 3,
    impact: 3,
    riskScore: 9,
    mitigation: 'Değiştirilemez (append-only) merkezi loglama, istemci IP ve User-Agent dijital zaman damgası.',
    residualRisk: 'Düşük',
    isPriorityForCard: false,
  },
  {
    id: 'THREAT-04',
    category: 'Information Disclosure',
    threatDescription: 'Hata sayfalarında yığın izi (stack trace), sunucu sürümü veya iç ağ IP adreslerinin istemciye sızması.',
    component: 'Reverse Proxy / Nginx / Express',
    likelihood: 3,
    impact: 3,
    riskScore: 9,
    mitigation: 'Özel hata sayfası mimarisi, X-Powered-By gizleme, Server başlığını temizleme.',
    residualRisk: 'Düşük',
    isPriorityForCard: false,
  },
  {
    id: 'THREAT-05',
    category: 'Denial of Service',
    threatDescription: 'İstemciden veya botnetten gelen 4xx/5xx hata fırtınası ile servisin tüketilmesi ve kaynak tükenmesi (DoS).',
    component: 'Rate Limiter & WAF',
    likelihood: 4,
    impact: 4,
    riskScore: 16,
    mitigation: 'Merkezi loglama, 5 dakikada 100+ 4xx istekte otomatik kritik alarm üreten anomali motoru ve IP rate-limiting.',
    residualRisk: 'Kabul Edilebilir',
    isPriorityForCard: true,
  },
  {
    id: 'THREAT-06',
    category: 'Elevation of Privilege',
    threatDescription: 'Normal kullanıcı oturumunun parametre manipülasyonuyla telemetri yönetim veya alarm kontrol paneline erişmesi.',
    component: 'RBAC Authorization Engine',
    likelihood: 2,
    impact: 4,
    riskScore: 8,
    mitigation: 'En az yetki (least privilege) kuralı, katı rol doğrulaması ve güvenli HTTP-only çerezler.',
    residualRisk: 'Düşük',
    isPriorityForCard: false,
  },
  {
    id: 'THREAT-07',
    category: 'Tampering',
    threatDescription: 'İstemci tarafında XSS zafiyeti üzerinden arayüze zararlı JavaScript enjeksiyonu yapılarak oturum anahtarının çalınması.',
    component: 'Frontend React DOM / CSP',
    likelihood: 3,
    impact: 3,
    riskScore: 9,
    mitigation: 'Katı Content-Security-Policy (CSP), script-src self, unsafe-inline ve unsafe-eval yasaklandı.',
    residualRisk: 'Düşük',
    isPriorityForCard: false,
  },
  {
    id: 'THREAT-08',
    category: 'Information Disclosure',
    threatDescription: 'Güvenlik araştırmacılarının bulduğu zafiyetleri bildirebileceği resmi bir temas noktasının olmaması.',
    component: 'RFC 9116 Endpoint',
    likelihood: 2,
    impact: 3,
    riskScore: 6,
    mitigation: 'RFC 9116 uyumlu /.well-known/security.txt dosyasının yayınlanması ve PGP şifreleme anahtarı.',
    residualRisk: 'Düşük',
    isPriorityForCard: false,
  },
];
