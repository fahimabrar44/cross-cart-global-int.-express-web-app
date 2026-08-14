import { api, withPagination, PaginationParams } from "@/lib/api";
import { Zone, ApiResponse } from "@/types";

export interface ZoneFilters extends PaginationParams {
  code?: string;
  name?: string;
  isActive?: boolean;
}

export interface CreateZoneData {
  name: string;
  code?: string;
  description?: string;
  countryIds?: string[];
  isActive?: boolean;
}

export type UpdateZoneData = Partial<CreateZoneData>;

class ZoneService {
  private baseEndpoint = "/zones";

  async getZones(filters?: ZoneFilters): Promise<ApiResponse<Zone[]>> {
    const params = filters ? withPagination(filters) : {};
    return api.get<Zone[]>(this.baseEndpoint, params);
  }

  async getZone(zoneId: string): Promise<ApiResponse<Zone>> {
    return api.get<Zone>(`${this.baseEndpoint}/${zoneId}`);
  }

  async createZone(data: CreateZoneData): Promise<ApiResponse<Zone>> {
    return api.post<Zone>(this.baseEndpoint, data);
  }

  async updateZone(zoneId: string, data: UpdateZoneData): Promise<ApiResponse<Zone>> {
    return api.put<Zone>(`${this.baseEndpoint}/${zoneId}`, data);
  }

  async deleteZone(zoneId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`${this.baseEndpoint}/${zoneId}`);
  }

  async toggleZoneStatus(zoneId: string, isActive: boolean): Promise<ApiResponse<Zone>> {
    return api.patch<Zone>(`${this.baseEndpoint}/${zoneId}`, { isActive });
  }

  // Get all active zones for dropdowns
  async getActiveZones(): Promise<ApiResponse<Zone[]>> {
    return api.get<Zone[]>(`${this.baseEndpoint}`, { isActive: true });
  }
}

export const zoneService = new ZoneService();
