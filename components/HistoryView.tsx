import React from 'react';
import { TimeBlock, DailyStats, ProductivityConfig } from '../types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Users, DollarSign, Target, Sparkles } from 'lucide-react';

interface Props {
  blocks: TimeBlock[];
  stats: DailyStats;
  config: ProductivityConfig;
}

const HistoryView: React.FC<Props> = ({ blocks, stats, config }) => {
  const salesVar = stats.actualTotalSales && stats.totalSales 
    ? ((stats.actualTotalSales - stats.totalSales) / stats.totalSales) * 100 
    : 0;
  
  const laborVar = stats.actualTotalLaborHours && stats.totalLaborHours
    ? ((stats.actualTotalLaborHours - stats.totalLaborHours) / stats.totalLaborHours) * 100
    : 0;

  const actualSPLH = stats.actualTotalLaborHours ? (stats.actualTotalSales || 0) / stats.actualTotalLaborHours : 0;
  const targetSPLH = config.targetSalesPerPersonPer15Min * 4;

  const getVarianceColor = (val: number, reverse: boolean = false) => {
    if (Math.abs(val) < 2) return 'text-slate-500 bg-slate-100';
    const positive = val > 0;
    if (reverse) return positive ? 'text-rose-600 bg-rose-50' : 'text-emerald-600 bg-emerald-50';
    return positive ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50';
  };

  // Prepare chart data - downsample if too many blocks for better readability
  const chartData = blocks.filter((_, i) => i % 2 === 0).map(block => ({
    time: block.timeLabel,
    Recommended: block.recommendedFOH + block.recommendedBOH,
    Actual: (block.actualFOH || 0) + (block.actualBOH || 0),
  }));

  return (
    <div className="animate-fade-in space-y-8">
      {/* High Level Performance Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Sales Variance</span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black ${getVarianceColor(salesVar)}`}>
              {salesVar >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
              {Math.abs(salesVar).toFixed(1)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">Actual:</span>
                <span className="text-2xl font-black text-slate-900">${stats.actualTotalSales?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">Forecast:</span>
                <span className="text-sm font-bold text-slate-600">${stats.totalSales.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Labor Hours Var</span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-black ${getVarianceColor(laborVar, true)}`}>
              {laborVar >= 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
              {Math.abs(laborVar).toFixed(1)}%
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">Actual:</span>
                <span className="text-2xl font-black text-slate-900">{stats.actualTotalLaborHours?.toFixed(1)} hrs</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">Planned:</span>
                <span className="text-sm font-bold text-slate-600">{stats.totalLaborHours.toFixed(1)} hrs</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Productivity (SPLH)</span>
            <Target size={18} className="text-blue-500" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">Actual:</span>
                <span className="text-2xl font-black text-slate-900">${actualSPLH.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-xs">Goal:</span>
                <span className="text-sm font-bold text-slate-600">${targetSPLH.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staffing Variance Chart */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Users size={18} className="text-blue-500" />
          Staffing Level Comparison (Actual vs Recommendation)
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                interval={4} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{fontSize: 10, fill: '#94a3b8'}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey="Recommended" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar dataKey="Actual" radius={[4, 4, 0, 0]} barSize={20}>
                {chartData.map((entry, index) => {
                  let color = '#10b981'; // On Target
                  if (entry.Actual > entry.Recommended) color = '#f43f5e'; // Over
                  if (entry.Actual < entry.Recommended) color = '#f59e0b'; // Under
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-[10px] font-black uppercase tracking-widest text-slate-400">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Recommended</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Optimized</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Understaffed</div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Overstaffed</div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Intraday Performance Variance</h3>
            <div className="flex gap-4 text-xs font-bold uppercase tracking-widest">
                <span className="flex items-center gap-1 text-emerald-600"><TrendingUp size={12}/> Beating Goal</span>
                <span className="flex items-center gap-1 text-rose-600"><TrendingDown size={12}/> Below Goal</span>
            </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Time Period</th>
                <th className="px-6 py-4">Planned Sales</th>
                <th className="px-6 py-4">Actual Sales</th>
                <th className="px-6 py-4">Rec Staff</th>
                <th className="px-6 py-4">Sched Staff</th>
                <th className="px-6 py-4">Actual Staff</th>
                <th className="px-6 py-4 text-right">Variance Score</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block, i) => {
                const sVar = block.actualSales ? block.actualSales - block.salesForecast : 0;
                const totalActualStaff = (block.actualFOH || 0) + (block.actualBOH || 0);
                const totalSchedStaff = block.scheduledFOH + block.scheduledBOH;
                const recStaff = block.recommendedFOH + block.recommendedBOH;
                
                // Score: 100 is perfect. -10 for every person off goal.
                const score = Math.max(0, 100 - (Math.abs(totalActualStaff - recStaff) * 15));

                return (
                  <tr key={block.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-blue-50/30 transition-colors border-b border-slate-100`}>
                    <td className="px-6 py-4 font-bold text-slate-900 text-sm">{block.timeLabel}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">${block.salesForecast.toLocaleString()}</td>
                    <td className={`px-6 py-4 font-bold text-sm ${sVar > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>
                        ${block.actualSales?.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-sm font-bold">{recStaff}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{totalSchedStaff}</td>
                    <td className={`px-6 py-4 font-black text-sm ${totalActualStaff > recStaff ? 'text-rose-600' : totalActualStaff < recStaff ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {totalActualStaff}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${score > 85 ? 'bg-emerald-100 text-emerald-700' : score > 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                            {score}%
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-600 rounded-2xl p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-xl">
        <div className="bg-white/10 p-4 rounded-full">
            <Sparkles size={48} />
        </div>
        <div className="flex-1">
            <h3 className="text-xl font-black mb-2 tracking-tight">Post-Shift Intelligence</h3>
            <p className="text-blue-100 text-sm leading-relaxed max-w-2xl">
                Based on historical data for this day, your sales forecast was {Math.abs(salesVar).toFixed(1)}% {salesVar > 0 ? 'conservative' : 'aggressive'}. 
                Staffing levels were {laborVar > 0 ? 'higher' : 'lower'} than planned by {Math.abs(laborVar).toFixed(1)}%. 
                Consider adjusting your base SPLH target for similar future days to recover lost margin.
            </p>
        </div>
        <button className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors whitespace-nowrap shadow-lg">
            Apply Learnings
        </button>
      </div>
    </div>
  );
};

export default HistoryView;