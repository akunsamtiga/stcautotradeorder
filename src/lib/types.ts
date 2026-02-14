// ============================================================================
// USER & AUTH TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  role: 'user' | 'admin' | 'superadmin';
  isEmailVerified: boolean;
  referralCode: string;
  balance?: {
    demo: number;
    real: number;
  };
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

// ============================================================================
// ORDER SCHEDULE TYPES
// ============================================================================

export type AccountType = 'demo' | 'real';
export type TrendType = 'buy' | 'sell';
export type ScheduleStatus = 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
export type ExecutionStatus = 'pending' | 'executed' | 'failed' | 'skipped';
export type ExecutionResult = 'win' | 'loss' | 'draw';

export interface ScheduleTime {
  time: string; // Format: "HH:mm"
  trend: TrendType;
}

export interface MartingaleSetting {
  maxStep: number; // 0-10
  multiplier: number; // 1.1-5
}

export interface StopLossProfit {
  stopProfit?: number;
  stopLoss?: number;
}

export interface OrderSchedule {
  id: string;
  userId: string;
  userEmail: string;
  
  // Asset & Account Info
  assetSymbol: string;
  assetName?: string;
  accountType: AccountType;
  
  // Order Settings
  duration: number; // dalam detik
  amount: number; // dalam IDR
  
  // Schedules
  schedules: ScheduleTime[];
  
  // Martingale Settings
  martingaleSetting: MartingaleSetting;
  
  // Stop Loss/Profit Settings
  stopLossProfit: StopLossProfit;
  
  // Status & Tracking
  status: ScheduleStatus;
  isActive: boolean;
  
  // Execution Tracking
  totalExecuted: number;
  totalSuccess: number;
  totalFailed: number;
  
  // Profit/Loss Tracking
  currentProfit: number;
  totalProfit: number;
  totalLoss: number;
  
  // Martingale Tracking
  currentMartingaleStep: number;
  consecutiveLosses: number;
  
  // Last Execution
  lastExecutedAt?: string;
  lastExecutionResult?: ExecutionResult;
  
  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  pausedAt?: string;
  
  // Additional tracking
  orderMartingaleStates?: Array<{
    scheduledTime: string;
    currentStep: number;
    consecutiveLosses: number;
    lastResult: 'win' | 'loss' | 'draw' | null;
  }>;
}

export interface CreateOrderScheduleDto {
  assetSymbol: string;
  assetName?: string;
  accountType: AccountType;
  duration: number; // 30-3600 seconds
  amount: number; // min 10000
  schedules: ScheduleTime[];
  martingaleSetting: MartingaleSetting;
  stopLossProfit: StopLossProfit;
  isActive?: boolean;
  notes?: string;
}

export interface UpdateOrderScheduleDto {
  assetSymbol?: string;
  assetName?: string;
  accountType?: AccountType;
  duration?: number;
  amount?: number;
  schedules?: ScheduleTime[];
  martingaleSetting?: MartingaleSetting;
  stopLossProfit?: StopLossProfit;
  status?: ScheduleStatus;
  isActive?: boolean;
  notes?: string;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  userId: string;
  
  // Execution Details
  executedAt: string;
  scheduledTime: string; // HH:mm
  trend: TrendType;
  
  // Order Details
  orderId?: string;
  assetSymbol: string;
  amount: number;
  duration: number;
  accountType: AccountType;
  
  // Martingale Info
  martingaleStep: number;
  isRecoveryAttempt: boolean;
  
  // Result
  status: ExecutionStatus;
  result?: ExecutionResult;
  profit?: number;
  
  // Error Info
  errorMessage?: string;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleStatistics {
  scheduleId: string;
  userId: string;
  
  // Daily Stats
  date: string; // YYYY-MM-DD
  
  totalExecuted: number;
  totalSuccess: number;
  totalFailed: number;
  totalSkipped: number;
  
  totalProfit: number;
  totalLoss: number;
  netProfit: number;
  
  winRate: number;
  
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
  
  maxMartingaleStepReached: number;
  
  createdAt: string;
  updatedAt: string;
}

export interface QueryOrderScheduleDto {
  accountType?: AccountType;
  status?: ScheduleStatus;
  assetSymbol?: string;
  fromDate?: string;
  toDate?: string;
}

// ============================================================================
// BALANCE TYPES
// ============================================================================

export interface BalanceResponse {
  demo?: {
    balance: number;
  };
  real?: {
    balance: number;
  };
}

export interface BalanceData {
  demo_balance: number;
  real_balance: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface ScheduleResponse {
  success: boolean;
  message?: string;
  data?: OrderSchedule;
}

export interface SchedulesResponse {
  success: boolean;
  message?: string;
  data?: OrderSchedule[];
}

export interface ExecutionsResponse {
  success: boolean;
  message?: string;
  data?: ScheduleExecution[];
}

export interface StatisticsResponse {
  success: boolean;
  message?: string;
  data?: ScheduleStatistics[];
}

// ============================================================================
// UI HELPER TYPES
// ============================================================================

export interface ScheduleRequirements {
  baseAmount: number;
  maxAmountPerSchedule: number;
  totalSchedules: number;
  maxPossibleLoss: number;
  recommendedBalance: number;
}

export interface AssetOption {
  symbol: string;
  name: string;
  category: 'Forex' | 'Crypto' | 'Stock' | 'Commodity' | 'Index';
}

export interface DurationOption {
  value: number; // seconds
  label: string;
  display: string;
}