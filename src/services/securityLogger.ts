import { LogLevel, SecurityAlarm, SecurityLog } from '../types/f1';

const STORAGE_KEY_LOGS = 'f1_security_logs_v1';
const STORAGE_KEY_ALARMS = 'f1_security_alarms_v1';
const ANOMALY_THRESHOLD = 100;

type LogListener = (logs: SecurityLog[], alarms: SecurityAlarm[]) => void;

class SecurityLoggerService {
  private logs: SecurityLog[] = [];
  private alarms: SecurityAlarm[] = [];
  private listeners: Set<LogListener> = new Set();
  private isSimulating = false;

  constructor() {
    this.loadInitialState();
  }

  private loadInitialState() {
    try {
      const savedLogs = localStorage.getItem(STORAGE_KEY_LOGS);
      const savedAlarms = localStorage.getItem(STORAGE_KEY_ALARMS);

      if (savedLogs) {
        this.logs = JSON.parse(savedLogs);
      } else {
        this.seedInitialLogs();
      }

      if (savedAlarms) {
        this.alarms = JSON.parse(savedAlarms);
      }
    } catch {
      this.seedInitialLogs();
    }
  }

  private seedInitialLogs() {
    const now = Date.now();
    this.logs = [
      {
        id: 'log-001',
        timestamp: new Date(now - 1000 * 60 * 18).toISOString(),
        level: 'INFO',
        statusCode: 200,
        endpoint: '/api/v1/sessions?year=2024',
        clientIp: '172.56.21.94',
        message: 'OpenF1 session list retrieved successfully',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        responseTimeMs: 82,
      },
      {
        id: 'log-002',
        timestamp: new Date(now - 1000 * 60 * 14).toISOString(),
        level: 'INFO',
        statusCode: 200,
        endpoint: '/api/v1/laps?session_key=9472',
        clientIp: '172.56.21.94',
        message: 'Telemetry lap times processed (57 laps)',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        responseTimeMs: 145,
      },
      {
        id: 'log-003',
        timestamp: new Date(now - 1000 * 60 * 8).toISOString(),
        level: 'WARN',
        statusCode: 404,
        endpoint: '/api/v1/telemetry/live-stream',
        clientIp: '198.51.100.22',
        message: 'Requested stream endpoint not found on edge node',
        userAgent: 'Python-requests/2.31.0',
        responseTimeMs: 24,
      },
    ];
    this.persist();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(this.logs.slice(-500)));
      localStorage.setItem(STORAGE_KEY_ALARMS, JSON.stringify(this.alarms));
    } catch {
      // Storage full or private mode
    }
    this.notify();
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener(this.logs, this.alarms);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn([...this.logs], [...this.alarms]));
  }

  public log(level: LogLevel, statusCode: number, endpoint: string, message: string, clientIp = '127.0.0.1', responseTimeMs = 15) {
    const newLog: SecurityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      level,
      statusCode,
      endpoint,
      clientIp,
      message,
      userAgent: navigator.userAgent,
      responseTimeMs,
    };

    this.logs.unshift(newLog);
    if (this.logs.length > 500) {
      this.logs.pop();
    }

    this.evaluateAnomalyRule();
    this.persist();
  }

  public evaluateAnomalyRule(): SecurityAlarm | null {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const recent4xxLogs = this.logs.filter((l) => {
      const logTime = new Date(l.timestamp).getTime();
      return logTime >= fiveMinutesAgo && l.statusCode >= 400 && l.statusCode < 500;
    });

    const count = recent4xxLogs.length;

    if (count >= ANOMALY_THRESHOLD) {
      const existingActive = this.alarms.find((a) => a.status === 'ACTIVE' && a.metric === '4xx_Rate_5m');
      if (!existingActive) {
        const newAlarm: SecurityAlarm = {
          id: `ALARM-4XX-${Date.now()}`,
          title: 'KRİTİK GÜVENLİK ANOMALİSİ: 4xx Hata Fırtınası Tespit Edildi!',
          severity: 'CRITICAL',
          triggeredAt: new Date().toISOString(),
          description: `Son 5 dakika içerisinde sistemde ${count} adet 4xx istemci hatası kaydedildi. Otomatik WAF/URL tarama saldırısı şüphesi.`,
          metric: '4xx_Rate_5m',
          threshold: `>${ANOMALY_THRESHOLD} istek / 5 dk`,
          currentValue: `${count} istek`,
          status: 'ACTIVE',
        };
        this.alarms.unshift(newAlarm);
        this.persist();
        return newAlarm;
      } else {
        existingActive.currentValue = `${count} istek`;
        this.persist();
      }
    }
    return null;
  }

  public async simulate4xxStorm(targetCount = 105, onProgress?: (current: number) => void): Promise<SecurityAlarm | null> {
    if (this.isSimulating) return null;
    this.isSimulating = true;

    const fakeEndpoints = [
      '/admin.php',
      '/.env',
      '/.git/config',
      '/wp-login.php',
      '/api/v1/secrets',
      '/backup.tar.gz',
      '/server-status',
      '/database.sql',
      '/api/internal/debug',
      '/config/aws.json',
      '/v2/admin/users',
      '/phpmyadmin/index.php',
    ];

    const attackerIp = '198.51.100.77';

    for (let i = 1; i <= targetCount; i++) {
      const randomPath = fakeEndpoints[Math.floor(Math.random() * fakeEndpoints.length)];
      const code = Math.random() > 0.15 ? 404 : 403;
      const ms = Math.floor(Math.random() * 25) + 5;

      this.logs.unshift({
        id: `sim-log-${Date.now()}-${i}`,
        timestamp: new Date().toISOString(),
        level: 'WARN',
        statusCode: code,
        endpoint: randomPath,
        clientIp: attackerIp,
        message: code === 404 ? `HTTP 404 Not Found: Path does not exist` : `HTTP 403 Forbidden: Blocked by Security WAF rule`,
        userAgent: 'Go-http-client/1.1 (Security Scanner Bot)',
        responseTimeMs: ms,
      });

      if (onProgress && i % 10 === 0) {
        onProgress(i);
      }

      if (i % 25 === 0) {
        await new Promise((r) => setTimeout(r, 40));
      }
    }

    this.isSimulating = false;
    const alarm = this.evaluateAnomalyRule();
    this.persist();
    return alarm;
  }

  public resolveAlarm(id: string) {
    const alarm = this.alarms.find((a) => a.id === id);
    if (alarm) {
      alarm.status = 'RESOLVED';
      this.persist();
    }
  }

  public clearAllLogs() {
    this.logs = [];
    this.alarms = [];
    this.seedInitialLogs();
    this.persist();
  }

  public getLogs(): SecurityLog[] {
    return [...this.logs];
  }

  public getAlarms(): SecurityAlarm[] {
    return [...this.alarms];
  }
}

export const securityLogger = new SecurityLoggerService();
