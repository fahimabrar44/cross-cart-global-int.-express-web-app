import { api, withPagination, PaginationParams } from "@/lib/api";
import {
  Country,
  CreateCountryData,
  UpdateCountryData,
  ApiResponse,
} from "@/types";

export interface CountryFilters extends PaginationParams {
  name?: string;
  code?: string;
  zone?: string;
  timezone?: string;
  phoneCode?: string;
  isActive?: boolean;
}

export interface CountryStats {
  total: number;
  active: number;
  inactive: number;
  zones: Record<string, number>;
  regions: Record<string, number>;
  phoneCodes: Record<string, number>;
}

class CountryService {
  private baseEndpoint = "/countrys";

  async getCountries(filters?: CountryFilters): Promise<ApiResponse<Country[]>> {
    const params = filters ? withPagination(filters) : {};
    return api.get<Country[]>(this.baseEndpoint, params);
  }

  async getCountry(countryId: string): Promise<ApiResponse<Country>> {
    return api.get<Country>(`${this.baseEndpoint}/${countryId}`);
  }

  async createCountry(data: CreateCountryData): Promise<ApiResponse<Country>> {
    return api.post<Country>(this.baseEndpoint, data);
  }

  async updateCountry(
    countryId: string,
    data: UpdateCountryData
  ): Promise<ApiResponse<Country>> {
    return api.put<Country>(`${this.baseEndpoint}/${countryId}`, data);
  }

  async deleteCountry(countryId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`${this.baseEndpoint}/${countryId}`);
  }

  async getCountryStats(): Promise<ApiResponse<CountryStats>> {
    return api.get<CountryStats>(`${this.baseEndpoint}/stats`);
  }

  async toggleCountryStatus(
    countryId: string,
    isActive: boolean
  ): Promise<ApiResponse<Country>> {
    return api.patch<Country>(`${this.baseEndpoint}/${countryId}`, { isActive });
  }

  // Get all active countries for dropdowns
  async getActiveCountries(): Promise<ApiResponse<Country[]>> {
    return api.get<Country[]>(this.baseEndpoint, {
      isActive: true,
      limit: 500,
      sortBy: "name",
      sortOrder: "asc",
    });
  }
}

export const countryService = new CountryService();
