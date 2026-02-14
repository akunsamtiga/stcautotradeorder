import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let isRefreshing = false;

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor - ambil token dari localStorage
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          try {
            const authStorage = localStorage.getItem('auth-storage');
            if (authStorage) {
              const { state } = JSON.parse(authStorage);
              const token = state?.token;
              
              if (token) {
                config.headers.Authorization = `Bearer ${token}`;
              }
            }
          } catch (error) {
            console.error('Error reading auth token:', error);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 && !isRefreshing) {
          isRefreshing = true;

          if (typeof window !== 'undefined') {
            // Clear auth storage
            localStorage.removeItem('auth-storage');
            
            // Redirect ke home page
            setTimeout(() => {
              window.location.href = '/';
              isRefreshing = false;
            }, 100);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // AUTH METHODS
  // ============================================================================

  async login(email: string, password: string) {
    const { data } = await this.client.post('/auth/login', { email, password });
    return data;
  }

  async register(userData: { 
    email: string; 
    password: string; 
    fullName?: string; 
    phoneNumber?: string; 
    referrerCode?: string 
  }) {
    const { data } = await this.client.post('/auth/register', userData);
    return data;
  }

  async verifyEmail(token: string) {
    const { data } = await this.client.post('/auth/verify-email', { token });
    return data;
  }

  async requestPasswordReset(email: string) {
    const { data } = await this.client.post('/auth/forgot-password', { email });
    return data;
  }

  async resetPassword(token: string, newPassword: string) {
    const { data } = await this.client.post('/auth/reset-password', { token, newPassword });
    return data;
  }

  // ============================================================================
  // USER METHODS
  // ============================================================================

  async getProfile() {
    const { data } = await this.client.get('/auth/profile');
    return data;
  }

  async updateProfile(userData: Partial<{ fullName: string; phoneNumber: string }>) {
    const { data } = await this.client.patch('/auth/profile', userData);
    return data;
  }

  // ============================================================================
  // BALANCE METHODS
  // ============================================================================

  async getBalance() {
    try {
      const { data } = await this.client.get('/balance/both');
      return {
        demo_balance: data.data?.demoBalance || 0,
        real_balance: data.data?.realBalance || 0,
      };
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      throw error;
    }
  }

  async deposit(amount: number, accountType: 'demo' | 'real') {
    const { data } = await this.client.post('/balance', { 
      accountType, 
      type: 'deposit',
      amount 
    });
    return data;
  }

  async withdraw(amount: number, accountType: 'demo' | 'real') {
    const { data } = await this.client.post('/balance', { 
      accountType, 
      type: 'withdrawal',
      amount 
    });
    return data;
  }

  // ============================================================================
  // BINARY ORDERS METHODS
  // ============================================================================

    async getBinaryOrders(query?: {
    status?: 'PENDING' | 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED';
    accountType?: 'demo' | 'real';
    page?: number;
    limit?: number;
  }) {
    try {
      console.log('📦 Fetching binary orders with query:', query);
      
      const { data } = await this.client.get('/binary-orders', {
        params: query
      });
      
      console.log('✅ Binary orders raw response:', data);
      
      // ✅ FIXED: Handle nested structure { success: true, data: { orders: [...] } }
      if (data.success && data.data && Array.isArray(data.data.orders)) {
        console.log(`✅ Found ${data.data.orders.length} orders in data.data.orders`);
        return data.data.orders;
      }
      // Format 2: { success: true, data: [...] }
      else if (data.success && Array.isArray(data.data)) {
        console.log(`✅ Found ${data.data.length} orders in data.data`);
        return data.data;
      }
      // Format 3: { success: true, orders: [...] }
      else if (data.success && Array.isArray(data.orders)) {
        console.log(`✅ Found ${data.orders.length} orders in data.orders`);
        return data.orders;
      }
      // Format 4: Direct array
      else if (Array.isArray(data)) {
        console.log(`✅ Found ${data.length} orders as direct array`);
        return data;
      }
      else {
        console.warn('⚠️ Unexpected response format:', data);
        console.warn('Available keys:', Object.keys(data));
        
        // Try to find orders array anywhere in the response
        if (data.data && typeof data.data === 'object') {
          const dataKeys = Object.keys(data.data);
          for (const key of dataKeys) {
            if (Array.isArray(data.data[key])) {
              console.log(`🔍 Found array at data.data.${key}`);
              return data.data[key];
            }
          }
        }
        
        return [];
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch binary orders:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async getAssetBySymbol(symbol: string) {
    try {
      const { data } = await this.client.get(`/assets/${symbol}`);
      return data.success ? data.data : data;
    } catch (error) {
      console.error(`Failed to fetch asset ${symbol}:`, error);
      throw error;
    }
  }

    async getActiveAssets() {
    try {
      console.log('🔍 Fetching active assets from:', `${API_URL}/assets`);
      
      const { data } = await this.client.get('/assets', {
        params: {
          isActive: true,
          activeOnly: true,
          limit: 100,
        }
      });
      
      console.log('📦 Raw response from /assets:', data);
      
      let assets = [];
      
      // ✅ NEW FORMAT: Handle nested structure { success: true, data: { assets: [...] } }
      if (data.success && data.data && Array.isArray(data.data.assets)) {
        assets = data.data.assets;
        console.log('✅ Using data.data.assets format (nested)');
      }
      // Format 2: { success: true, assets: [...] }
      else if (data.success && Array.isArray(data.assets)) {
        assets = data.assets;
        console.log('✅ Using data.assets format');
      }
      // Format 3: { success: true, data: [...] }
      else if (data.success && Array.isArray(data.data)) {
        assets = data.data;
        console.log('✅ Using data.data format');
      }
      // Format 4: Direct array
      else if (Array.isArray(data)) {
        assets = data;
        console.log('✅ Using direct array format');
      }
      // Format 5: { assets: [...] } without success flag
      else if (Array.isArray(data.assets)) {
        assets = data.assets;
        console.log('✅ Using data.assets (no success flag) format');
      }
      else {
        console.warn('⚠️ Unknown response format:', data);
        console.warn('Available keys:', Object.keys(data));
        
        // Try to find assets anywhere in the response
        if (data.data && typeof data.data === 'object') {
          console.log('Checking data.data for arrays...');
          const dataKeys = Object.keys(data.data);
          for (const key of dataKeys) {
            if (Array.isArray(data.data[key])) {
              console.log(`Found array at data.data.${key}`);
              assets = data.data[key];
              break;
            }
          }
        }
        
        if (assets.length === 0) {
          assets = [];
        }
      }
      
      console.log(`✅ Retrieved ${assets.length} assets:`, assets);
      
      // ✅ Filter active assets di client-side sebagai backup
      const activeAssets = assets.filter((asset: any) => {
        return asset.isActive === true || 
               asset.is_active === true || 
               asset.active === true ||
               asset.status === 'active';
      });
      
      console.log(`✅ Filtered to ${activeAssets.length} active assets`);
      
      if (activeAssets.length === 0) {
        console.warn('⚠️ No active assets found!');
        console.warn('Total assets received:', assets.length);
        console.warn('Sample asset:', assets[0]);
      }
      
      return activeAssets;
    } catch (error: any) {
      console.error('❌ Failed to fetch active assets:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  // ============================================================================
  // ORDER SCHEDULES METHODS
  // ============================================================================

  async getOrderSchedules(query?: {
    accountType?: 'demo' | 'real';
    status?: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
    assetSymbol?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    try {
      const params = new URLSearchParams();
      
      if (query?.accountType) params.append('accountType', query.accountType);
      if (query?.status) params.append('status', query.status);
      if (query?.assetSymbol) params.append('assetSymbol', query.assetSymbol);
      if (query?.fromDate) params.append('fromDate', query.fromDate);
      if (query?.toDate) params.append('toDate', query.toDate);
      
      const url = `/order-schedule${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('🔍 Fetching order schedules:', url);
      
      const { data } = await this.client.get(url);
      
      console.log('📦 Raw order schedules response:', data);
      
      // Handle different response formats
      if (data.success && Array.isArray(data.data)) {
        console.log('✅ Found schedules in data.data');
        return data.data;
      }
      
      if (Array.isArray(data)) {
        console.log('✅ Found schedules as direct array');
        return data;
      }
      
      console.warn('⚠️ Unexpected response format, returning empty array');
      return [];
    } catch (error: any) {
      console.error('❌ Failed to fetch order schedules:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  async getOrderSchedule(id: string) {
    try {
      const { data } = await this.client.get(`/order-schedule/${id}`);
      return data.success ? data.data : data;
    } catch (error) {
      console.error(`Failed to fetch order schedule ${id}:`, error);
      throw error;
    }
  }

  async createOrderSchedule(scheduleData: {
    assetSymbol: string;
    assetName?: string;
    accountType: 'demo' | 'real';
    duration: number;
    amount: number;
    schedules: Array<{ time: string; trend: 'buy' | 'sell' }>;
    martingaleSetting: { maxStep: number; multiplier: number };
    stopLossProfit?: { stopProfit?: number; stopLoss?: number };
    isActive?: boolean;
    notes?: string;
  }) {
    try {
      console.log('📤 Creating order schedule with data:', scheduleData);
      
      // Validate data sebelum dikirim
      if (!scheduleData.assetSymbol) {
        throw new Error('Asset symbol is required');
      }
      
      if (!scheduleData.schedules || scheduleData.schedules.length === 0) {
        throw new Error('At least one schedule is required');
      }
      
      if (scheduleData.amount < 10000) {
        throw new Error('Minimum amount is 10,000 IDR');
      }
      
      if (scheduleData.duration < 30) {
        throw new Error('Minimum duration is 30 seconds');
      }
      
      // Ensure proper format
      const payload = {
        assetSymbol: scheduleData.assetSymbol,
        assetName: scheduleData.assetName,
        accountType: scheduleData.accountType,
        duration: scheduleData.duration,
        amount: scheduleData.amount,
        schedules: scheduleData.schedules.map(s => ({
          time: s.time,
          trend: s.trend
        })),
        martingaleSetting: {
          maxStep: scheduleData.martingaleSetting.maxStep,
          multiplier: scheduleData.martingaleSetting.multiplier
        },
        stopLossProfit: scheduleData.stopLossProfit || {},
        isActive: scheduleData.isActive !== false, // Default true
        notes: scheduleData.notes || ''
      };
      
      console.log('📤 Sending payload:', payload);
      
      const { data } = await this.client.post('/order-schedule', payload);
      
      console.log('✅ Schedule created successfully:', data);
      
      return data.success ? data.data : data;
    } catch (error: any) {
      console.error('❌ Failed to create order schedule:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Throw with better error message
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create schedule';
      throw new Error(errorMessage);
    }
  }

  async updateOrderSchedule(id: string, scheduleData: any) {
    try {
      console.log(`📤 Updating schedule ${id} with:`, scheduleData);
      const { data } = await this.client.patch(`/order-schedule/${id}`, scheduleData);
      console.log('✅ Schedule updated:', data);
      return data.success ? data.data : data;
    } catch (error: any) {
      console.error(`❌ Failed to update order schedule ${id}:`, error);
      throw error;
    }
  }

  async deleteOrderSchedule(id: string) {
    try {
      console.log(`🗑️ Deleting schedule ${id}`);
      const { data } = await this.client.delete(`/order-schedule/${id}`);
      console.log('✅ Schedule deleted:', data);
      return data;
    } catch (error: any) {
      console.error(`❌ Failed to delete order schedule ${id}:`, error);
      throw error;
    }
  }

  async pauseOrderSchedule(id: string) {
    try {
      console.log(`⏸️ Pausing schedule ${id}`);
      const { data } = await this.client.post(`/order-schedule/${id}/pause`);
      console.log('✅ Schedule paused:', data);
      return data.success ? data.data : data;
    } catch (error: any) {
      console.error(`❌ Failed to pause order schedule ${id}:`, error);
      throw error;
    }
  }

  async resumeOrderSchedule(id: string) {
    try {
      console.log(`▶️ Resuming schedule ${id}`);
      const { data } = await this.client.post(`/order-schedule/${id}/activate`);
      console.log('✅ Schedule resumed:', data);
      return data.success ? data.data : data;
    } catch (error: any) {
      console.error(`❌ Failed to resume order schedule ${id}:`, error);
      throw error;
    }
  }

  async getOrderHistory(scheduleId: string, limit: number = 50) {
    try {
      const { data } = await this.client.get(
        `/order-schedule/${scheduleId}/executions`,
        { params: { limit } }
      );
      return data.success ? data.data : data;
    } catch (error) {
      console.error(`Failed to fetch order history for ${scheduleId}:`, error);
      throw error;
    }
  }

  async getOrderStatistics(scheduleId: string) {
    try {
      const { data } = await this.client.get(`/order-schedule/${scheduleId}/statistics`);
      return data.success ? data.data : data;
    } catch (error) {
      console.error(`Failed to fetch statistics for ${scheduleId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // TODAY STATS
  // ============================================================================

  async getTodayStats() {
    try {
      console.log('📊 Calculating today\'s statistics from binary orders...');
      
      // Define today's date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      console.log('📅 Date range:', {
        from: today.toISOString(),
        to: todayEnd.toISOString()
      });

      let totalProfit = 0;
      let totalExecutions = 0;
      let totalSuccess = 0;

      // Fetch orders with large limit to get all today's orders
      const allOrders = await this.getBinaryOrders({
        limit: 100 // Adjust sesuai kebutuhan
      });

      console.log(`📦 Fetched ${allOrders.length} orders`);

      if (!allOrders || allOrders.length === 0) {
        console.log('No orders found');
        return { profit: 0, executions: 0, winRate: 0 };
      }

      // Filter orders from today and calculate stats
      const todayOrders = allOrders.filter((order: any) => {
        // Check if order was created today
        if (!order.createdAt) return false;
        
        const orderDate = new Date(order.createdAt);
        const isToday = orderDate >= today && orderDate <= todayEnd;
        
        // Only count completed orders (WON or LOST)
        const isCompleted = order.status === 'WON' || order.status === 'LOST';
        
        return isToday && isCompleted;
      });

      console.log(`✅ Filtered to ${todayOrders.length} orders from today`);

      // Calculate stats from today's orders
      todayOrders.forEach((order: any) => {
        totalExecutions++;
        
        if (order.status === 'WON') {
          totalSuccess++;
          totalProfit += order.profit || 0;
        } else if (order.status === 'LOST') {
          // For LOST orders, profit is negative or 0
          // If profit field is null, it means -amount
          const loss = order.profit !== null ? order.profit : -order.amount;
          totalProfit += loss;
        }
      });

      const winRate = totalExecutions > 0 ? (totalSuccess / totalExecutions) * 100 : 0;

      console.log('✅ Today\'s stats calculated:', {
        profit: totalProfit,
        executions: totalExecutions,
        winRate: winRate.toFixed(2) + '%',
        wins: totalSuccess,
        losses: totalExecutions - totalSuccess
      });

      return {
        profit: totalProfit,
        executions: totalExecutions,
        winRate
      };

    } catch (error: any) {
      console.error('❌ Failed to calculate today\'s stats:', error);
      // Return zeros instead of throwing to prevent dashboard from breaking
      return { profit: 0, executions: 0, winRate: 0 };
    }
  }
}

export const api = new ApiClient();