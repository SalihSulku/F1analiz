import {
  ALL_OPENF1_SESSIONS,
  CURRENT_SESSION,
  DRIVERS,
  formatLapTime,
  generateRaceDataForSession,
} from '../data/fallbackF1Data';
import { Driver, LapData, PitStop, PositionChange, RaceSession, Stint, TireCompound } from '../types/f1';
import { securityLogger } from './securityLogger';

/** live: şimdi OpenF1'den çekildi, cache: son başarılı çekim, sample: örnek (üretilmiş) veri */
export type DataOrigin = 'live' | 'cache' | 'sample';

export interface F1ServiceResponse {
  session: RaceSession;
  drivers: Driver[];
  laps: LapData[];
  positions: PositionChange[];
  pitStops: PitStop[];
  stints: Stint[];
  isOfflineFallback: boolean;
  lastUpdated: string;
  sourceUrl: string;
  dataOrigin?: DataOrigin;
}

// OpenF1'den gelen ham kayıtlar (yalnızca kullandığımız alanlar)
interface RawDriver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  country_code: string | null;
}
interface RawLap {
  driver_number: number;
  lap_number: number;
  date_start: string | null;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean | null;
}
interface RawPit {
  driver_number: number;
  lap_number: number | null;
  pit_duration: number | null;
  stop_duration: number | null;
}
interface RawStint {
  driver_number: number;
  stint_number: number;
  lap_start: number | null;
  lap_end: number | null;
  compound: string | null;
  tyre_age_at_start: number | null;
}
interface RawPosition {
  driver_number: number;
  position: number;
  date: string;
}

const REQUEST_GAP_MS = 400; // OpenF1 ücretsiz katmanında hız sınırı var, istekleri arayla atıyoruz
const CACHE_PREFIX = 'f1_race_cache_v1_';
const COMPOUNDS: TireCompound[] = ['SOFT', 'MEDIUM', 'HARD', 'INTERMEDIATE', 'WET'];

// Pilot DRIVERS listesinde yoksa kullanılacak renkler (takım rengi KULLANILMAZ, kart kısıtı)
const SPARE_COLORS = [
  '#c53737', '#2563eb', '#059669', '#d97706', '#7c3aed',
  '#0891b2', '#be185d', '#4d7c0f', '#9a3412', '#1d4ed8',
  '#0f766e', '#a21caf', '#b45309', '#334155', '#15803d',
  '#6d28d9', '#0e7490', '#9f1239', '#a16207', '#475569',
];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// OpenF1 tarihleri mikrosaniyeli (".469000+00:00"), tarayıcıların hepsi sevmez; milisaniyeye indir
const ts = (s: string) => new Date(s.replace(/(\.\d{3})\d+/, '$1')).getTime();

const toCompound = (c: string | null | undefined): TireCompound | null => {
  const upper = (c ?? '').toUpperCase();
  return COMPOUNDS.includes(upper as TireCompound) ? (upper as TireCompound) : null;
};

const formatDateTime = (d: Date) => d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' });

class IncompleteDataError extends Error {}

class OpenF1Service {
  private baseUrl = 'https://api.openf1.org/v1';
  private forceOfflineSimulation = false;
  private queue: Promise<unknown> = Promise.resolve();
  private inFlight = new Map<number, Promise<F1ServiceResponse>>();

  public setOfflineSimulation(active: boolean) {
    this.forceOfflineSimulation = active;
    if (active) {
      securityLogger.log(
        'WARN',
        503,
        '/api/v1/network-kill-switch',
        'Demo için ağ kesintisi simüle edildi. Sistem son başarılı veriye geçti.'
      );
    } else {
      securityLogger.log('INFO', 200, '/api/v1/network-kill-switch', 'Ağ bağlantısı normale döndü.');
    }
  }

  public isOfflineSimulated(): boolean {
    return this.forceOfflineSimulation;
  }

  /**
   * Aynı anda tek istek zinciri çalışır (hız sınırı) ve aynı yarış için çalışan istek varsa onu paylaşır.
   */
  public fetchRaceData(sessionKey = 11234): Promise<F1ServiceResponse> {
    const running = this.inFlight.get(sessionKey);
    if (running) return running;

    const task = this.queue
      .then(() => this.load(sessionKey))
      .finally(() => {
        this.inFlight.delete(sessionKey);
      });
    this.inFlight.set(sessionKey, task);
    this.queue = task.catch(() => undefined);
    return task;
  }

