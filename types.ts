export enum StaffingStatus {
  TARGET = 'TARGET',
  UNDER = 'UNDER',
  OVER = 'OVER',
}

export interface TimeBlock {
  id: string;
  timeLabel: string; // e.g., "10:15 AM"
  hourLabel: string; // e.g., "10 AM" for grouping
  salesForecast: number;
  
  // Scheduled (Split)
  scheduledFOH: number;
  scheduledBOH: number;
  
  // Calculated Recommendations (Split)
  recommendedFOH: number;
  recommendedBOH: number;

  // Actual Performance (New for Historical Review)
  actualSales?: number;
  actualFOH?: number;
  actualBOH?: number;

  status: StaffingStatus; // Aggregate status
  
  notes: string;
  isLocked: boolean;
}

export interface ProductivityConfig {
  targetSalesPerPersonPer15Min: number;
  intervalMinutes: number; // 15, 30, or 60
  minStaff: number;
  fohPercentage: number;
  bohPercentage: number;
  averageHourlyWage: number;
  startHour: number;
  endHour: number;
  
  // Break Tracking
  enableBreaks: boolean;
  breakDurationMinutes: number;
  averageShiftLengthHours: number;
}

export interface DailyStats {
  totalSales: number;
  totalLaborHours: number;
  totalLaborCost: number;
  laborPercentage: number;
  salesPerLaborHour: number;
  efficiencyScore: number;
  breakImpactHours: number;
  breakImpactCost: number;
  // New Historical Comparison Stats
  actualTotalSales?: number;
  actualTotalLaborHours?: number;
  salesVariance?: number;
  laborVariance?: number;
}

export interface AnalysisResult {
  summary: string;
  keyInsights: string[];
}