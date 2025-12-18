import React from 'react';
import { DailyStats } from '../types';
import { DollarSign, Users, Clock, Percent, Info, Coffee } from 'lucide-react';

interface Props {
  stats: DailyStats;
}

const MetricsHeader: React.FC<Props> = ({ stats }) => {
  let laborColor = 'text-slate-900';
  if (stats.laborPercentage > 0) {
      if (stats.laborPercentage < 22) laborColor = 'text-emerald-600';
      else if (stats.laborPercentage > 30) laborColor = 'text-rose-600';
      else laborColor = 'text-amber-600';
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <DollarSign size={16} /> Total Forecast
          </div>
          <span className="text-slate-300 cursor-help hover:text-blue-500 transition-colors" title="Total projected gross sales.">
            <Info size={14} />
          </span>
        </div>
        <div className="text-2xl font-black text-slate-900">
          ${stats.totalSales.toLocaleString()}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Percent size={16} /> Labor Cost %
          </div>
          <span className="text-slate-300 cursor-help hover:text-blue-500 transition-colors" title="Total Labor Expense / Total Sales.">
            <Info size={14} />
          </span>
        </div>
        <div className={`text-2xl font-black ${laborColor}`}>
          {stats.laborPercentage.toFixed(1)}%
        </div>
        <div className="flex items-center justify-between mt-1">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">${stats.totalLaborCost.toFixed(0)} Est. Expense</div>
            {stats.breakImpactCost > 0 && (
                <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-1" title="Cost of paid break time.">
                    <Coffee size={10} /> ${stats.breakImpactCost.toFixed(0)}
                </div>
            )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Users size={16} /> SPLH (Sales/Hr)
          </div>
          <span className="text-slate-300 cursor-help hover:text-blue-500 transition-colors" title="Sales per total labor hour.">
            <Info size={14} />
          </span>
        </div>
        <div className={`text-2xl font-black ${stats.salesPerLaborHour > 150 ? 'text-emerald-600' : 'text-slate-900'}`}>
          ${stats.salesPerLaborHour.toFixed(0)}
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 group relative">
         <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <Clock size={16} /> Labor Hours
          </div>
          <span className="text-slate-300 cursor-help hover:text-blue-500 transition-colors" title="Total man-hours scheduled.">
            <Info size={14} />
          </span>
        </div>
        <div className="text-2xl font-black text-slate-900">
          {stats.totalLaborHours.toFixed(1)} <span className="text-sm font-medium text-slate-400">HRS</span>
        </div>
        {stats.breakImpactHours > 0 && (
            <div className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-tight flex items-center gap-1">
                <Coffee size={10} /> {stats.breakImpactHours.toFixed(1)} hrs capacity loss
            </div>
        )}
      </div>
    </div>
  );
};

export default MetricsHeader;