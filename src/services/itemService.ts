import { api, withPagination, PaginationParams } from "@/lib/api";
import {
  ApiResponse,
  CreateItemData,
  Item,
  UpdateItemData,
} from "@/types";

export interface ItemFilters extends PaginationParams {
  isActive?: boolean;
}

class ItemService {
  private baseEndpoint = "/items";

  async getItems(filters?: ItemFilters): Promise<ApiResponse<Item[]>> {
    const params = filters ? withPagination(filters) : {};
    return api.get<Item[]>(this.baseEndpoint, params);
  }

  async getItem(itemId: string): Promise<ApiResponse<Item>> {
    return api.get<Item>(`${this.baseEndpoint}/${itemId}`);
  }

  async createItem(data: CreateItemData): Promise<ApiResponse<Item>> {
    return api.post<Item>(this.baseEndpoint, data);
  }

  async updateItem(
    itemId: string,
    data: UpdateItemData
  ): Promise<ApiResponse<Item>> {
    return api.put<Item>(`${this.baseEndpoint}/${itemId}`, data);
  }

  async deleteItem(itemId: string): Promise<ApiResponse<void>> {
    return api.delete<void>(`${this.baseEndpoint}/${itemId}`);
  }

  async toggleItemStatus(
    itemId: string,
    isActive: boolean
  ): Promise<ApiResponse<Item>> {
    return api.patch<Item>(`${this.baseEndpoint}/${itemId}`, { isActive });
  }

  /**
   * Full active catalog for pickers. 500 is the API's maximum page size and
   * covers a normal item list comfortably.
   */
  async getActiveItems(): Promise<ApiResponse<Item[]>> {
    return api.get<Item[]>(this.baseEndpoint, {
      isActive: true,
      limit: 500,
      sortBy: "name",
      sortOrder: "asc",
    });
  }
}

export const itemService = new ItemService();
