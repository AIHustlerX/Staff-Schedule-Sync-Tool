import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, DollarSign, Calculator } from 'lucide-react';

interface Props {
  currentTotalSales: number;
  isOpen: boolean;
  onClose: () => void;
  onApplyTotal: (newTotal: number) => void;
  onApplyPercentage: (percentage: number) => void;
}

const ForecastModal: React.FC<Props> = ({ 
  currentTotalSales, 
  isOpen, 
  onClose, 
  onApplyTotal,
  onApplyPercentage 
}) => {
  const [targetSales, setTargetSales] = useState(currentTotalSales);

  // Sync internal state when prop changes
  useEffect(() => {
    setTargetSales(currentTotalSales);
  }, [currentTotalSales, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 px-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex justify-between items-center">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calculator size={18} className="text-blue-600" />
            Smart Forecast Tools
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* Option 1: Set Total Goal */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Option 1: Set Daily Sales Goal
            </label>
            <p className="text-xs text-slate-500 mb-3">
              We will automatically distribute this amount across the day based on your historical curve.
            </p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <DollarSign size={16} className="absolute left-3 top-3 text-slate-400" />
                <input 
                  type="number" 
                  value={targetSales}
                  onChange={(e) => setTargetSales(parseInt(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-900"
                />
              </div>
              <button 
                onClick={() => { onApplyTotal(targetSales); onClose(); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-slate-400 text-xs uppercase font-bold">Or Adjust Current</span>
              <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Option 2: Percentage Adjust */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Option 2: Adjust for Event/Weather
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { onApplyPercentage(1.10); onClose(); }}
                className="flex items-center justify-center gap-2 py-3 border border-emerald-200 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
              >
                <TrendingUp size={18} />
                +10% Busy
              </button>
              <button 
                onClick={() => { onApplyPercentage(0.90); onClose(); }}
                className="flex items-center justify-center gap-2 py-3 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors font-medium"
              >
                <TrendingDown size={18} />
                -10% Slow
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForecastModal;