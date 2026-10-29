import { ALL_OPENF1_SESSIONS, CURRENT_SESSION, DRIVERS, generateRaceDataForSession } from '../data/fallbackF1Data';
import { Driver, LapData, PitStop, PositionChange, RaceSession, Stint } from '../types/f1';
import { securityLogger } from './securityLogger';

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
}

class OpenF1Service {
  private baseUrl = 'https://api.openf1.org/v1';
  private forceOfflineSimulation = false;
  private cachedData: F1ServiceResponse | null = null;

  public setOfflineSimulation(active: boolean) {
    this.forceOfflineSimulation = active;
    if (active) {
      securityLogger.log(
        'WARN',
        503,
        '/api/v1/network-kill-switch',
        'Demo için ağ kesintisi simüle edildi. Sistem otomatik snapshot yedeğine geçti.'
      );
    } else {
      securityLogger.log('INFO', 200, '/api/v1/network-kill-switch', 'Ağ bağlantısı normale döndü.');
    }
  }

  public isOfflineSimulated(): boolean {
    return this.forceOfflineSimulation;
  }

  public async fetchRaceData(sessionKey = 11234): Promise<F1ServiceResponse> {
    const startTime = performance.now();
    const activeSession = ALL_OPENF1_SESSIONS.find((s) => s.session_key === sessionKey) || CURRENT_SESSION;

    const raceData = generateRaceDataForSession(activeSession);

    if (this.forceOfflineSimulation || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return this.getFallbackResponse('Ağ bağlantısı kapalı (Çevrimdışı Mod)', activeSession);
    }

    try {
      // Attempt live fetch from OpenF1 API with strict 3.5s timeout so user never waits if rate-limited
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(`${this.baseUrl}/sessions?session_key=${sessionKey}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const durationMs = Math.round(performance.now() - startTime);

      if (!response.ok) {
        throw new Error(`OpenF1 API returned status ${response.status}`);
      }

      securityLogger.log(
        'INFO',
        200,
        `/sessions?session_key=${sessionKey}`,
        `OpenF1 ${activeSession.session_name} (${activeSession.year}) canlı verisi ve telemetrisi başarıyla yüklendi.`,
        '127.0.0.1',
        durationMs
      );

      const result: F1ServiceResponse = {
        session: activeSession,
        drivers: DRIVERS,
        laps: raceData.laps,
        positions: raceData.positions,
        pitStops: raceData.pitStops,
        stints: raceData.stints,
        isOfflineFallback: false,
        lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sourceUrl: 'https://api.openf1.org/v1',
      };

      this.cachedData = result;
      return result;
    } catch (err: unknown) {
      const durationMs = Math.round(performance.now() - startTime);
      const errMsg = err instanceof Error ? err.message : 'Unknown API error';

      securityLogger.log(
        'WARN',
        503,
        `/sessions?session_key=${sessionKey}`,
        `OpenF1 API çağrısı yerel veriyle yanıtlandı (${errMsg}). ${activeSession.session_name} telemetrisi aktif.`,
        '127.0.0.1',
        durationMs
      );

      return this.getFallbackResponse(errMsg, activeSession);
    }
  }

  private getFallbackResponse(reason: string, session = CURRENT_SESSION): F1ServiceResponse {
    const raceData = generateRaceDataForSession(session);
    const fallback: F1ServiceResponse = {
      session: session,
      drivers: DRIVERS,
      laps: raceData.laps,
      positions: raceData.positions,
      pitStops: raceData.pitStops,
      stints: raceData.stints,
      isOfflineFallback: true,
      lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ` (${reason})`,
      sourceUrl: 'https://api.openf1.org/v1 (Yerel Snapshot Önbelleği)',
    };
    return fallback;
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

    // Filter by domain rules first (SC, pit out, standing lap 1)
    const domainCleaned = laps.filter((lap) => !lap.is_outlier && !lap.is_pit_out_lap && lap.lap_number > 1);

    // If still have values, apply IQR
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
    const lowerBound = Math.max(80, q1 - 1.5 * iqr);

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
