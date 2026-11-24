import { api, withPagination, PaginationParams } from "@/lib/api";
import { PriceChart, ApiResponse } from "@/types";

export interface PriceFilters extends PaginationParams {
  from?: string;
  to?: string;
  fromName?: string;
  toName?: string;
  rateName?: string;
  isActive?: boolean;
}

export interface CreatePriceData {
  from: string;
  to: string;
  rate: {
    name: string;
    profitPercentage: number;
    gift: number;
    fuel: number;
    price: Record<string, number>;
    serviceDetails?: string[];
  }[];
  isActive?: boolean;
}

export type UpdatePriceData = Partial<CreatePriceData>;

export interface CalculatedRate {
  name: string;
  profitPercentage: number;
  gift: number;
  fuel: number;
  tier: string;
  tierLabel: string;
  basePrice: number;
  finalPrice: number;
  serviceDetails: string[];
}

export interface CalculatedPrice {
  from: { _id: string; name?: string; code?: string };
  to: { _id: string; name?: string; code?: string };
  weight: number;
  weightKg: number;
  tier: string;
  tierLabel: string;
  perKg: boolean;
  rates: CalculatedRate[];
}

class PriceService {
  private baseEndpoint = "/prices";

  async getPrices(filters?: PriceFilters): Promise<ApiResponse<PriceChart[]>> {
    const params = filters ? withPagination(filters) : {};
    return api.get<PriceChart[]>(this.baseEndpoint, params);
  }

  async getPrice(priceId: string): Promise<ApiResponse<PriceChart>> {
    return api.get<PriceChart>(`${this.baseEndpoint}/${priceId}`);
  }

  async createPrice(data: CreatePriceData): Promise<ApiResponse<PriceChart>> {
    return api.post<PriceChart>(this.baseEndpoint, data);
  }

  async updatePrice(
    priceId: string,
    data: UpdatePriceData
  ): Promise<ApiResponse<PriceChart>> {
    return api.put<PriceChart>(`${this.baseEndpoint}/${priceId}`, data);
  }

  async deletePrice(priceId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`${this.baseEndpoint}/${priceId}`);
  }

  async calculatePrice(
    fromCountryId: string,
    toZoneId: string,
    weightInGrams: number,
    rateName?: string
  ): Promise<ApiResponse<CalculatedPrice>> {
    return api.post<CalculatedPrice>(`${this.baseEndpoint}/calculate`, {
      fromCountryId,
      toZoneId,
      weight: weightInGrams,
      ...(rateName ? { rateName } : {}),
    });
  }

  async togglePriceStatus(
    priceId: string,
    isActive: boolean
  ): Promise<ApiResponse<PriceChart>> {
    return api.patch<PriceChart>(`${this.baseEndpoint}/${priceId}`, { isActive });
  }
}

export const priceService = new PriceService();
