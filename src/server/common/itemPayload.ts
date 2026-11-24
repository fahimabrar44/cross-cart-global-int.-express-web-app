export interface ItemWriteData {
  name?: string;
  nameKey?: string;
  hsCode?: string | null;
  defaultPrice?: number;
  unit?: string;
  description?: string | null;
  isActive?: boolean;
  deactivatedAt?: Date | null;
}

function toText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

/**
 * Whitelist and normalize item fields coming from the API.
 *
 * `requireName` is true for creates. Updates may omit the name, but when it is
 * supplied the derived `nameKey` is refreshed so the unique index stays in
 * sync with the display name.
 */
export function buildItemPayload(
  body: Record<string, unknown>,
  options: { requireName: boolean }
):
  | { ok: true; data: ItemWriteData }
  | { ok: false; message: string } {
  const data: ItemWriteData = {};

  if (body.name !== undefined || options.requireName) {
    const name = toText(body.name, 120);
    if (!name) {
      return { ok: false, message: "Item name is required" };
    }
    data.name = name;
    data.nameKey = name.toLowerCase();
  }

  if (body.hsCode !== undefined) {
    data.hsCode = toText(body.hsCode, 20) || null;
  }

  if (body.defaultPrice !== undefined) {
    const value = Number(body.defaultPrice);
    if (!Number.isFinite(value) || value < 0) {
      return {
        ok: false,
        message: "Default price must be a non-negative number",
      };
    }
    data.defaultPrice = Math.round(value * 100) / 100;
  }

  if (body.unit !== undefined) {
    const unit = toText(body.unit, 20);
    data.unit = unit || "pcs";
  }

  if (body.description !== undefined) {
    data.description = toText(body.description, 500) || null;
  }

  if (typeof body.isActive === "boolean") {
    data.isActive = body.isActive;
    data.deactivatedAt = body.isActive ? null : new Date();
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, message: "No update fields provided" };
  }

  return { ok: true, data };
}
