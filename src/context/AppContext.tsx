import React, { createContext, useContext, useEffect, useState } from 'react';
import { F1ServiceResponse, openF1Service } from '../services/openF1Service';
import { securityLogger } from '../services/securityLogger';
import { SecurityAlarm, SecurityLog } from '../types/f1';

export type Language = 'tr' | 'en';
export type TabType = 'race' | 'security';

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  data: F1ServiceResponse | null;
  loading: boolean;
  error: string | null;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  selectedSessionKey: number;
  setSelectedSessionKey: (key: number) => void;
  refreshData: () => Promise<void>;
  selectedDriverNumbers: number[];
  setSelectedDriverNumbers: (nums: number[]) => void;
  toggleDriverSelection: (num: number) => void;
  filterOutliers: boolean;
  setFilterOutliers: (val: boolean) => void;
  highContrast: boolean;
  setHighContrast: (val: boolean) => void;
  showTableAlternative: boolean;
  setShowTableAlternative: (val: boolean) => void;
  isOfflineSimulated: boolean;
  toggleOfflineSimulation: () => void;
  logs: SecurityLog[];
  alarms: SecurityAlarm[];
  activeAlarm: SecurityAlarm | null;
  dismissActiveAlarm: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<Language>('tr');
  const [activeTab, setActiveTab] = useState<TabType>('race');
  const [data, setData] = useState<F1ServiceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Season Year
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Selected Grand Prix session (Default: 11234 Australia Melbourne 2026)
  const [selectedSessionKey, setSelectedSessionKey] = useState<number>(11234);

  // Multi-select drivers: Default to top 3 contenders (VER, NOR, LEC)
  const [selectedDriverNumbers, setSelectedDriverNumbers] = useState<number[]>([1, 4, 16]);
  const [filterOutliers, setFilterOutliers] = useState<boolean>(true);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [showTableAlternative, setShowTableAlternative] = useState<boolean>(false);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);

  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [alarms, setAlarms] = useState<SecurityAlarm[]>([]);
  const [activeAlarm, setActiveAlarm] = useState<SecurityAlarm | null>(null);

  const loadData = async (sessKey = selectedSessionKey) => {
    setLoading(true);
    setError(null);
    try {
      const res = await openF1Service.fetchRaceData(sessKey);
      setData(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Veri yükleme hatası');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedSessionKey);
  }, [selectedSessionKey]);

  useEffect(() => {
    const unsubscribe = securityLogger.subscribe((allLogs, allAlarms) => {
      setLogs(allLogs);
      setAlarms(allAlarms);
      const activeCritical = allAlarms.find((a) => a.status === 'ACTIVE' && a.severity === 'CRITICAL');
      if (activeCritical) {
        setActiveAlarm(activeCritical);
      }
    });
    return () => unsubscribe();
  }, []);

  const toggleDriverSelection = (driverNo: number) => {
    setSelectedDriverNumbers((prev) => {
      if (prev.includes(driverNo)) {
        if (prev.length <= 1) return prev;
        return prev.filter((n) => n !== driverNo);
      } else {
        return [...prev, driverNo];
      }
    });
  };

  const toggleOfflineSimulation = () => {
    const nextState = !isOfflineSimulated;
    setIsOfflineSimulated(nextState);
    openF1Service.setOfflineSimulation(nextState);
    loadData();
  };

  const dismissActiveAlarm = () => {
    if (activeAlarm) {
      securityLogger.resolveAlarm(activeAlarm.id);
      setActiveAlarm(null);
    }
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        activeTab,
        setActiveTab,
        data,
        loading,
        error,
        selectedYear,
        setSelectedYear,
        selectedSessionKey,
        setSelectedSessionKey,
        refreshData: () => loadData(selectedSessionKey),
        selectedDriverNumbers,
        setSelectedDriverNumbers,
        toggleDriverSelection,
        filterOutliers,
        setFilterOutliers,
        highContrast,
        setHighContrast,
        showTableAlternative,
        setShowTableAlternative,
        isOfflineSimulated,
        toggleOfflineSimulation,
        logs,
        alarms,
        activeAlarm,
        dismissActiveAlarm,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
