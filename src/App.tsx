import { useState, useCallback, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useTimer } from './hooks/useTimer';

type Mode = 'focus' | 'shortBreak' | 'longBreak';

interface Settings {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

interface SessionRecord {
  date: string; // YYYY-MM-DD
  focusMinutes: number;
  sessions: number;
}

const DEFAULT_SETTINGS: Settings = {
  focus: 25,
  shortBreak: 5,
  longBreak: 15,
};

const MODE_LABELS: Record<Mode, string> = {
  focus: 'Фокусировка',
  shortBreak: 'Короткий перерыв',
  longBreak: 'Длинный перерыв',
};

const MODE_COLORS: Record<Mode, { bg: string; ring: string; text: string; button: string; buttonHover: string }> = {
  focus: {
    bg: 'from-rose-500 to-orange-500',
    ring: 'stroke-rose-300',
    text: 'text-rose-100',
    button: 'bg-white/20 hover:bg-white/30 text-white',
    buttonHover: 'bg-white text-rose-600',
  },
  shortBreak: {
    bg: 'from-emerald-500 to-teal-500',
    ring: 'stroke-emerald-300',
    text: 'text-emerald-100',
    button: 'bg-white/20 hover:bg-white/30 text-white',
    buttonHover: 'bg-white text-emerald-600',
  },
  longBreak: {
    bg: 'from-blue-500 to-indigo-500',
    ring: 'stroke-blue-300',
    text: 'text-blue-100',
    button: 'bg-white/20 hover:bg-white/30 text-white',
    buttonHover: 'bg-white text-blue-600',
  },
};

function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function App() {
  const [mode, setMode] = useState<Mode>('focus');
  const [settings, setSettings] = useLocalStorage<Settings>('pomodoro-settings', DEFAULT_SETTINGS);
  const [stats, setStats] = useLocalStorage<SessionRecord[]>('pomodoro-stats', []);
  const [showSettings, setShowSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<Settings>(settings);

  const todayKey = getTodayKey();
  const todayStats = stats.find((s) => s.date === todayKey) || { date: todayKey, focusMinutes: 0, sessions: 0 };

  const handleComplete = useCallback(() => {
    if (mode === 'focus') {
      setStats((prev) => {
        const existing = prev.find((s) => s.date === todayKey);
        if (existing) {
          return prev.map((s) =>
            s.date === todayKey
              ? { ...s, focusMinutes: s.focusMinutes + settings.focus, sessions: s.sessions + 1 }
              : s
          );
        }
        return [...prev, { date: todayKey, focusMinutes: settings.focus, sessions: 1 }];
      });
    }
  }, [mode, settings.focus, setStats, todayKey]);

  const durationInSeconds = settings[mode] * 60;
  const { timeLeft, isRunning, progress, start, pause, reset } = useTimer({
    duration: durationInSeconds,
    onComplete: handleComplete,
  });

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    setShowSettings(false);
  };

  const openSettings = () => {
    setTempSettings(settings);
    setShowSettings(true);
  };

  // Update document title with timer
  useEffect(() => {
    document.title = isRunning ? `${formatTime(timeLeft)} — ${MODE_LABELS[mode]}` : 'Pomodoro Focus Timer';
  }, [timeLeft, isRunning, mode]);

  const colors = MODE_COLORS[mode];

  // Calculate weekly stats
  const getWeekStats = () => {
    const weekData: { day: string; minutes: number }[] = [];
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const record = stats.find((s) => s.date === key);
      weekData.push({
        day: dayNames[date.getDay()],
        minutes: record ? record.focusMinutes : 0,
      });
    }
    return weekData;
  };

  const weekStats = getWeekStats();
  const maxMinutes = Math.max(...weekStats.map((d) => d.minutes), 1);

  // SVG circle calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg} transition-all duration-700 flex flex-col`}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-bold text-white/90 tracking-wide">🍅 Pomodoro</h1>
        <button
          onClick={openSettings}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          title="Настройки"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        {/* Mode Selector */}
        <div className="flex gap-2 mb-8 bg-white/10 backdrop-blur-sm rounded-full p-1.5">
          {(Object.keys(MODE_LABELS) as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                mode === m
                  ? 'bg-white text-gray-800 shadow-lg'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>

        {/* Timer Circle */}
        <div className="relative mb-8">
          <svg width="280" height="280" className="transform -rotate-90">
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="8"
            />
            <circle
              cx="140"
              cy="140"
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-mono font-bold text-white tracking-wider">
              {formatTime(timeLeft)}
            </span>
            <span className="text-white/70 mt-2 text-sm font-medium">
              {MODE_LABELS[mode]}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-4 mb-10">
          {!isRunning ? (
            <button
              onClick={start}
              disabled={timeLeft === 0}
              className={`px-8 py-3 rounded-full font-semibold text-lg transition-all shadow-lg ${colors.buttonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {timeLeft === durationInSeconds ? 'Старт' : 'Продолжить'}
              </span>
            </button>
          ) : (
            <button
              onClick={pause}
              className={`px-8 py-3 rounded-full font-semibold text-lg transition-all shadow-lg ${colors.buttonHover}`}
            >
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
                Пауза
              </span>
            </button>
          )}
          <button
            onClick={reset}
            className={`px-6 py-3 rounded-full font-semibold transition-all ${colors.button}`}
          >
            <span className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Сброс
            </span>
          </button>
        </div>

        {/* Today's Stats */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 w-full max-w-md">
          <h2 className="text-white/90 font-semibold text-lg mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Сегодня
          </h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{todayStats.sessions}</div>
              <div className="text-white/60 text-sm mt-1">Сессий</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold text-white">{todayStats.focusMinutes}</div>
              <div className="text-white/60 text-sm mt-1">Минут фокуса</div>
            </div>
          </div>

          {/* Weekly Chart */}
          <div className="mt-4">
            <h3 className="text-white/70 text-sm font-medium mb-3">Неделя</h3>
            <div className="flex items-end gap-1.5 h-20">
              {weekStats.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-white/30 rounded-t-sm transition-all min-h-[2px]"
                    style={{ height: `${Math.max((day.minutes / maxMinutes) * 100, 3)}%` }}
                  />
                  <span className="text-white/50 text-xs">{day.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Настройки длительности</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Фокусировка (минуты)
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={tempSettings.focus}
                  onChange={(e) => setTempSettings({ ...tempSettings, focus: Math.max(1, Math.min(120, Number(e.target.value))) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 text-gray-800"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Короткий перерыв (минуты)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={tempSettings.shortBreak}
                  onChange={(e) => setTempSettings({ ...tempSettings, shortBreak: Math.max(1, Math.min(30, Number(e.target.value))) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">
                  Длинный перерыв (минуты)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={tempSettings.longBreak}
                  onChange={(e) => setTempSettings({ ...tempSettings, longBreak: Math.max(1, Math.min(60, Number(e.target.value))) })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors font-medium"
              >
                Отмена
              </button>
              <button
                onClick={saveSettings}
                className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
