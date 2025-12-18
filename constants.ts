import { TimeBlock, StaffingStatus, ProductivityConfig } from './types';

export const DEFAULT_CONFIG: ProductivityConfig = {
  targetSalesPerPersonPer15Min: 45, // $180/hr SPLH target
  intervalMinutes: 15,
  minStaff: 3,
  fohPercentage: 50,
  bohPercentage: 50,
  averageHourlyWage: 16.50,
  startHour: 8,
  endHour: 22,
  enableBreaks: false,
  breakDurationMinutes: 30,
  averageShiftLengthHours: 6,
};

export const generateInitialBlocks = (
  startHour: number = 8, 
  endHour: number = 22, 
  interval: number = 15
): TimeBlock[] => {
  const blocks: TimeBlock[] = [];

  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      const timeLabel = `${h > 12 ? h - 12 : h === 0 || h === 24 ? 12 : h}:${m === 0 ? '00' : m} ${h >= 12 && h < 24 ? 'PM' : 'AM'}`;
      const hourLabel = `${h > 12 ? h - 12 : h === 0 || h === 24 ? 12 : h} ${h >= 12 && h < 24 ? 'PM' : 'AM'}`;
      
      const timeOfDay = h + (m / 60);
      let baseSales = 40 * (interval / 15);

      const lunchPeak = 450 * Math.exp(-Math.pow(timeOfDay - 12.5, 2) / 2) * (interval / 15);
      const dinnerPeak = 650 * Math.exp(-Math.pow(timeOfDay - 19, 2) / 3.5) * (interval / 15);

      let sales = baseSales + lunchPeak + dinnerPeak;
      const noise = sales * (Math.random() * 0.3 - 0.15);
      sales += noise;
      sales = Math.max(0, Math.round(sales / 5) * 5);

      blocks.push({
        id: `block-${h}-${m}-${interval}`,
        timeLabel,
        hourLabel,
        salesForecast: sales,
        scheduledFOH: 2,
        scheduledBOH: 2,
        recommendedFOH: 0, 
        recommendedBOH: 0,
        status: StaffingStatus.TARGET,
        notes: '',
        isLocked: false,
      });
    }
  }
  return blocks;
};