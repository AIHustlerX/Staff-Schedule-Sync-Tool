import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { TimeBlock } from '../types';

interface Props {
  blocks: TimeBlock[];
}

const StaffingChart: React.FC<Props> = ({ blocks }) => {
  // Downsample data for cleaner chart (every hour or half hour)
  const chartData = blocks.filter((_, i) => i % 2 === 0).map(block => ({
    time: block.timeLabel,
    Recommended: block.recommendedFOH + block.recommendedBOH,
    Scheduled: block.scheduledFOH + block.scheduledBOH,
  }));

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">Total Staffing (FOH + BOH)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRecommended" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="time" 
              tick={{fontSize: 11, fill: '#94a3b8'}} 
              interval={8} 
              stroke="#e2e8f0"
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              tick={{fontSize: 11, fill: '#94a3b8'}} 
              stroke="#e2e8f0"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Area 
              type="monotone" 
              dataKey="Scheduled" 
              stroke="#6366f1" 
              fillOpacity={1} 
              fill="url(#colorScheduled)" 
              strokeWidth={2}
              activeDot={{ r: 4 }}
            />
            <Area 
              type="monotone" 
              dataKey="Recommended" 
              stroke="#10b981" 
              strokeDasharray="4 4" 
              fillOpacity={1} 
              fill="url(#colorRecommended)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StaffingChart;