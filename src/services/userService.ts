import { api, withPagination, PaginationParams } from "@/lib/api";
import { User, ApiResponse } from "@/types";

export interface UserFilters extends PaginationParams {
  role?: "admin" | "moderator" | "user";
  isActive?: boolean;
  isVerified?: boolean;
  email?: string;
  phone?: string;
  createdFrom?: string;
  createdTo?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  phone: string;
  role: "admin" | "moderator" | "user";
  password: string;
  isActive?: boolean;
  isVerified?: boolean;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: "admin" | "moderator" | "user";
  isActive?: boolean;
  isVerified?: boolean;
  avatar?: string | null;
  password?: string;
  preferences?: {
    notifications?: { email?: boolean; sms?: boolean; push?: boolean };
    privacy?: { profileVisibility?: "public" | "private"; dataSharing?: boolean };
  };
  nid?: {
    front?: string | null;
    back?: string | null;
    verified?: boolean;
  };
  referralCode?: string | null;
  referredBy?: string | null;
  referralRewards?: number;
  loginAttempts?: number;
  lockUntil?: string | null;
  profileCompletion?: {
    basicInfo?: boolean;
    contactVerified?: boolean;
    identityVerified?: boolean;
    percentage?: number;
  };
  emailVerification?: {
    attempts?: number;
    expires?: string | null;
  };
  registrationIP?: string | null;
}

class UserService {
  private baseEndpoint = "/accounts";

  async getUsers(filters?: UserFilters): Promise<ApiResponse<User[]>> {
    const params = filters ? withPagination(filters) : {};
    return api.get<User[]>(this.baseEndpoint, params);
  }

  async getUser(phone: string): Promise<ApiResponse<User>> {
    return api.get<User>(`${this.baseEndpoint}/${phone}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserAddresses(phone: string): Promise<ApiResponse<any[]>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.get<any[]>(`${this.baseEndpoint}/${phone}/address`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async uploadUserFile(phone: string, type: "avatar" | "nid-front" | "nid-back", dataUrl: string): Promise<ApiResponse<any>> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.post<any>(`${this.baseEndpoint}/${phone}/upload`, { type, dataUrl });
  }

  async createUser(data: CreateUserData): Promise<ApiResponse<User>> {
    return api.post<User>(this.baseEndpoint, data);
  }

  async updateUser(phone: string, data: UpdateUserData): Promise<ApiResponse<User>> {
    return api.put<User>(`${this.baseEndpoint}/${phone}`, data);
  }

  async deleteUser(phone: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`${this.baseEndpoint}/${phone}`);
  }

  async getUserStats(): Promise<ApiResponse<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    adminCount: number;
    moderatorCount: number;
    userCount: number;
    todayRegistrations: number;
    weeklyRegistrations: number;
    monthlyRegistrations: number;
  }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.get<any>(`${this.baseEndpoint}/stats`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserPermissions(phone: string): Promise<ApiResponse<any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.get<any>(`${this.baseEndpoint}/${phone}/permissions`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updateUserPermissions(phone: string, permissions: any): Promise<ApiResponse<any>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.put<any>(`${this.baseEndpoint}/${phone}/permissions`, permissions);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserOrders(phone: string): Promise<ApiResponse<any[]>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.get<any[]>(`${this.baseEndpoint}/${phone}/orders`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserNotifications(phone: string): Promise<ApiResponse<any[]>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.get<any[]>(`${this.baseEndpoint}/${phone}/notifications`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getUserSigninHistory(phone: string): Promise<ApiResponse<any[]>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.get<any[]>(`${this.baseEndpoint}/${phone}/sigin-historys`);
  }

  async exportUsers(filters?: UserFilters, format: "csv" | "xlsx" = "csv"): Promise<Blob> {
    const params = filters ? withPagination(filters) : {};
    params.format = format;
    
    const response = await fetch(`/api/v1${this.baseEndpoint}/export?${new URLSearchParams(params)}`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Export failed");
    }

    return response.blob();
  }

  async bulkUpdateUsers(
    phones: string[], 
    updates: Partial<UpdateUserData>
  ): Promise<ApiResponse<{ updated: number; failed: string[] }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.patch<any>(`${this.baseEndpoint}/bulk`, {
      phones,
      updates,
    });
  }

  async toggleUserStatus(phone: string, isActive: boolean): Promise<ApiResponse<User>> {
    return api.patch<User>(`${this.baseEndpoint}/${phone}`, { isActive });
  }

  async verifyUser(phone: string): Promise<ApiResponse<User>> {
    return api.patch<User>(`${this.baseEndpoint}/${phone}`, { isVerified: true });
  }

  async verifyNid(phone: string, verified: boolean): Promise<ApiResponse<User>> {
    return api.patch<User>(`${this.baseEndpoint}/${phone}`, { nid: { verified } });
  }

  async resetUserPassword(phone: string): Promise<ApiResponse<{ message: string }>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return api.post<any>(`${this.baseEndpoint}/${phone}/reset-password`, {});
  }
}

export const userService = new UserService();