import React, { useState } from 'react';
import { TimeBlock, StaffingStatus } from '../types';
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle, Lock, Unlock, ArrowRight } from 'lucide-react';

interface Props {
  blocks: TimeBlock[];
  onUpdate: (id: string, field: keyof TimeBlock, value: any) => void;
}

const HourlyBlock: React.FC<Props> = ({ blocks, onUpdate }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Aggregate stats for the collapsed header
  const totalSales = blocks.reduce((acc, b) => acc + b.salesForecast, 0);
  const totalRec = blocks.reduce((acc, b) => acc + (b.recommendedFOH + b.recommendedBOH), 0);
  const totalSched = blocks.reduce((acc, b) => acc + (b.scheduledFOH + b.scheduledBOH), 0);
  const hourLabel = blocks[0].hourLabel;
  
  // Diff based on total segments
  const diff = totalSched - totalRec;

  // Determine aggregate status
  let statusColor = 'border-l-4 border-l-emerald-500';
  if (totalSched < totalRec) statusColor = 'border-l-4 border-l-amber-500';
  if (totalSched > totalRec) statusColor = 'border-l-4 border-l-rose-500'; 

  const getStatusTooltip = (status: StaffingStatus) => {
    switch (status) {
      case StaffingStatus.TARGET: return "On Target";
      case StaffingStatus.OVER: return "Overstaffed";
      case StaffingStatus.UNDER: return "Understaffed";
      default: return "";
    }
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 mb-3 overflow-hidden ${statusColor} transition-all`}>
      {/* Header Row (Summary) */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4 sm:gap-6 w-1/3 sm:w-1/4">
          <button className="text-slate-400 p-1 hover:bg-slate-100 rounded">
            {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
          </button>
          <div>
            <h4 className="font-black text-slate-800 text-lg sm:text-xl tracking-tight leading-none mb-1">{hourLabel}</h4>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">${totalSales.toLocaleString()}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-10 flex-1 justify-center">
            <div className="text-center group">
                <span className="block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target</span>
                <span className="text-lg sm:text-2xl font-black text-slate-600">{totalRec}</span>
            </div>
             <div className="text-slate-200 hidden xs:block">
                <ArrowRight size={16} />
             </div>
            <div className="text-center">
                <span className="block text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Sched</span>
                <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-lg sm:text-2xl font-black text-slate-900">{totalSched}</span>
                    {diff !== 0 && (
                         <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${diff > 0 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                            {diff > 0 ? `+${diff}` : diff}
                         </span>
                    )}
                </div>
            </div>
        </div>
        
        <div className="w-1/4 flex justify-end px-2">
            {totalSched === totalRec ? (
                <span className="flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-emerald-100">
                    <CheckCircle2 size={16} /> <span className="hidden lg:inline">Optimized</span>
                </span>
            ) : totalSched < totalRec ? (
                <span className="flex items-center gap-2 text-amber-600 font-bold bg-amber-50 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-amber-100">
                    <AlertCircle size={16} /> <span className="hidden lg:inline">Understaffed</span>
                </span>
            ) : (
                <span className="flex items-center gap-2 text-rose-600 font-bold bg-rose-50 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm border border-rose-100">
                    <XCircle size={16} /> <span className="hidden lg:inline">Overstaffed</span>
                </span>
            )}
        </div>
      </div>

      {/* Expanded Detail Rows */}
      {isExpanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-2 space-y-2">
          {blocks.map(block => (
            <div key={block.id} className="flex flex-col xl:grid xl:grid-cols-12 gap-4 xl:gap-6 items-center py-4 px-4 sm:px-6 border border-slate-100 xl:border-transparent hover:border-slate-200 hover:bg-white rounded-xl transition-all bg-white xl:bg-transparent shadow-sm xl:shadow-none">
              
              {/* Top Row: Time & Mobile Controls */}
              <div className="w-full xl:w-auto flex justify-between items-center xl:col-span-1 xl:flex-col xl:gap-1">
                <div className="flex items-baseline gap-1">
                    <span className="text-base font-black text-slate-900">{block.timeLabel.split(' ')[0]}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{block.timeLabel.split(' ')[1]}</span>
                </div>
                
                {/* Status/Lock toggle shown on mobile for accessibility */}
                <div className="flex items-center gap-3 xl:hidden">
                    <div 
                        className={`w-2.5 h-2.5 rounded-full shadow-inner
                            ${block.status === StaffingStatus.TARGET ? 'bg-emerald-500' : ''}
                            ${block.status === StaffingStatus.OVER ? 'bg-rose-500' : ''}
                            ${block.status === StaffingStatus.UNDER ? 'bg-amber-500' : ''}
                        `} 
                    />
                    <button 
                        onClick={() => onUpdate(block.id, 'isLocked', !block.isLocked)}
                        className={`p-1.5 rounded-md transition-all ${block.isLocked ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                    >
                        {block.isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                </div>
              </div>

              {/* Input Segments: Stacks on mobile, Grid on tablet+ */}
              <div className="grid grid-cols-12 gap-3 sm:gap-4 w-full xl:col-span-10">
                  
                  {/* Sales Input - Full width on mobile, 1/3 on tablet */}
                  <div className="col-span-12 sm:col-span-4 xl:col-span-3">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1 uppercase tracking-widest">Segment Sales</label>
                    <div className="relative group">
                        <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">$</span>
                        <input 
                          type="number"
                          disabled={block.isLocked}
                          className="w-full pl-7 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm group-hover:border-slate-300 transition-all disabled:bg-slate-50 disabled:text-slate-400"
                          value={block.salesForecast}
                          onChange={(e) => onUpdate(block.id, 'salesForecast', parseInt(e.target.value) || 0)}
                        />
                    </div>
                  </div>

                   {/* FOH Section - Half width on mobile */}
                   <div className="col-span-6 sm:col-span-4 xl:col-span-4 bg-indigo-50/30 p-2 rounded-xl border border-indigo-100 flex gap-2 sm:gap-3">
                        <div className="flex-1">
                            <label className="text-[9px] text-indigo-500 font-black block mb-1 uppercase tracking-widest text-center">FOH Sched</label>
                            <input 
                            type="number"
                            disabled={block.isLocked}
                            className={`w-full bg-white border border-indigo-200 rounded-lg px-2 py-1.5 text-base text-center focus:ring-2 focus:ring-indigo-500 outline-none font-black shadow-sm disabled:bg-slate-50 disabled:text-slate-400 ${block.scheduledFOH !== block.recommendedFOH ? 'text-indigo-600' : 'text-slate-700'}`}
                            value={block.scheduledFOH}
                            onChange={(e) => onUpdate(block.id, 'scheduledFOH', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                            <div className="text-[8px] text-indigo-400 font-bold uppercase text-center mb-0.5">Target</div>
                            <div className={`h-[38px] w-9 sm:w-10 flex items-center justify-center text-sm font-black rounded-lg border ${block.scheduledFOH !== block.recommendedFOH ? 'bg-indigo-600 text-white border-indigo-600' : 'text-indigo-500 bg-white border-indigo-100'}`}>
                                {block.recommendedFOH}
                            </div>
                        </div>
                   </div>

                   {/* BOH Section - Half width on mobile */}
                   <div className="col-span-6 sm:col-span-4 xl:col-span-4 bg-orange-50/30 p-2 rounded-xl border border-orange-100 flex gap-2 sm:gap-3">
                        <div className="flex-1">
                            <label className="text-[9px] text-orange-500 font-black block mb-1 uppercase tracking-widest text-center">BOH Sched</label>
                            <input 
                            type="number"
                            disabled={block.isLocked}
                            className={`w-full bg-white border border-orange-200 rounded-lg px-2 py-1.5 text-base text-center focus:ring-2 focus:ring-orange-500 outline-none font-black shadow-sm disabled:bg-slate-50 disabled:text-slate-400 ${block.scheduledBOH !== block.recommendedBOH ? 'text-orange-600' : 'text-slate-700'}`}
                            value={block.scheduledBOH}
                            onChange={(e) => onUpdate(block.id, 'scheduledBOH', parseInt(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex flex-col justify-end">
                             <div className="text-[8px] text-orange-400 font-bold uppercase text-center mb-0.5">Target</div>
                            <div className={`h-[38px] w-9 sm:w-10 flex items-center justify-center text-sm font-black rounded-lg border ${block.scheduledBOH !== block.recommendedBOH ? 'bg-orange-600 text-white border-orange-600' : 'text-orange-500 bg-white border-orange-100'}`}>
                                {block.recommendedBOH}
                            </div>
                        </div>
                   </div>
              </div>

              {/* Desktop Status & Controls */}
              <div className="hidden xl:flex xl:col-span-1 justify-end items-center gap-4">
                  <button 
                      onClick={() => onUpdate(block.id, 'isLocked', !block.isLocked)}
                      className={`p-2 rounded-lg hover:bg-slate-100 transition-all ${block.isLocked ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                  >
                      {block.isLocked ? <Lock size={18} /> : <Unlock size={18} />}
                  </button>
                  <div 
                      className={`w-3 h-3 rounded-full shadow-inner
                        ${block.status === StaffingStatus.TARGET ? 'bg-emerald-500' : ''}
                        ${block.status === StaffingStatus.OVER ? 'bg-rose-500' : ''}
                        ${block.status === StaffingStatus.UNDER ? 'bg-amber-500' : ''}
                      `} 
                      title={getStatusTooltip(block.status)}
                  />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HourlyBlock;