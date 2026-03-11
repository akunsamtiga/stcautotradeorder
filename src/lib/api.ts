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

  /**
   * POST /auth/autotrade-login
   * Login khusus bot autotrade — selain email+password, backend juga
   * memverifikasi bahwa User ID terdaftar di whitelist autotrade affiliator.
   * Berbeda jalur dengan login biasa: jika ID tidak diwhitelist → 403.
   */
  async autotradeLogin(email: string, password: string) {
    const { data } = await this.client.post('/auth/autotrade-login', { email, password });
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

  async googleLogin(payload: {
    idToken: string;
    displayName?: string;
    photoURL?: string;
    referralCode?: string;
    affiliateCode?: string;
  }) {
    const { data } = await this.client.post('/auth/google', payload);
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

  async getProfile() {
    const { data } = await this.client.get('/auth/profile');
    return data;
  }

  async updateProfile(userData: Partial<{ fullName: string; phoneNumber: string }>) {
    const { data } = await this.client.patch('/auth/profile', userData);
    return data;
  }

  // ============================================================================
  // USER PROFILE METHODS (NEW)
  // ============================================================================

  async getUserProfile() {
    try {
      const { data } = await this.client.get('/user/profile');
      console.log('✅ User profile:', data);
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to fetch user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userData: any) {
    try {
      const { data } = await this.client.put('/user/profile', userData);
      console.log('✅ Profile updated:', data);
      return data.success ? data.data : data;
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  async getUserPreferences() {
    try {
      const { data } = await this.client.get('/user/preferences');
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to fetch preferences:', error);
      throw error;
    }
  }

  async updateUserPreferences(preferences: any) {
    try {
      const { data } = await this.client.put('/user/preferences', preferences);
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to update preferences:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    try {
      const { data } = await this.client.post('/user/change-password', {
        currentPassword,
        newPassword,
        confirmNewPassword: newPassword,
      });
      return data;
    } catch (error: any) {
      console.error('❌ Failed to change password:', error);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  }

  async getAffiliateStats() {
    try {
      const { data } = await this.client.get('/user/affiliate');
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to fetch affiliate stats:', error);
      throw error;
    }
  }

  async getVerificationStatus() {
    try {
      const { data } = await this.client.get('/user/verification-status');
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to fetch verification status:', error);
      throw error;
    }
  }

  async uploadAvatar(avatarData: { url: string }) {
    try {
      const { data } = await this.client.post('/user/avatar', avatarData);
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to upload avatar:', error);
      throw error;
    }
  }

  async uploadKTP(ktpData: { frontUrl: string; backUrl: string; number?: string }) {
    try {
      const { data } = await this.client.post('/user/ktp', ktpData);
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to upload KTP:', error);
      throw error;
    }
  }

  async uploadSelfie(selfieData: { url: string }) {
    try {
      const { data } = await this.client.post('/user/selfie', selfieData);
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to upload selfie:', error);
      throw error;
    }
  }

  async verifyPhone(phoneNumber: string, code: string) {
    try {
      const { data } = await this.client.post('/user/verify-phone', {
        phoneNumber,
        code,
      });
      return data;
    } catch (error) {
      console.error('❌ Failed to verify phone:', error);
      throw error;
    }
  }

  async completeTutorial() {
    try {
      const { data } = await this.client.post('/user/complete-tutorial');
      return data;
    } catch (error) {
      console.error('❌ Failed to complete tutorial:', error);
      throw error;
    }
  }

  async resetTutorial() {
    try {
      const { data } = await this.client.post('/user/reset-tutorial');
      return data;
    } catch (error) {
      console.error('❌ Failed to reset tutorial:', error);
      throw error;
    }
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

  async getDemoBalance() {
    try {
      const { data } = await this.client.get('/balance/demo');
      return data.data?.balance || 0;
    } catch (error) {
      console.error('Failed to fetch demo balance:', error);
      throw error;
    }
  }

  async getRealBalance() {
    try {
      const { data } = await this.client.get('/balance/real');
      return data.data?.balance || 0;
    } catch (error) {
      console.error('Failed to fetch real balance:', error);
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

  async getBalanceHistory(accountType?: 'demo' | 'real', limit: number = 50) {
    try {
      const params: any = { limit };
      if (accountType) params.accountType = accountType;

      const { data } = await this.client.get('/balance/history', { params });
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to fetch balance history:', error);
      throw error;
    }
  }

  // ============================================================================
  // BINARY ORDERS METHODS
  // ============================================================================

  // ✅ UPDATED: Added 'DRAW' to status union type to match backend
  async getBinaryOrders(query?: {
    status?: 'PENDING' | 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED' | 'DRAW';
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

  async createBinaryOrder(orderData: {
    assetId: string;
    direction: 'CALL' | 'PUT';
    amount: number;
    duration: number;
    accountType: 'demo' | 'real';
  }) {
    try {
      const { data } = await this.client.post('/binary-orders', orderData);
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to create binary order:', error);
      throw error;
    }
  }

  async getBinaryOrder(orderId: string) {
    try {
      const { data } = await this.client.get(`/binary-orders/${orderId}`);
      return data.success ? data.data : data;
    } catch (error) {
      console.error(`❌ Failed to fetch binary order ${orderId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // ASSETS METHODS
  // ============================================================================

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
      // Format 4: Direct array [...]
      else if (Array.isArray(data)) {
        assets = data;
        console.log('✅ Using direct array format');
      }
      else {
        console.warn('⚠️ Unexpected assets response format:', data);
        console.warn('Available keys:', Object.keys(data));
        assets = [];
      }

      // Filter only active assets
      const activeAssets = assets.filter((asset: any) => 
        asset.isActive === true || asset.isActive === 'true'
      );
      
      console.log(`✅ Found ${activeAssets.length} active assets out of ${assets.length} total assets`);
      
      return activeAssets;
    } catch (error: any) {
      console.error('❌ Failed to fetch active assets:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Return empty array instead of throwing to prevent app crash
      return [];
    }
  }

  async getAllAssets() {
    try {
      const { data } = await this.client.get('/assets');
      
      if (data.success && data.data && Array.isArray(data.data.assets)) {
        return data.data.assets;
      } else if (data.success && Array.isArray(data.data)) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      }
      
      return [];
    } catch (error) {
      console.error('❌ Failed to fetch all assets:', error);
      return [];
    }
  }

  // ============================================================================
  // ORDER SCHEDULE METHODS
  // ============================================================================

  async getOrderSchedules(query?: {
    status?: 'pending' | 'active' | 'paused' | 'completed' | 'cancelled';
    accountType?: 'demo' | 'real';
    assetSymbol?: string;
  }) {
    try {
      console.log('📦 Fetching order schedules with query:', query);
      
      const { data } = await this.client.get('/order-schedule', {
        params: query
      });
      
      console.log('✅ Order schedules response:', data);
      
      // Handle different response formats
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      } else if (Array.isArray(data)) {
        return data;
      } else if (data.success && data.schedules) {
        return data.schedules;
      } else {
        console.warn('⚠️ Unexpected response format:', data);
        return [];
      }
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
        
        // Only count completed orders (WON, LOST, or DRAW)
        const isCompleted = order.status === 'WON' || order.status === 'LOST' || order.status === 'DRAW';
        
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
        // DRAW orders don't affect profit but count as execution
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

  // ============================================================================
  // NOTIFICATIONS METHODS
  // ============================================================================

  async getNotifications(limit: number = 20) {
    try {
      const { data } = await this.client.get('/notifications', {
        params: { limit }
      });
      return data.success ? data.data : data;
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: string) {
    try {
      const { data } = await this.client.patch(`/notifications/${notificationId}/read`);
      return data;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead() {
    try {
      const { data } = await this.client.post('/notifications/mark-all-read');
      return data;
    } catch (error) {
      console.error('❌ Failed to mark all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId: string) {
    try {
      const { data } = await this.client.delete(`/notifications/${notificationId}`);
      return data;
    } catch (error) {
      console.error('❌ Failed to delete notification:', error);
      throw error;
    }
  }
  // ============================================================================
  // FAST TRADE METHODS
  // ============================================================================

  async createFastTradeSession(data: {
    assetId: string;
    timeframe: string;
    accountType: string;
    amount: number;
    martingale: { enabled: boolean; maxStep: number; multiplier: number };
    stopProfit?: number;
    stopLoss?: number;
  }) {
    const { data: res } = await this.client.post('/fast-trade', data);
    return res?.data ?? res;
  }

  async stopFastTradeSession(sessionId: string) {
    const { data: res } = await this.client.post(`/fast-trade/${sessionId}/stop`);
    return res?.data ?? res;
  }

  async getActiveFastTradeSession() {
    const { data: res } = await this.client.get('/fast-trade/active');
    return res?.data ?? res;
  }

  async getFastTradeSession(sessionId: string) {
    const { data: res } = await this.client.get(`/fast-trade/${sessionId}`);
    return res?.data ?? res;
  }

  async getFastTradeSessions(activeOnly = false) {
    const { data: res } = await this.client.get(`/fast-trade?activeOnly=${activeOnly}`);
    return res?.data ?? res;
  }

  async getFastTradeExecutions(sessionId: string, limit = 50) {
    const { data: res } = await this.client.get(`/fast-trade/${sessionId}/executions?limit=${limit}`);
    return res?.data ?? res;
  }

  async getOhlcData(assetId: string, timeframe = '1m', limit = 10) {
    const { data: res } = await this.client.get(`/fast-trade/ohlc/${assetId}?timeframe=${timeframe}&limit=${limit}`);
    return res?.data ?? res;
  }

  // ============================================================================
  // CTC (COPY THE CANDLE) METHODS
  // ============================================================================

  async createCtcSession(data: {
    assetId: string;
    accountType: string;
    amount: number;
    martingale: { enabled: boolean; maxStep: number; multiplier: number };
    stopProfit?: number;
    stopLoss?: number;
  }) {
    const { data: res } = await this.client.post('/ctc', data);
    return res?.data ?? res;
  }

  async stopCtcSession(sessionId: string) {
    const { data: res } = await this.client.post(`/ctc/${sessionId}/stop`);
    return res?.data ?? res;
  }

  async getActiveCtcSession() {
    const { data: res } = await this.client.get('/ctc/active');
    return res?.data ?? res;
  }

  async getCtcSession(sessionId: string) {
    const { data: res } = await this.client.get(`/ctc/${sessionId}`);
    return res?.data ?? res;
  }

  async getCtcSessions(activeOnly = false) {
    const { data: res } = await this.client.get(`/ctc?activeOnly=${activeOnly}`);
    return res?.data ?? res;
  }

  async getCtcExecutions(sessionId: string, limit = 50) {
    const { data: res } = await this.client.get(`/ctc/${sessionId}/executions?limit=${limit}`);
    return res?.data ?? res;
  }

  async getCtcOhlcData(assetId: string, limit = 20) {
    const { data: res } = await this.client.get(`/ctc/ohlc/${assetId}?limit=${limit}`);
    return res?.data ?? res;
  }

  // ============================================================================
  // AFFILIATE PROGRAM METHODS
  // ============================================================================

  /** GET /affiliate-program/my-program — dashboard affiliator (termasuk info autotrade) */
  async getMyAffiliateProgram() {
    try {
      const { data } = await this.client.get('/affiliate-program/my-program');
      return data.success ? data.data : data;
    } catch (error: any) {
      // 403 = bukan affiliator, return null agar page bisa handle gracefully
      if (error?.response?.status === 403) return null;
      console.error('❌ Failed to fetch affiliate program:', error);
      return null;
    }
  }

  // ============================================================================
  // AUTOTRADE WHITELIST METHODS
  // ============================================================================

  /**
   * GET /affiliate-program/autotrade/whitelist
   * Ambil daftar whitelist milik affiliator yang sedang login.
   * ⚠️  Hanya berhasil jika user adalah affiliator dengan autotrade aktif.
   */
  async getAutotradeWhitelist(params?: { page?: number; limit?: number }) {
    try {
      const { data } = await this.client.get('/affiliate-program/autotrade/whitelist', { params });
      return data.success ? data.data : data;
    } catch (error: any) {
      console.error('❌ Failed to fetch autotrade whitelist:', error);
      throw error;
    }
  }

  /**
   * POST /affiliate-program/autotrade/whitelist
   * Tambah user ID ke whitelist autotrade.
   */
  async addAutotradeWhitelist(payload: { userId: string; note?: string }) {
    try {
      const { data } = await this.client.post('/affiliate-program/autotrade/whitelist', payload);
      return data.success ? data.data : data;
    } catch (error: any) {
      console.error('❌ Failed to add to autotrade whitelist:', error);
      throw error;
    }
  }

  /**
   * DELETE /affiliate-program/autotrade/whitelist/:targetUserId
   * Hapus user ID dari whitelist autotrade.
   */
  async removeAutotradeWhitelist(targetUserId: string) {
    try {
      const { data } = await this.client.delete(
        `/affiliate-program/autotrade/whitelist/${targetUserId}`
      );
      return data.success ? data.data : data;
    } catch (error: any) {
      console.error('❌ Failed to remove from autotrade whitelist:', error);
      throw error;
    }
  }

  /**
   * GET /affiliate-program/autotrade/whitelist/check/:targetUserId
   * Cek apakah user ID tertentu ada di whitelist autotrade.
   */
  async checkAutotradeWhitelist(targetUserId: string) {
    try {
      const { data } = await this.client.get(
        `/affiliate-program/autotrade/whitelist/check/${targetUserId}`
      );
      return data.success ? data.data : data;
    } catch (error: any) {
      console.error('❌ Failed to check autotrade whitelist:', error);
      throw error;
    }
  }

}

export const api = new ApiClient();