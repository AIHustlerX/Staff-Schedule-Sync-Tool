import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Sparkles, RefreshCcw, Save, Check, Calculator, Clock, Users, Wand2, DollarSign, Layers, Coffee, BarChart3, CalendarDays } from 'lucide-react';
import { TimeBlock, StaffingStatus, ProductivityConfig, DailyStats, AnalysisResult } from './types';
import { generateInitialBlocks, DEFAULT_CONFIG } from './constants';
import { analyzeSchedule } from './services/geminiService';
import HourlyBlock from './components/HourlyBlock';
import MetricsHeader from './components/MetricsHeader';
import StaffingChart from './components/StaffingChart';
import DateNavigator from './components/DateNavigator';
import ForecastModal from './components/ForecastModal';
import HistoryView from './components/HistoryView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'history'>('schedule');
  const [scheduleData, setScheduleData] = useState<Record<string, TimeBlock[]>>({});
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [config, setConfig] = useState<ProductivityConfig>(DEFAULT_CONFIG);
  const [showConfig, setShowConfig] = useState(false);
  const [showForecastModal, setShowForecastModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const getDateKey = (date: Date) => date.toISOString().split('T')[0];

  // Initialize data for current date if not exists
  useEffect(() => {
    const key = getDateKey(currentDate);
    if (!scheduleData[key]) {
      const isPast = currentDate < new Date(new Date().setHours(0,0,0,0));
      const blocks = generateInitialBlocks(config.startHour, config.endHour, config.intervalMinutes);
      
      // If it's a past date, simulate some "Actual" performance data
      const blocksWithActuals = blocks.map(b => {
        if (isPast) {
          const salesVar = 1 + (Math.random() * 0.2 - 0.1); // +/- 10%
          const staffVar = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
          return {
            ...b,
            actualSales: Math.round(b.salesForecast * salesVar),
            actualFOH: Math.max(0, b.scheduledFOH + staffVar),
            actualBOH: Math.max(0, b.scheduledBOH + (Math.random() > 0.9 ? 1 : 0))
          };
        }
        return b;
      });

      setScheduleData(prev => ({
        ...prev,
        [key]: blocksWithActuals
      }));
    }
  }, [currentDate, config.startHour, config.endHour, config.intervalMinutes]);

  const activeBlocks = scheduleData[getDateKey(currentDate)] || [];

  const handleStructuralConfigUpdate = (updates: Partial<ProductivityConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    const key = getDateKey(currentDate);
    setScheduleData(prev => ({
      ...prev,
      [key]: generateInitialBlocks(newConfig.startHour, newConfig.endHour, newConfig.intervalMinutes)
    }));
    setAiAnalysis(null);
  };

  useEffect(() => {
    const key = getDateKey(currentDate);
    if (!scheduleData[key]) return;

    const capacityFactor = config.enableBreaks 
        ? 1 - (config.breakDurationMinutes / (config.averageShiftLengthHours * 60))
        : 1;

    const updatedBlocks = scheduleData[key].map(block => {
        if (block.isLocked) return block;
        const normalizedSales = block.salesForecast / (config.intervalMinutes / 15);
        const rawTotalNeededOnFloor = normalizedSales / config.targetSalesPerPersonPer15Min;
        const totalToSchedule = Math.max(config.minStaff, Math.ceil(rawTotalNeededOnFloor / capacityFactor));
        const fohShare = config.fohPercentage / 100;
        let recFOH = Math.round(totalToSchedule * fohShare);
        let recBOH = totalToSchedule - recFOH;

        if (totalToSchedule >= 2) {
          if (recFOH < 1 && config.fohPercentage > 0) { recFOH = 1; recBOH = totalToSchedule - 1; }
          if (recBOH < 1 && config.bohPercentage > 0) { recBOH = 1; recFOH = totalToSchedule - 1; }
        }

        const totalScheduled = block.scheduledFOH + block.scheduledBOH;
        let status = StaffingStatus.TARGET;
        if (totalScheduled < totalToSchedule) status = StaffingStatus.UNDER;
        if (totalScheduled > totalToSchedule) status = StaffingStatus.OVER;

        if (block.recommendedFOH === recFOH && block.recommendedBOH === recBOH && block.status === status) return block;
        return { ...block, recommendedFOH: recFOH, recommendedBOH: recBOH, status };
    });
    
    if (JSON.stringify(updatedBlocks) !== JSON.stringify(scheduleData[key])) {
        setScheduleData(prev => ({ ...prev, [key]: updatedBlocks }));
    }
  }, [config, scheduleData, currentDate]);

  const stats: DailyStats = useMemo(() => {
    const totalSales = activeBlocks.reduce((acc, b) => acc + b.salesForecast, 0);
    const hourMultiplier = config.intervalMinutes / 60;
    const totalLaborHours = activeBlocks.reduce((acc, b) => acc + (b.scheduledFOH + b.scheduledBOH), 0) * hourMultiplier;
    const capacityLossRatio = config.enableBreaks ? config.breakDurationMinutes / (config.averageShiftLengthHours * 60) : 0;
    const breakImpactHours = totalLaborHours * capacityLossRatio;
    const breakImpactCost = breakImpactHours * config.averageHourlyWage;
    const salesPerLaborHour = totalLaborHours > 0 ? totalSales / totalLaborHours : 0;
    const totalLaborCost = totalLaborHours * config.averageHourlyWage;
    const laborPercentage = totalSales > 0 ? (totalLaborCost / totalSales) * 100 : 0;
    const onTargetCount = activeBlocks.filter(b => b.status === StaffingStatus.TARGET).length;
    const efficiencyScore = activeBlocks.length > 0 ? (onTargetCount / activeBlocks.length) * 100 : 0;

    // Actuals for variance
    const actualTotalSales = activeBlocks.reduce((acc, b) => acc + (b.actualSales || 0), 0);
    const actualTotalLaborHours = activeBlocks.reduce((acc, b) => acc + ((b.actualFOH || 0) + (b.actualBOH || 0)), 0) * hourMultiplier;

    return { 
        totalSales, totalLaborHours, totalLaborCost, laborPercentage, 
        salesPerLaborHour, efficiencyScore, breakImpactHours, breakImpactCost,
        actualTotalSales, actualTotalLaborHours
    };
  }, [activeBlocks, config, config.intervalMinutes]);

  const handleBlockUpdate = (id: string, field: keyof TimeBlock, value: any) => {
    const key = getDateKey(currentDate);
    setScheduleData(prev => ({
      ...prev,
      [key]: prev[key].map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
    setIsSaved(false);
  };

  const handleAutoSchedule = () => {
    const key = getDateKey(currentDate);
    setScheduleData(prev => ({
        ...prev,
        [key]: prev[key].map(b => b.isLocked ? b : { ...b, scheduledFOH: b.recommendedFOH, scheduledBOH: b.recommendedBOH })
    }));
    setIsSaved(false);
  };

  const handleApplyTotalSales = (newTotal: number) => {
    const key = getDateKey(currentDate);
    const currentTotal = scheduleData[key].reduce((sum, b) => sum + b.salesForecast, 0);
    if (currentTotal === 0) return; 
    const ratio = newTotal / currentTotal;
    setScheduleData(prev => ({
      ...prev,
      [key]: prev[key].map(b => ({ ...b, salesForecast: Math.round(b.salesForecast * ratio) }))
    }));
    setIsSaved(false);
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSchedule(activeBlocks, config);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const blockGroups = activeBlocks.reduce((groups, b) => {
    if (!groups[b.hourLabel]) groups[b.hourLabel] = [];
    groups[b.hourLabel].push(b);
    return groups;
  }, {} as Record<string, TimeBlock[]>);

  const timeOptions = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i > 12 ? i - 12 : i === 0 ? 12 : i} ${i >= 12 ? 'PM' : 'AM'}`
  }));

  return (
    <div className="min-h-screen bg-slate-50 pb-20 overflow-x-hidden">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-10 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 text-white p-1.5 rounded-lg font-bold text-lg">SS</div>
              <span className="font-bold text-slate-800 text-lg tracking-tight hidden sm:inline">StaffSync Pro</span>
            </div>
            
            <div className="flex items-center bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('schedule')}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <CalendarDays size={16} /> Schedule
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <BarChart3 size={16} /> History Review
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
             {activeTab === 'schedule' && (
               <>
                <button onClick={handleAutoSchedule} className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors flex items-center gap-1" title="Auto-Fill Schedule">
                  <Wand2 size={18} />
                  <span className="text-xs font-bold hidden sm:inline">Auto-Fill</span>
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
               </>
             )}
             <button onClick={() => setShowConfig(!showConfig)} className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Settings size={20} />
             </button>
             <button onClick={() => setIsSaved(true)} className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${isSaved ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                {isSaved ? <Check size={16} /> : <Save size={16} />}
                {isSaved ? 'Saved' : 'Save'}
             </button>
          </div>
        </div>
      </nav>

      <main className="max-w-[1920px] mx-auto px-4 sm:px-10 py-6">
        <DateNavigator date={currentDate} onChange={setCurrentDate} />

        {showConfig && (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 mb-6 animate-fade-in-down w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 border-b border-slate-100 pb-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Hour</label>
                        <select value={config.startHour} onChange={(e) => handleStructuralConfigUpdate({ startHour: parseInt(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                            {timeOptions.map(t => <option key={t.value} value={t.value} disabled={t.value >= config.endHour}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Hour</label>
                         <select value={config.endHour} onChange={(e) => handleStructuralConfigUpdate({ endHour: parseInt(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                            {timeOptions.map(t => <option key={t.value} value={t.value} disabled={t.value <= config.startHour}>{t.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1"><Layers size={14} className="text-blue-500" /> Granularity</label>
                        <select value={config.intervalMinutes} onChange={(e) => handleStructuralConfigUpdate({ intervalMinutes: parseInt(e.target.value) })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white">
                            <option value={15}>15 Minutes</option>
                            <option value={30}>30 Minutes</option>
                            <option value={60}>60 Minutes</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Avg. Hourly Wage</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                            <input type="number" value={config.averageHourlyWage} onChange={(e) => setConfig({...config, averageHourlyWage: parseFloat(e.target.value) || 0})} className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg outline-none font-bold" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                     <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2"><Users size={16} className="text-indigo-500"/> FOH/BOH Split</label>
                        <div className="flex items-center gap-6">
                            <div className="text-xs font-bold text-indigo-600">{config.fohPercentage}% FOH</div>
                            <input type="range" min="0" max="100" step="5" value={config.fohPercentage} onChange={(e) => { const foh = parseInt(e.target.value); setConfig({...config, fohPercentage: foh, bohPercentage: 100 - foh}) }} className="flex-1 h-2 bg-gradient-to-r from-indigo-300 to-orange-300 rounded-lg appearance-none cursor-pointer" />
                            <div className="text-xs font-bold text-orange-600">{config.bohPercentage}% BOH</div>
                        </div>
                    </div>
                    
                    <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                        <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <Coffee size={16} className="text-emerald-500" /> Break Modeling
                        </label>
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-medium text-slate-600">Track Break Capacity?</span>
                            <button onClick={() => setConfig({...config, enableBreaks: !config.enableBreaks})} className={`w-12 h-6 rounded-full transition-colors relative ${config.enableBreaks ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.enableBreaks ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>
                        {config.enableBreaks && (
                            <div className="grid grid-cols-2 gap-4 animate-fade-in">
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Break (Mins)</label>
                                    <input type="number" value={config.breakDurationMinutes} onChange={(e) => setConfig({...config, breakDurationMinutes: parseInt(e.target.value) || 0})} className="w-full p-2 text-sm border border-slate-200 rounded-md" />
                                </div>
                                <div>
                                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Avg Shift (Hrs)</label>
                                    <input type="number" value={config.averageShiftLengthHours} onChange={(e) => setConfig({...config, averageShiftLengthHours: parseInt(e.target.value) || 0})} className="w-full p-2 text-sm border border-slate-200 rounded-md" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                            <label className="block text-sm font-bold text-slate-700 mb-2">Productivity Target (SPLH)</label>
                            <input type="range" min="20" max="100" value={config.targetSalesPerPersonPer15Min} onChange={(e) => setConfig({...config, targetSalesPerPersonPer15Min: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer mb-2" />
                            <div className="text-right font-mono font-bold text-blue-600 text-lg">${(config.targetSalesPerPersonPer15Min * 4).toFixed(0)}/hr SPLH</div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                                Minimum Floor Headcount
                            </label>
                            <div className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-2">
                                <button 
                                    onClick={() => setConfig({...config, minStaff: Math.max(1, config.minStaff - 1)})}
                                    className="w-10 h-10 rounded bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors shadow-sm"
                                >-</button>
                                <span className="text-2xl font-black text-slate-800">{config.minStaff}</span>
                                <button 
                                    onClick={() => setConfig({...config, minStaff: config.minStaff + 1})}
                                    className="w-10 h-10 rounded bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors shadow-sm"
                                >+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'schedule' ? (
          <>
            <MetricsHeader stats={stats} />
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                <div className="xl:col-span-9">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <h2 className="text-lg font-bold text-slate-800">Operational Timeline</h2>
                        <button onClick={() => setShowForecastModal(true)} className="text-sm bg-indigo-50 text-indigo-700 px-5 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-2 border border-indigo-100 shadow-sm">
                            <Calculator size={16} /> Forecast Adjuster
                        </button>
                    </div>

                    <div className="space-y-1">
                        {Object.keys(blockGroups).map(hour => (
                            <HourlyBlock key={hour} blocks={blockGroups[hour]} onUpdate={handleBlockUpdate} />
                        ))}
                    </div>
                </div>

                <div className="xl:col-span-3">
                    <div className="sticky top-24 space-y-6">
                        <StaffingChart blocks={activeBlocks} />

                        {config.enableBreaks && (
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-emerald-700 uppercase mb-2 flex items-center gap-2">
                                    <Coffee size={14} /> Break Impact Summary
                                </h4>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-emerald-600">Capacity Lost:</span>
                                    <span className="font-bold text-emerald-800">{stats.breakImpactHours.toFixed(1)} hrs</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-emerald-600">Est. Break Cost:</span>
                                    <span className="font-bold text-emerald-800">${stats.breakImpactCost.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-sm border border-indigo-100">
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2 mb-4">
                                <Sparkles size={18} className="text-indigo-500" /> AI Insights
                            </h3>
                            {!aiAnalysis && !isAnalyzing ? (
                                <button onClick={handleAIAnalysis} className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 w-full transition-all">Run Analysis</button>
                            ) : isAnalyzing ? (
                                <div className="flex flex-col items-center py-6 text-indigo-600">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                                    <span className="text-sm font-semibold">Analyzing...</span>
                                </div>
                            ) : (
                                <div className="animate-fade-in">
                                    <p className="text-sm text-slate-800 leading-relaxed italic mb-4">"{aiAnalysis?.summary}"</p>
                                    <ul className="space-y-3">
                                        {aiAnalysis?.keyInsights.map((insight, idx) => (
                                            <li key={idx} className="text-xs text-slate-700 bg-white/80 p-3 rounded-lg border border-indigo-100 flex gap-2">
                                                <span className="text-indigo-500 font-bold">#</span> {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          </>
        ) : (
          <HistoryView blocks={activeBlocks} stats={stats} config={config} />
        )}

        <ForecastModal isOpen={showForecastModal} onClose={() => setShowForecastModal(false)} currentTotalSales={stats.totalSales} onApplyTotal={handleApplyTotalSales} onApplyPercentage={(m) => { handleApplyTotalSales(stats.totalSales * m); }} />
      </main>
    </div>
  );
};

export default App;