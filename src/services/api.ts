const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.28:5000/api';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ msg: string; param: string; value: any }>;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  role: string;
  isEmailVerified: boolean;
  lastLogin?: string;
  lastLoginIP?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Hierarchy interfaces
export interface HierarchyNode {
  id: string;
  name: string;
  level: string;
  level_order: number;
  can_attach_device: boolean;
  children: HierarchyNode[];
  company_id?: string;
  parent_id?: string;
}

export interface HierarchyTree {
  [companyName: string]: {
    id: string;
    name: string;
    hierarchy: HierarchyNode[];
  };
}

export interface DashboardData {
  company: {
    id: string;
    name: string;
  };
  hierarchy: HierarchyTree;
  statistics: {
    totalDevices: number;
    totalLocations: number;
    regions: number;
    areas: number;
    fields: number;
    wells: number;
  };
  deviceTypeStats: Array<{
    type: string;
    count: number;
  }>;
  userRole: string;
  is_admin: boolean;
}

export interface Device {
  id: string;
  serial_number: string;
  type: string;
  logo?: string;
  metadata: any;
  created_at: string;
  location: string;
  company: string;
}

export interface ChartDataPoint {
  timestamp: string;
  gfr?: number;
  gor?: number;
  gvf?: number;
  ofr?: number;
  wfr?: number;
  wlr?: number;
  pressure?: number;
  temperature?: number;
  dataPoints?: number;
  // For hierarchy aggregated data
  totalGfr?: number;
  totalGor?: number;
  totalOfr?: number;
  totalWfr?: number;
  totalGvf?: number;
  totalWlr?: number;
  avgPressure?: number;
  avgTemperature?: number;
  deviceCount?: number;
}

export interface DeviceChartData {
  device: Device;
  chartData: ChartDataPoint[];
  latestData?: {
    timestamp: string;
    data: any;
    longitude?: number;
    latitude?: number;
  };
  timeRange: string;
  totalDataPoints: number;
}

export interface HierarchyChartData {
  hierarchy: HierarchyNode;
  chartData: ChartDataPoint[];
  devices: Array<{
    id: number;
    serialNumber: string;
    deviceType: string;
    hierarchyName: string;
    metadata: any;
    latestData?: any;
    latestDataTime?: string;
  }>;
  timeRange: string;
  totalDataPoints: number;
  totalDevices: number;
}

class ApiService {
  private getErrorMessage(error: any): string {
    // Handle different types of errors with user-friendly messages
    if (error.errors && Array.isArray(error.errors)) {
      return error.errors.map((err: any) => err.msg).join(', ');
    }
    
    if (error.message) {
      // Handle specific error types
      if (error.message.includes('email')) {
        if (error.message.includes('domain')) {
          return 'Your email domain is not authorized. Please contact your administrator.';
        }
        if (error.message.includes('exists')) {
          return 'An account with this email already exists. Please try signing in instead.';
        }
        if (error.message.includes('invalid')) {
          return 'Please enter a valid email address.';
        }
      }
      
      if (error.message.includes('password')) {
        if (error.message.includes('weak')) {
          return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.';
        }
        if (error.message.includes('incorrect')) {
          return 'The email or password you entered is incorrect. Please try again.';
        }
      }
      
      if (error.message.includes('verification')) {
        return 'Please verify your email address before signing in. Check your inbox for the verification link.';
      }
      
      if (error.message.includes('blocked') || error.message.includes('suspended')) {
        return 'Your account has been temporarily suspended. Please contact support for assistance.';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      // If the response is not successful, format the error message
      if (!data.success && data.message) {
        return {
          ...data,
          message: this.getErrorMessage(data),
        };
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
      };
    }
  }

  // Authentication endpoints
  async login(credentials: LoginRequest): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(userData: SignupRequest): Promise<ApiResponse<{ user: User }>> {
    const { confirmPassword, acceptTerms, ...signupData } = userData;
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ApiResponse> {
    return this.makeRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendVerification(email: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async getCurrentUser(token: string): Promise<ApiResponse<{ user: User }>> {
    return this.makeRequest('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async logout(token: string): Promise<ApiResponse> {
    return this.makeRequest('/auth/logout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Company domain validation
  async checkDomain(domain: string): Promise<ApiResponse<{ isAllowed: boolean; company: any }>> {
    return this.makeRequest(`/company/check-domain/${domain}`, {
      method: 'GET',
    });
  }

  // User profile endpoints
  async updateProfile(data: { firstName?: string; lastName?: string; company?: string }, token: string): Promise<ApiResponse<{ user: User }>> {
    return this.makeRequest('/user/profile', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async changePassword(data: ChangePasswordRequest, token: string): Promise<ApiResponse> {
    return this.makeRequest('/user/change-password', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
  }

  async validateEmail(email: string): Promise<ApiResponse<{ valid: boolean; reason: string }>> {
    return this.makeRequest('/auth/validate-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return this.makeRequest(`/auth/reset-password/${token}`, {
      method: 'PUT',
      body: JSON.stringify({ password }),
    });
  }

  // Hierarchy endpoints
  async getHierarchyTree(token: string): Promise<ApiResponse<{ hierarchy: HierarchyTree }>> {
    return this.makeRequest('/hierarchy/tree', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDashboardData(token: string): Promise<ApiResponse<DashboardData>> {
    return this.makeRequest('/hierarchy/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAllDevices(token: string): Promise<ApiResponse<{ devices: Device[]; total: number; company_id: number }>> {
    return this.makeRequest('/hierarchy/devices', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDeviceById(deviceId: string, token: string): Promise<ApiResponse<{ device: Device }>> {
    return this.makeRequest(`/hierarchy/devices/${deviceId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getAllHierarchies(token: string): Promise<ApiResponse<{ hierarchies: HierarchyNode[] }>> {
    return this.makeRequest('/hierarchy', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getHierarchy(hierarchyId: string, token: string): Promise<ApiResponse<{ hierarchy: HierarchyNode }>> {
    return this.makeRequest(`/hierarchy/${hierarchyId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Charts endpoints
  async getDeviceChartData(deviceId: string, timeRange: string = 'day', token: string): Promise<ApiResponse<DeviceChartData>> {
    // Ensure deviceId is a valid number string
    const numericDeviceId = parseInt(deviceId);
    if (isNaN(numericDeviceId)) {
      return {
        success: false,
        message: 'Invalid device ID provided'
      };
    }
    
    return this.makeRequest(`/charts/device/${deviceId}?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getHierarchyChartData(hierarchyId: string, timeRange: string = 'day', token: string): Promise<ApiResponse<HierarchyChartData>> {
    // Ensure hierarchyId is a valid number string
    const numericHierarchyId = parseInt(hierarchyId);
    if (isNaN(numericHierarchyId)) {
      return {
        success: false,
        message: 'Invalid hierarchy ID provided'
      };
    }
    
    return this.makeRequest(`/charts/hierarchy/${hierarchyId}?timeRange=${timeRange}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getDeviceRealtimeData(deviceId: string, token: string): Promise<ApiResponse<{ device: Device; latestData: any }>> {
    return this.makeRequest(`/charts/device/${deviceId}/realtime`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  async getChartsDashboardData(token: string): Promise<ApiResponse<any>> {
    return this.makeRequest('/charts/dashboard', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export const apiService = new ApiService();