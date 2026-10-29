import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { securityLogger } from '../../services/securityLogger';
import { STRIDE_THREATS } from '../../data/fallbackF1Data';
import {
  ShieldAlert,
  Terminal,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  Lock,
  Flame,
  Search,
  ExternalLink,
} from 'lucide-react';

export const SecurityDashboard: React.FC = () => {
  const { lang, logs, alarms, activeAlarm, dismissActiveAlarm } = useApp();
  const [activeSecTab, setActiveSecTab] = useState<'simulator' | 'stride' | 'runbook' | 'headers' | 'iac'>('simulator');
  const [isSimulatingStorm, setIsSimulatingStorm] = useState(false);
  const [stormProgress, setStormProgress] = useState(0);
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [logSearch, setLogSearch] = useState<string>('');

  const triggerStorm = async () => {
    setIsSimulatingStorm(true);
    setStormProgress(0);
    await securityLogger.simulate4xxStorm(105, (current) => {
      setStormProgress(current);
    });
    setIsSimulatingStorm(false);
  };

  const filteredLogs = logs.filter((l) => {
    if (logFilter === '4XX' && (l.statusCode < 400 || l.statusCode >= 500)) return false;
    if (logFilter === 'WARN' && l.level !== 'WARN') return false;
    if (logFilter === 'ERROR' && l.level !== 'ERROR' && l.level !== 'ALERT') return false;

    if (logSearch) {
      const q = logSearch.toLowerCase();
      return (
        l.endpoint.toLowerCase().includes(q) ||
        l.message.toLowerCase().includes(q) ||
        l.clientIp.includes(q) ||
        String(l.statusCode).includes(q)
      );
    }
    return true;
  });

  // English translation map for STRIDE threats
  const strideEnglishMap: Record<string, { desc: string; mitigation: string }> = {
    'THREAT-01': {
      desc: 'Spoofed telemetry packets or forged OpenF1 API responses producing distorted race positions.',
      mitigation: 'TLS 1.3 enforcement, strict certificate validation, and HMAC payload verification against local snapshots.',
    },
    'THREAT-02': {
      desc: 'Man-in-the-Middle (MitM) tampering of lap durations and pit stop intervals in transit.',
      mitigation: 'Mandatory HSTS with preloading, DNSSEC validation, and strict CSP connect-src whitelisting.',
    },
    'THREAT-03': {
      desc: 'Unauthorized client circumventing perimeter defenses and repudiating audit trails.',
      mitigation: 'Append-only centralized audit trail with cryptographic timestamps, client IP, and User-Agent capture.',
    },
    'THREAT-04': {
      desc: 'Stack trace, internal IP addresses, or runtime versions leaked via generic error pages.',
      mitigation: 'Sanitized custom error handlers, removal of X-Powered-By, and server banner masking.',
    },
    'THREAT-05': {
      desc: 'Service exhaustion caused by rapid 4xx/5xx error storm from malicious client or botnet (Denial of Service).',
      mitigation: 'Centralized logging with 100+ 4xx/5m anomaly rule generating automatic alarms and IP rate-limiting.',
    },
    'THREAT-06': {
      desc: 'Privilege escalation via parameter tampering to access administrative telemetry and alarm toggles.',
      mitigation: 'Strict least privilege access control, server-side RBAC checks, and secure HTTP-only cookies.',
    },
    'THREAT-07': {
      desc: 'Cross-Site Scripting (XSS) injecting malicious JavaScript to hijack session tokens.',
      mitigation: 'Strict Content-Security-Policy (CSP) banning unsafe-inline and unsafe-eval; DOM sanitization.',
    },
    'THREAT-08': {
      desc: 'Lack of formal responsible disclosure channel for external security researchers.',
      mitigation: 'Publication of RFC 9116 /.well-known/security.txt with PGP contact encryption.',
    },
  };

  const getResidualBadge = (risk: string) => {
    if (lang === 'tr') return risk;
    if (risk === 'Düşük') return 'Low';
    if (risk === 'Kabul Edilebilir') return 'Acceptable';
    return 'Medium';
  };

  return (
    <div className="space-y-6">
      {/* Security Hub Banner */}
      <div className="rounded-none border border-stone-200 bg-white p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="text-[11px] font-bold tracking-wider text-[#c53737] mb-1">
          {lang === 'tr' ? 'BULUT BİLİŞİM & SİBER GÜVENLİK' : 'CLOUD & CYBERSECURITY'}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#c53737]" />
              {lang === 'tr' ? 'Gözlemlenebilirlik & Güvenlik Olayları Merkezi' : 'Observability & Security Incident Center'}
            </h2>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl leading-relaxed">
              {lang === 'tr'
                ? 'Merkezi loglama, 5 dakikada 100+ 4xx anomali kuralı, canlı 4xx fırtınası simülasyonu ve STRIDE tehdit mimarisi.'
                : 'Centralized telemetry logging, 4xx anomaly detection rule (100+ 4xx in 5m), live storm simulator, and STRIDE risk matrix.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-none bg-stone-100 text-stone-800 border border-stone-200">
              Observatory: <strong>A+</strong>
            </span>
            <span className="px-2.5 py-1 rounded-none bg-stone-100 text-stone-800 border border-stone-200">
              {lang === 'tr' ? 'Maliyet:' : 'Cost:'} <strong>{lang === 'tr' ? '0 TL' : '$0 / Free Tier'}</strong>
            </span>
          </div>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex flex-wrap gap-2 mt-5 pt-3 border-t border-stone-100">
          {[
            { id: 'simulator', label: lang === 'tr' ? '4xx Fırtınası & Log Akışı' : '4xx Storm & Live Logs', icon: Terminal },
            { id: 'stride', label: lang === 'tr' ? 'STRIDE Tehdit Modeli (8)' : 'STRIDE Threat Model (8)', icon: ShieldAlert },
            { id: 'runbook', label: lang === 'tr' ? 'Olay Müdahale Runbook' : 'Incident Runbook', icon: FileCheck },
            { id: 'headers', label: lang === 'tr' ? 'Web Güvenlik Başlıkları' : 'Security Headers', icon: Lock },
            { id: 'iac', label: lang === 'tr' ? 'Altyapı (IaC) & 0 TL Bütçe' : 'IaC & $0 Budget Guard', icon: ExternalLink },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSecTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSecTab(tab.id as typeof activeSecTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-semibold transition ${
                  isActive
                    ? 'bg-[#c53737] text-white shadow-sm'
                    : 'bg-stone-50 text-stone-600 hover:text-stone-900 border border-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ACTIVE CRITICAL ALARM BANNER */}
      {activeAlarm && (
        <div className="rounded-none border-2 border-red-500 bg-red-50 p-4 text-red-950 shadow-sm animate-pulse">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <Flame className="w-6 h-6 text-[#c53737] shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-none bg-[#c53737] text-white font-mono font-bold text-[10px] tracking-wider">
                    {activeAlarm.severity}
                  </span>
                  <h3 className="font-bold text-sm tracking-tight text-red-950">{activeAlarm.title}</h3>
                </div>
                <p className="text-xs text-red-800 mt-1">{activeAlarm.description}</p>
                <div className="mt-2 text-xs font-mono text-red-700 flex flex-wrap gap-4">
                  <span>{lang === 'tr' ? 'Metrik:' : 'Metric:'} <strong>{activeAlarm.metric}</strong></span>
                  <span>{lang === 'tr' ? 'Eşik:' : 'Threshold:'} <strong>{activeAlarm.threshold}</strong></span>
                  <span>{lang === 'tr' ? 'Ölçülen Değer:' : 'Observed Value:'} <strong className="text-[#c53737]">{activeAlarm.currentValue}</strong></span>
                </div>
              </div>
            </div>
            <button
              onClick={dismissActiveAlarm}
              className="px-3 py-1.5 rounded-none bg-[#c53737] hover:bg-[#b91c1c] text-white text-xs font-bold transition shadow-sm"
            >
              {lang === 'tr' ? 'Alarmı İncele & Kapat' : 'Acknowledge & Clear'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: 4XX STORM SIMULATOR & LOG CONSOLE */}
      {activeSecTab === 'simulator' && (
        <div className="space-y-4">
          {/* Simulator Action Box */}
          <div className="rounded-none border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  {lang === 'tr' ? 'Doğrulama Testi: 4xx Hata Fırtınası Simülatörü' : 'Validation Test: 4xx Storm Simulator'}
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-xl">
                  {lang === 'tr'
                    ? 'Bu butona tıkladığınızda sisteme 105 adet hızlı 404/403 istek fırtınası gönderilir; merkezi log sistemi bu anomalisi yakalar ve 5 dakikada 100+ 4xx alarm kuralını tetikler.'
                    : 'Dispatches 105 rapid 404/403 requests to trigger the 100+ 4xx/5m anomaly rule, verifying telemetry defense.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={triggerStorm}
                  disabled={isSimulatingStorm}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-none text-xs font-bold transition shadow-sm ${
                    isSimulatingStorm
                      ? 'bg-amber-600 text-white cursor-wait'
                      : 'bg-[#c53737] hover:bg-[#b91c1c] text-white'
                  }`}
                >
                  <Play className={`w-4 h-4 ${isSimulatingStorm ? 'animate-spin' : ''}`} />
                  <span>
                    {isSimulatingStorm
                      ? `${lang === 'tr' ? 'Fırtına Simüle Ediliyor...' : 'Simulating Storm...'} (${stormProgress}/105)`
                      : (lang === 'tr' ? '4xx Fırtınasını Başlat (105 İstek)' : 'Trigger 4xx Storm (105 Req)')}
                  </span>
                </button>

                <button
                  onClick={() => securityLogger.clearAllLogs()}
                  className="p-2.5 rounded-none bg-stone-100 hover:bg-stone-200 text-stone-600 border border-stone-300 transition"
                  title={lang === 'tr' ? 'Logları Sıfırla' : 'Reset Logs'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isSimulatingStorm && (
              <div className="mt-4">
                <div className="h-2 w-full bg-stone-100 rounded-none overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#c53737] to-amber-500 transition-all duration-75"
                    style={{ width: `${(stormProgress / 105) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-[#c53737] font-mono mt-1 flex justify-between">
                  <span>{lang === 'tr' ? 'Saldırı Trafiği Simüle Ediliyor (IP: 198.51.100.77)...' : 'Simulating Attack Traffic (IP: 198.51.100.77)...'}</span>
                  <span>{Math.round((stormProgress / 105) * 100)}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Centralized Log Console */}
          <div className="rounded-none border border-stone-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-stone-700" />
                {/* Note: explicit uppercase in code, NO CSS uppercase to avoid dotted capital I in English! */}
                <h3 className="text-xs font-bold text-stone-900 font-mono tracking-wider">
                  {lang === 'tr' ? 'MERKEZİ GÜVENLİK & ERİŞİM LOGLARI' : 'CENTRALIZED ACCESS & SECURITY LOGS'}
                </h3>
                <span className="text-[10px] text-stone-400 font-mono">({filteredLogs.length} {lang === 'tr' ? 'Kayıt' : 'Records'})</span>
              </div>

              {/* Filters & Search */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder={lang === 'tr' ? 'Endpoint, IP, HTTP...' : 'Search endpoint, IP...'}
                    className="pl-7 pr-2.5 py-1 rounded-none bg-stone-50 border border-stone-200 text-[11px] text-stone-800 focus:outline-none focus:border-[#c53737] w-36 sm:w-48 font-mono"
                  />
                </div>

                <div className="flex gap-1 text-[11px] font-mono">
                  {['ALL', '4XX', 'WARN', 'ERROR'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLogFilter(filter)}
                      className={`px-2 py-0.5 rounded-none border transition ${
                        logFilter === filter
                          ? 'bg-stone-900 text-white border-stone-900 font-bold'
                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:text-stone-900'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Log Stream Terminal Window */}
            <div className="h-80 overflow-y-auto bg-stone-950 rounded-none p-3 font-mono text-[11px] border border-stone-800 divide-y divide-stone-900">
              {filteredLogs.map((log) => (
                <div key={log.id} className="py-1.5 flex flex-wrap items-baseline gap-2 hover:bg-stone-900/60 px-1 rounded-none transition">
                  <span className="text-stone-500">[{log.timestamp.slice(11, 19)}]</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-none font-bold text-[10px] ${
                      log.statusCode >= 500
                        ? 'bg-red-950 text-red-400 border border-red-500/30'
                        : log.statusCode >= 400
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    HTTP {log.statusCode}
                  </span>
                  <span className="text-stone-400 text-[10px]">({log.responseTimeMs}ms)</span>
                  <span className="text-blue-300 font-bold">{log.endpoint}</span>
                  <span className="text-stone-500 text-[10px]">[{log.clientIp}]</span>
                  <span className="text-stone-300 text-[11px]">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STRIDE THREAT MODEL */}
      {activeSecTab === 'stride' && (
        <div className="rounded-none border border-stone-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#c53737]" />
              {lang === 'tr' ? 'DFD Üzerinde STRIDE Tehdit Modeli Analizi (8 Tehdit)' : 'STRIDE Threat Model & Risk Matrix (8 Threats)'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {lang === 'tr'
                ? 'F1 Yarış Analizi veri akışı ve güven sınırları üzerinde hesaplanan Olasılık x Etki matrisi.'
                : 'Likelihood x Impact scoring across system trust boundaries and OpenF1 telemetry pipelines.'}
            </p>
          </div>

          <div className="overflow-x-auto rounded-none border border-stone-200">
            <table className="w-full text-xs text-left text-stone-700">
              <thead className="bg-stone-50 text-stone-700 font-mono border-b border-stone-200">
                <tr>
                  <th className="p-3">{lang === 'tr' ? 'ID & Kategori' : 'ID & Category'}</th>
                  <th className="p-3">{lang === 'tr' ? 'Bileşen' : 'Component'}</th>
                  <th className="p-3">{lang === 'tr' ? 'Tehdit Açıklaması' : 'Threat Description'}</th>
                  <th className="p-3">{lang === 'tr' ? 'Risk (O x E)' : 'Risk Score (L x I)'}</th>
                  <th className="p-3">{lang === 'tr' ? 'Uygulanan Önlem & Mitigasyon' : 'Mitigation Strategy'}</th>
                  <th className="p-3">{lang === 'tr' ? 'Kalan Risk' : 'Residual Risk'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono text-[11px]">
                {STRIDE_THREATS.map((t) => {
                  const en = strideEnglishMap[t.id];
                  return (
                    <tr key={t.id} className="hover:bg-stone-50">
                      <td className="p-3 font-bold text-stone-900 whitespace-nowrap">
                        <div>{t.id}</div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-none bg-stone-100 text-stone-700 border border-stone-300">
                          {t.category}
                        </span>
                      </td>
                      <td className="p-3 text-stone-600 whitespace-nowrap">{t.component}</td>
                      <td className="p-3 text-stone-700 max-w-xs">{lang === 'tr' ? t.threatDescription : (en?.desc || t.threatDescription)}</td>
                      <td className="p-3 font-bold">
                        <span
                          className={`px-2 py-0.5 rounded-none ${
                            t.riskScore >= 16
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : t.riskScore >= 10
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {t.riskScore} / 25
                        </span>
                      </td>
                      <td className="p-3 text-stone-600 max-w-sm">{lang === 'tr' ? t.mitigation : (en?.mitigation || t.mitigation)}</td>
                      <td className="p-3 text-emerald-700 font-bold whitespace-nowrap">{getResidualBadge(t.residualRisk)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RUNBOOK */}
      {activeSecTab === 'runbook' && (
        <div className="rounded-none border border-stone-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-[#c53737]" />
              {lang === 'tr' ? '1 Sayfalık Olay Müdahale Runbook: "API Anahtarım Sızdı"' : '1-Page Incident Runbook: "API Key Leaked"'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {lang === 'tr'
                ? 'Siber güvenlik acil durum senaryosunda adım adım izlenecek standart operasyonel prosedür.'
                : 'Standard operating procedure for key revocation, secret rotation, forensic audit, and post-mortem.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              {
                step: lang === 'tr' ? '1. Tespit' : '1. Detection',
                time: lang === 'tr' ? '0 - 5 dk' : '0 - 5 min',
                desc: lang === 'tr' ? 'GitHub Secret Scanning veya Gitleaks uyarısı alındı. Sızan tokenın commit hash ve dosyası tespit edildi.' : 'Secret scanning alert triggered. Compromised commit hash and token path identified.',
                action: lang === 'tr' ? 'Bildirimi doğrula & olayı P1 olarak kaydet.' : 'Validate alert & open P1 incident.',
              },
              {
                step: lang === 'tr' ? '2. İptal' : '2. Revocation',
                time: lang === 'tr' ? '5 - 10 dk' : '5 - 10 min',
                desc: lang === 'tr' ? 'Bulut konsoluna (Azure/GCP/Cloudflare) girilerek sızan anahtar derhal REVOKE edildi.' : 'Access cloud console (GCP/Cloudflare) and immediately REVOKE compromised key.',
                action: lang === 'tr' ? 'Erişimi anında sonlandır.' : 'Terminate token access immediately.',
              },
              {
                step: lang === 'tr' ? '3. Yenileme' : '3. Rotation',
                time: lang === 'tr' ? '10 - 20 dk' : '10 - 20 min',
                desc: lang === 'tr' ? 'Yeni güçlü anahtar üretildi, GitHub Secrets ve Bulut Key Vault\'a eklendi. Kod deposuna ASLA yazılmadı.' : 'Generate high-entropy key, inject into Secrets Manager. NEVER commit to repo.',
                action: lang === 'tr' ? 'Sistemi yeni anahtarla canlıya al.' : 'Deploy service with rotated key.',
              },
              {
                step: lang === 'tr' ? '4. İnceleme' : '4. Forensic Audit',
                time: lang === 'tr' ? '20 - 45 dk' : '20 - 45 min',
                desc: lang === 'tr' ? 'Cloud Logging üzerinden sızma anından iptal anına kadar olan IP erişimleri tarandı.' : 'Query Cloud Logging for unauthorized IPs between exposure and revocation.',
                action: lang === 'tr' ? 'Yetkisiz veri çekimi veya maliyet artışı var mı kontrol et.' : 'Verify data integrity & billing metrics.',
              },
              {
                step: lang === 'tr' ? '5. Bildirim' : '5. Post-Mortem',
                time: lang === 'tr' ? '45 - 60 dk' : '45 - 60 min',
                desc: lang === 'tr' ? 'Post-mortem raporu hazırlandı, öğretim elemanına ve ekibe olay özeti sunuldu.' : 'Draft incident post-mortem and present timeline summary to stakeholders.',
                action: lang === 'tr' ? 'Kök neden analizi & kalıcı önlem belgesi.' : 'Root-cause analysis & preventive rules.',
              },
            ].map((step, idx) => (
              <div key={idx} className="p-3.5 rounded-none bg-stone-50 border border-stone-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <strong className="text-[#c53737] font-bold">{step.step}</strong>
                  <span className="text-[10px] text-stone-400 font-mono">{step.time}</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">{step.desc}</p>
                <div className="pt-2 border-t border-stone-200 text-[10px] text-emerald-700 font-mono font-semibold">
                  ➜ {step.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: WEB SECURITY HEADERS */}
      {activeSecTab === 'headers' && (
        <div className="rounded-none border border-stone-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#c53737]" />
              {lang === 'tr' ? 'Web Güvenlik Başlıkları & security.txt Denetimi' : 'Security Headers & RFC 9116 Audit'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {lang === 'tr'
                ? 'Katı CSP, frame-ancestors, X-Content-Type-Options ve /.well-known/security.txt durumu.'
                : 'Evaluation against Mozilla Observatory guidelines and modern browser defense headers.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2.5 font-mono text-xs">
              {[
                { name: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'; connect-src 'self' https://api.openf1.org; object-src 'none';", status: lang === 'tr' ? 'Uyumlu (No unsafe-inline/eval)' : 'Compliant (No unsafe-inline/eval)' },
                { name: 'Strict-Transport-Security (HSTS)', value: 'max-age=63072000; includeSubDomains; preload', status: lang === 'tr' ? 'Aktif (HTTPS Zorunlu)' : 'Active (HTTPS Enforced)' },
                { name: 'X-Content-Type-Options', value: 'nosniff', status: lang === 'tr' ? 'Aktif (MIME sniffing engelli)' : 'Active (MIME Sniffing Blocked)' },
                { name: 'X-Frame-Options / frame-ancestors', value: 'DENY', status: lang === 'tr' ? 'Aktif (Clickjacking korumalı)' : 'Active (Clickjacking Protected)' },
                { name: 'Referrer-Policy', value: 'strict-origin-when-cross-origin', status: lang === 'tr' ? 'Aktif' : 'Active' },
                { name: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()', status: lang === 'tr' ? 'Aktif (Kısıtlı)' : 'Active (Restricted)' },
              ].map((h, i) => (
                <div key={i} className="p-3 rounded-none bg-stone-50 border border-stone-200">
                  <div className="flex items-center justify-between text-stone-900 font-bold mb-1">
                    <span>{h.name}</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-none border border-emerald-200 font-bold">
                      {h.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 break-all">{h.value}</div>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-none bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono font-bold text-stone-900 border-b border-stone-200 pb-2">
                <span>/.well-known/security.txt (RFC 9116)</span>
                <span className="text-emerald-700">{lang === 'tr' ? 'Yayında ✓' : 'Live ✓'}</span>
              </div>
              <pre className="text-[11px] font-mono text-stone-700 leading-relaxed overflow-x-auto p-2 bg-white rounded-none border border-stone-200">
{`# RFC 9116 Security Contact Information
Contact: mailto:salihsul27@gmail.com
Expires: 2027-10-30T00:00:00.000Z
Preferred-Languages: tr, en
Canonical: https://.../.well-known/security.txt
Policy: https://github.com/salihsulku/f1/security/policy`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: IAC & $0 BUDGET */}
      {activeSecTab === 'iac' && (
        <div className="rounded-none border border-stone-200 bg-white p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#c53737]" />
              {lang === 'tr' ? 'Altyapı Kod Olarak (IaC) ve 0 TL Bütçe Alarmı' : 'Infrastructure as Code (IaC) & $0 Budget Guard'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              {lang === 'tr'
                ? 'Bulut kaynağının 0 TL ücretsiz katmanda tutulması için tanımlanan bütçe alarm kuralı ve Terraform/wrangler tanımı.'
                : 'Zero-cost architecture design with Terraform budget alerts and serverless worker configuration.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-none bg-stone-50 border border-stone-200 space-y-2">
              <div className="font-bold text-stone-900 border-b border-stone-200 pb-1">
                {lang === 'tr' ? 'Terraform Bütçe Alarm Kuralı (budget_alert.tf)' : 'Terraform Budget Alert Rule (budget_alert.tf)'}
              </div>
              <pre className="text-[11px] text-stone-700 overflow-x-auto p-2 bg-white rounded-none border border-stone-200">
{`resource "google_billing_budget" "zero_cost_budget" {
  billing_account = var.billing_account_id
  display_name    = "F1-Telemetry-0TL-Budget-Alert"

  budget_filter {
    projects = ["projects/\${var.project_id}"]
  }

  amount {
    specified_amount {
      currency_code = "TRY"
      units         = "1"
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 1.0
  }
}`}
              </pre>
            </div>

            <div className="p-4 rounded-none bg-stone-50 border border-stone-200 space-y-2">
              <div className="font-bold text-stone-900 border-b border-stone-200 pb-1">
                {lang === 'tr' ? 'wrangler.toml (Edge Altyapısı Kod Olarak)' : 'wrangler.toml (Edge Infrastructure as Code)'}
              </div>
              <pre className="text-[11px] text-stone-700 overflow-x-auto p-2 bg-white rounded-none border border-stone-200">
{`name = "f1-race-intelligence"
main = "src/main.tsx"
compatibility_date = "2026-10-29"

[vars]
ENVIRONMENT = "production"
OBSERVABILITY_ENABLED = "true"

[limits]
cpu_ms = 50`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