  private async load(sessionKey: number): Promise<F1ServiceResponse> {
    const startTime = performance.now();
    const base = ALL_OPENF1_SESSIONS.find((s) => s.session_key === sessionKey) || CURRENT_SESSION;

    if (this.forceOfflineSimulation || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return this.fallback('ağ bağlantısı kapalı', base);
    }

    try {
      const q = `session_key=${sessionKey}`;
      const rawDrivers = await this.getJson<RawDriver>(`drivers?${q}`);
      await sleep(REQUEST_GAP_MS);
      const rawLaps = await this.getJson<RawLap>(`laps?${q}`);
      await sleep(REQUEST_GAP_MS);
      const rawStints = await this.getJson<RawStint>(`stints?${q}`);
      await sleep(REQUEST_GAP_MS);
      const rawPit = await this.getJson<RawPit>(`pit?${q}`);
      await sleep(REQUEST_GAP_MS);
      const rawPos = await this.getJson<RawPosition>(`position?${q}`, 30000);

      const built = this.build(base, rawDrivers, rawLaps, rawPit, rawStints, rawPos);
      const durationMs = Math.round(performance.now() - startTime);

      const result: F1ServiceResponse = {
        ...built,
        isOfflineFallback: false,
        lastUpdated: formatDateTime(new Date()),
        sourceUrl: 'https://api.openf1.org/v1',
        dataOrigin: 'live',
      };

      this.saveCache(sessionKey, result);
      securityLogger.log(
        'INFO',
        200,
        `/v1/laps?session_key=${sessionKey}`,
        `OpenF1 ${base.session_name} (${base.year}) verisi alındı: ${built.laps.length} tur, ${built.pitStops.length} pit, ${built.positions.length} pozisyon kaydı.`,
        '127.0.0.1',
        durationMs
      );
      return result;
    } catch (err: unknown) {
      const durationMs = Math.round(performance.now() - startTime);
      let msg = 'bilinmeyen hata';
      if (err instanceof IncompleteDataError) msg = err.message;
      else if (err instanceof DOMException && err.name === 'AbortError') msg = 'OpenF1 zaman aşımı';
      else if (err instanceof Error) msg = err.message;

      securityLogger.log(
        'WARN',
        503,
        `/v1/laps?session_key=${sessionKey}`,
        `OpenF1 verisi alınamadı (${msg}). Son başarılı veri ya da örnek veri gösteriliyor.`,
        '127.0.0.1',
        durationMs
      );
      return this.fallback(msg, base);
    }
  }

