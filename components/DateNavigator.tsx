import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface Props {
  date: Date;
  onChange: (date: Date) => void;
}

const DateNavigator: React.FC<Props> = ({ date, onChange }) => {
  const handlePrev = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 1);
    onChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 1);
    onChange(newDate);
  };

  // Format: "Wed, Oct 25"
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200 shadow-sm mb-4">
      <button 
        onClick={handlePrev}
        className="p-2 hover:bg-slate-100 rounded text-slate-500"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div className="flex items-center gap-2">
        <Calendar size={18} className="text-blue-600" />
        <span className="font-bold text-slate-800 text-lg">{formattedDate}</span>
        {isToday && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            Today
          </span>
        )}
      </div>

      <button 
        onClick={handleNext}
        className="p-2 hover:bg-slate-100 rounded text-slate-500"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default DateNavigator;