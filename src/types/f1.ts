/**
 * Type definitions for F1 Race Analysis and Cloud Security Observability
 */

export type TireCompound = 'SOFT' | 'MEDIUM' | 'HARD' | 'INTERMEDIATE' | 'WET';

export interface Driver {
  driver_number: number;
  broadcast_name: string;
  full_name: string;
  name_acronym: string;
  team_name: string;
  custom_color: string;
  country_code?: string;
}

export interface LapData {
  lap_number: number;
  driver_number: number;
  lap_duration: number;
  is_pit_out_lap: boolean;
  is_outlier: boolean;
  sector_1: number;
  sector_2: number;
  sector_3: number;
  compound: TireCompound;
  tire_age: number;
}

export interface PositionChange {
  lap_number: number;
  driver_number: number;
  position: number;
}

export interface PitStop {
  driver_number: number;
  lap: number;
  pit_duration: number;
  stop_duration: number;
  from_compound: TireCompound;
  to_compound: TireCompound;
}

export interface Stint {
  driver_number: number;
  stint_number: number;
  compound: TireCompound;
  start_lap: number;
  end_lap: number;
  total_laps: number;
}

export interface RaceSession {
  session_key: number;
  session_name: string;
  circuit_short_name: string;
  country_name: string;
  year: number;
  date: string;
  total_laps: number;
  location?: string;
  circuit_length?: string;
  fastest_lap: {
    driver_acronym: string;
    driver_number: number;
    lap_time: string;
    lap_number: number;
  };
  fastest_pit: {
    driver_acronym: string;
    duration: number;
    lap: number;
  };
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'ALERT' | 'SECURITY';

export interface SecurityLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  statusCode: number;
  endpoint: string;
  clientIp: string;
  message: string;
  userAgent: string;
  responseTimeMs: number;
}

export interface SecurityAlarm {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  triggeredAt: string;
  description: string;
  metric: string;
  threshold: string;
  currentValue: string;
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING';
}

export interface StrideThreat {
  id: string;
  category: 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege';
  threatDescription: string;
  component: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  mitigation: string;
  residualRisk: 'Düşük' | 'Orta' | 'Kabul Edilebilir';
  isPriorityForCard?: boolean;
}
