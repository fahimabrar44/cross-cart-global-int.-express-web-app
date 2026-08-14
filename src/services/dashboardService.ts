import { apiService, ApiResponse } from "./apiService";

// User Management Service
export class UserService {
  static async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    isActive?: boolean;
    search?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<ApiResponse<any[]>> {
    return apiService.get("/accounts", params);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getUserByPhone(phone: string): Promise<ApiResponse<any>> {
    return apiService.get(`/accounts/${phone}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateUser(phone: string, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/accounts/${phone}`, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async deleteUser(phone: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/accounts/${phone}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getUserAddresses(phone: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`/accounts/${phone}/address`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getUserOrders(phone: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`/accounts/${phone}/orders`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getUserNotifications(phone: string): Promise<ApiResponse<any[]>> {
    return apiService.get(`/accounts/${phone}/notifications`);
  }
}

// Order Management Service
export class OrderService {
  static async getOrders(params?: {
    page?: number;
    limit?: number;
    trackId?: string;
    priority?: string;
    orderType?: string;
    search?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<ApiResponse<any[]>> {
    return apiService.get("/orders", params);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getOrder(orderId: string): Promise<ApiResponse<any>> {
    return apiService.get(`/orders/${orderId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createOrder(data: any): Promise<ApiResponse<any>> {
    return apiService.post("/orders", data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateOrder(orderId: string, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/orders/${orderId}`, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async deleteOrder(orderId: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/orders/${orderId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateOrderPayment(orderId: string, data: any): Promise<ApiResponse<any>> {
    return apiService.post(`/orders/${orderId}/payment`, data);
  }
}

// Analytics Service
export class AnalyticsService {
  static async getOverview(params?: {
    startDate?: string;
    endDate?: string;
    days?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<ApiResponse<any>> {
    return apiService.get("/analytics", params);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getUserAnalytics(): Promise<ApiResponse<any>> {
    return apiService.get("/analytics/user-analytics");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getOrderAnalytics(): Promise<ApiResponse<any>> {
    return apiService.get("/analytics/order-analytics");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getRevenueAnalytics(): Promise<ApiResponse<any>> {
    return apiService.get("/analytics/revenue-analytics");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getLoginAnalytics(): Promise<ApiResponse<any>> {
    return apiService.get("/analytics/login-analytics");
  }
}

// Content Management Service
export class ContentService {
  static async getBlogs(params?: {
    page?: number;
    limit?: number;
    search?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<ApiResponse<any[]>> {
    return apiService.get("/blogs", params);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getBlog(blogId: string): Promise<ApiResponse<any>> {
    return apiService.get(`/blogs/${blogId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createBlog(data: any): Promise<ApiResponse<any>> {
    return apiService.post("/blogs", data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateBlog(blogId: string, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/blogs/${blogId}`, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async deleteBlog(blogId: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/blogs/${blogId}`);
  }

  static async getReviews(params?: {
    page?: number;
    limit?: number;
    search?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<ApiResponse<any[]>> {
    return apiService.get("/reviews", params);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getReview(reviewId: string): Promise<ApiResponse<any>> {
    return apiService.get(`/reviews/${reviewId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createReview(data: any): Promise<ApiResponse<any>> {
    return apiService.post("/reviews", data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateReview(reviewId: string, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/reviews/${reviewId}`, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async deleteReview(reviewId: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/reviews/${reviewId}`);
  }
}

// Notification Service
export class NotificationService {
  static async getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<ApiResponse<any[]>> {
    return apiService.get("/notifications", params);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getNotification(notificationId: string): Promise<ApiResponse<any>> {
    return apiService.get(`/notifications/${notificationId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createNotification(data: any): Promise<ApiResponse<any>> {
    return apiService.post("/notifications", data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updateNotification(notificationId: string, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/notifications/${notificationId}`, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async markAsRead(notificationId: string): Promise<ApiResponse<any>> {
    return apiService.patch(`/notifications/${notificationId}`, { isRead: true });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async deleteNotification(notificationId: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/notifications/${notificationId}`);
  }
}

// Pickup Service
export class PickupService {
  static async getPickups(params?: {
    page?: number;
    limit?: number;
    search?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }): Promise<ApiResponse<any[]>> {
    return apiService.get("/pickups", params);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async getPickup(pickupId: string): Promise<ApiResponse<any>> {
    return apiService.get(`/pickups/${pickupId}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async createPickup(data: any): Promise<ApiResponse<any>> {
    return apiService.post("/pickups", data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async updatePickup(pickupId: string, data: any): Promise<ApiResponse<any>> {
    return apiService.put(`/pickups/${pickupId}`, data);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async deletePickup(pickupId: string): Promise<ApiResponse<any>> {
    return apiService.delete(`/pickups/${pickupId}`);
  }
}