  private async getJson<T>(path: string, timeoutMs = 20000): Promise<T[]> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(`${this.baseUrl}/${path}`, { signal: controller.signal });
        if (res.status === 429 && attempt === 0) {
          await sleep(1500); // hız sınırı: bir kez bekleyip tekrar dene
          continue;
        }
        if (res.status === 404) return []; // OpenF1 "No results found" için 404 döner
        if (!res.ok) throw new Error(`OpenF1 ${path.split('?')[0]} HTTP ${res.status}`);
        const data: unknown = await res.json();
        return Array.isArray(data) ? (data as T[]) : [];
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error('OpenF1 hız sınırı (HTTP 429)');
  }

  /** Ham OpenF1 kayıtlarını uygulamanın kendi tiplerine çevirir. */
  private build(
    base: RaceSession,
    rawDrivers: RawDriver[],
    rawLaps: RawLap[],
    rawPit: RawPit[],
    rawStints: RawStint[],
    rawPos: RawPosition[]
  ) {
    // 1) Pilotlar: renk bizim sistemden (kısaltmaya göre), takım rengi ve fotoğraf kullanılmaz
    const knownColors = new Map<string, string>(DRIVERS.map((d) => [d.name_acronym, d.custom_color]));
    const byNumber = new Map<number, Driver>();
    let spare = 0;
    for (const d of rawDrivers) {
      if (byNumber.has(d.driver_number)) continue;
      byNumber.set(d.driver_number, {
        driver_number: d.driver_number,
        broadcast_name: d.broadcast_name,
        full_name: d.full_name,
        name_acronym: d.name_acronym,
        team_name: d.team_name,
        custom_color: knownColors.get(d.name_acronym) ?? SPARE_COLORS[spare++ % SPARE_COLORS.length],
        country_code: d.country_code ?? undefined,
      });
    }
    const drivers = [...byNumber.values()];
    const acr = (n: number) => byNumber.get(n)?.name_acronym ?? String(n);

    // 2) Lastik stint'leri (pilot başına stint sırasıyla)
    const stintsByDriver = new Map<number, RawStint[]>();
    for (const s of rawStints) {
      if (!byNumber.has(s.driver_number) || s.lap_start == null || !toCompound(s.compound)) continue;
      const list = stintsByDriver.get(s.driver_number) ?? [];
      list.push(s);
      stintsByDriver.set(s.driver_number, list);
    }
    for (const list of stintsByDriver.values()) list.sort((a, b) => a.stint_number - b.stint_number);

    // O turda geçerli stint: lap_start <= tur olan son stint
    const stintAt = (driver: number, lap: number): RawStint | undefined => {
      const list = stintsByDriver.get(driver);
      if (!list || list.length === 0) return undefined;
      let found = list[0];
      for (const s of list) {
        if ((s.lap_start as number) <= lap) found = s;
      }
      return found;
    };

    // 3) Tur sayısı ve pit turları
    const totalLaps = rawLaps.reduce(
      (max, l) => (l.lap_duration != null && l.lap_duration > 0 ? Math.max(max, l.lap_number) : max),
      0
    );
    const pitLaps = new Map<number, Set<number>>();
    for (const p of rawPit) {
      if (p.lap_number == null) continue;
      const set = pitLaps.get(p.driver_number) ?? new Set<number>();
      set.add(p.lap_number);
      pitLaps.set(p.driver_number, set);
    }

    const lapsByDriver = new Map<number, RawLap[]>();
    for (const l of rawLaps) {
      if (!byNumber.has(l.driver_number)) continue;
      const list = lapsByDriver.get(l.driver_number) ?? [];
      list.push(l);
      lapsByDriver.set(l.driver_number, list);
    }

    // 4) Turlar. Aykırı tur: pit giriş turu ya da pilotun medyanından %7'den fazla yavaş (SC/VSC, kaza vb.)
    const laps: LapData[] = [];
    for (const [num, list] of lapsByDriver) {
      const valid = list.filter((l) => l.lap_duration != null && l.lap_duration > 0);
      const cleanDurations = valid
        .filter((l) => !l.is_pit_out_lap && l.lap_number > 1)
        .map((l) => l.lap_duration as number)
        .sort((a, b) => a - b);
      const median = cleanDurations.length ? cleanDurations[Math.floor(cleanDurations.length / 2)] : 0;

      for (const l of valid) {
        const stint = stintAt(num, l.lap_number);
        const compound = toCompound(stint?.compound);
        if (!stint || !compound) continue;
        const duration = l.lap_duration as number;
        const isInLap = pitLaps.get(num)?.has(l.lap_number) ?? false;
        const tooSlow = median > 0 && duration > median * 1.07;
        laps.push({
          lap_number: l.lap_number,
          driver_number: num,
          lap_duration: duration,
          is_pit_out_lap: Boolean(l.is_pit_out_lap),
          is_outlier: isInLap || tooSlow,
          sector_1: l.duration_sector_1 ?? 0,
          sector_2: l.duration_sector_2 ?? 0,
          sector_3: l.duration_sector_3 ?? 0,
          compound,
          tire_age: (stint.tyre_age_at_start ?? 0) + Math.max(0, l.lap_number - (stint.lap_start as number)),
        });
      }
    }

    // 5) Pozisyon: zaman serisini "tur sonu" anına indir
    const posByDriver = new Map<number, { t: number; p: number }[]>();
    for (const r of rawPos) {
      const t = ts(r.date);
      if (Number.isNaN(t) || !byNumber.has(r.driver_number)) continue;
      const list = posByDriver.get(r.driver_number) ?? [];
      list.push({ t, p: r.position });
      posByDriver.set(r.driver_number, list);
    }
    for (const list of posByDriver.values()) list.sort((a, b) => a.t - b.t);

    const positions: PositionChange[] = [];
    for (const [num, list] of lapsByDriver) {
      const pts = posByDriver.get(num);
      if (!pts || pts.length === 0) continue;
      const sorted = list.filter((l) => l.date_start).sort((a, b) => a.lap_number - b.lap_number);
      let idx = -1;
      for (let i = 0; i < sorted.length; i++) {
        const lap = sorted[i];
        if (lap.lap_number > totalLaps) break;
        const next = sorted[i + 1];
        let end = Number.NaN;
        if (next && next.lap_number === lap.lap_number + 1) end = ts(next.date_start as string);
        else if (lap.lap_duration) end = ts(lap.date_start as string) + lap.lap_duration * 1000;
        if (Number.isNaN(end)) continue;
        while (idx + 1 < pts.length && pts[idx + 1].t <= end) idx++;
        if (idx >= 0) positions.push({ lap_number: lap.lap_number, driver_number: num, position: pts[idx].p });
      }
    }

    // 6) Pit stop'lar (ölçülmüş stop_duration'ı olmayanlar alınmaz, "en hızlı pit" yanlış çıkmasın)
    const pitStops: PitStop[] = [];
    for (const p of rawPit) {
      if (p.lap_number == null || p.stop_duration == null) continue;
      const list = stintsByDriver.get(p.driver_number);
      if (!list) continue;
      const cur = list.find((s) => s.lap_end === p.lap_number) ?? stintAt(p.driver_number, p.lap_number);
      if (!cur) continue;
      const nxt = list[list.indexOf(cur) + 1] ?? cur;
      const from = toCompound(cur.compound);
      const to = toCompound(nxt.compound);
      if (!from || !to) continue;
      pitStops.push({
        driver_number: p.driver_number,
        lap: p.lap_number,
        pit_duration: p.pit_duration ?? p.stop_duration,
        stop_duration: p.stop_duration,
        from_compound: from,
        to_compound: to,
      });
    }

    // 7) Stint listesi
    const stints: Stint[] = [];
    for (const [num, list] of stintsByDriver) {
      for (const s of list) {
        const start = s.lap_start as number;
        const end = s.lap_end ?? totalLaps;
        stints.push({
          driver_number: num,
          stint_number: s.stint_number,
          compound: toCompound(s.compound) as TireCompound,
          start_lap: start,
          end_lap: end,
          total_laps: Math.max(0, end - start + 1),
        });
      }
    }

    // 8) Veri tam mı? Değilse sahte veriyle doldurmak yerine hata verip "eksik veri" durumuna düş
    const counts = new Map<number, number>();
    for (const l of laps) counts.set(l.driver_number, (counts.get(l.driver_number) ?? 0) + 1);
    const driversWithLaps = [...counts.values()].filter((c) => c >= 10).length;
    if (driversWithLaps < 8 || stints.length === 0 || positions.length === 0) {
      throw new IncompleteDataError('bu yarış için OpenF1 verisi eksik');
    }

    // 9) Oturum özeti (en hızlı tur ve pit gerçek veriden hesaplanır)
    const clean = laps.filter((l) => !l.is_outlier && !l.is_pit_out_lap && l.lap_number > 1);
    const bestLap = clean.reduce<LapData | null>((a, l) => (!a || l.lap_duration < a.lap_duration ? l : a), null);
    const bestPit = pitStops.reduce<PitStop | null>((a, p) => (!a || p.stop_duration < a.stop_duration ? p : a), null);

    const session: RaceSession = {
      ...base,
      total_laps: totalLaps,
      fastest_lap: bestLap
        ? {
            driver_acronym: acr(bestLap.driver_number),
            driver_number: bestLap.driver_number,
            lap_time: formatLapTime(bestLap.lap_duration),
            lap_number: bestLap.lap_number,
          }
        : { driver_acronym: '-', driver_number: 0, lap_time: '-', lap_number: 0 },
      fastest_pit: bestPit
        ? { driver_acronym: acr(bestPit.driver_number), duration: bestPit.stop_duration, lap: bestPit.lap }
        : { driver_acronym: '-', duration: 0, lap: 0 },
    };

    return { session, drivers, laps, positions, pitStops, stints };
  }

  // --- Önbellek: son başarılı gerçek veri (API kapalıyken bununla açılır) ---

  private saveCache(sessionKey: number, data: F1ServiceResponse) {
    const entry = JSON.stringify({ savedAt: new Date().toISOString(), data });
    try {
      localStorage.setItem(CACHE_PREFIX + sessionKey, entry);
    } catch {
      this.clearCache();
      try {
        localStorage.setItem(CACHE_PREFIX + sessionKey, entry);
      } catch {
        // depolama dolu ya da kapalı, önbellek olmadan devam
      }
    }
  }

  private readCache(sessionKey: number): { savedAt: string; data: F1ServiceResponse } | null {
    try {
      const raw = localStorage.getItem(CACHE_PREFIX + sessionKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private clearCache() {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(CACHE_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // yok say
    }
  }

  /** Canlı veri alınamadığında: önce son başarılı gerçek veri, o da yoksa AÇIKÇA etiketli örnek veri. */
  private fallback(reason: string, session: RaceSession): F1ServiceResponse {
    const cached = this.readCache(session.session_key);
    if (cached) {
      return {
        ...cached.data,
        isOfflineFallback: true,
        dataOrigin: 'cache',
        lastUpdated: `${formatDateTime(new Date(cached.savedAt))} (son başarılı veri; ${reason})`,
        sourceUrl: 'https://api.openf1.org/v1 (son başarılı veri, tarayıcı önbelleği)',
      };
    }

    const raceData = generateRaceDataForSession(session);
    return {
      session,
      drivers: DRIVERS,
      laps: raceData.laps,
      positions: raceData.positions,
      pitStops: raceData.pitStops,
      stints: raceData.stints,
      isOfflineFallback: true,
      dataOrigin: 'sample',
      lastUpdated: `${formatDateTime(new Date())} (ÖRNEK VERİ, gerçek veri alınamadı: ${reason})`,
      sourceUrl: 'Örnek veri (OpenF1 yanıtı alınamadı)',
    };
  }

  public filterOutlierLaps(laps: LapData[], removeOutliers = true): {
    filteredLaps: LapData[];
    removedCount: number;
    medianTime: number;
    fastestLap: LapData | null;
  } {
    if (!laps || laps.length === 0) {
      return { filteredLaps: [], removedCount: 0, medianTime: 0, fastestLap: null };
    }

    if (!removeOutliers) {
      const sorted = [...laps].sort((a, b) => a.lap_duration - b.lap_duration);
      return {
        filteredLaps: laps,
        removedCount: 0,
        medianTime: sorted[Math.floor(sorted.length / 2)]?.lap_duration || 0,
        fastestLap: sorted[0] || null,
      };
    }

    // Önce alan kuralları (SC, pit çıkışı, 1. tur), sonra IQR
    const domainCleaned = laps.filter((lap) => !lap.is_outlier && !lap.is_pit_out_lap && lap.lap_number > 1);

    const durations = domainCleaned.map((l) => l.lap_duration).sort((a, b) => a - b);
    if (durations.length < 4) {
      return {
        filteredLaps: domainCleaned,
        removedCount: laps.length - domainCleaned.length,
        medianTime: durations[0] || 0,
        fastestLap: domainCleaned[0] || null,
      };
    }

    const q1 = durations[Math.floor(durations.length * 0.25)];
    const q3 = durations[Math.floor(durations.length * 0.75)];
    const iqr = q3 - q1;
    const upperBound = q3 + 1.5 * iqr;
    // Eski kodda alt sınır sabit 80 sn'ydi; 80 sn'den hızlı pistlerde (ör. Montreal) tüm turları siliyordu
    const lowerBound = q1 - 1.5 * iqr;

    const finalFiltered = domainCleaned.filter(
      (l) => l.lap_duration >= lowerBound && l.lap_duration <= upperBound
    );

    const sortedFinal = [...finalFiltered].sort((a, b) => a.lap_duration - b.lap_duration);
    const median = sortedFinal[Math.floor(sortedFinal.length / 2)]?.lap_duration || 0;

    return {
      filteredLaps: finalFiltered,
      removedCount: laps.length - finalFiltered.length,
      medianTime: median,
      fastestLap: sortedFinal[0] || null,
    };
  }
}

export const openF1Service = new OpenF1Service();
