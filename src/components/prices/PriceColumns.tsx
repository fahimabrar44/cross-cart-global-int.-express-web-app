"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PriceChart, Role } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Power, PowerOff } from "lucide-react";

interface PriceColumnsProps {
  userRole: Role;
  onView: (price: PriceChart) => void;
  onEdit: (price: PriceChart) => void;
  onDelete: (price: PriceChart) => void;
  onToggleStatus?: (price: PriceChart) => void;
}

export const createPriceColumns = ({
  userRole,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}: PriceColumnsProps): ColumnDef<PriceChart>[] => [
  {
    accessorKey: "route",
    header: "Route",
    accessorFn: (row) => {
      const fromName =
        typeof row.from === "object"
          ? (row.from as unknown as { name?: string })?.name ?? "N/A"
          : row.from ?? "N/A";
      const toName =
        typeof row.to === "object"
          ? (row.to as unknown as { name?: string })?.name ?? "N/A"
          : row.to ?? "N/A";
      return `${fromName} → ${toName}`;
    },
    cell: (info) => info.getValue(),
  },
  {
    accessorKey: "rateSummary",
    header: "Couriers / Price Summary",
    cell: ({ row }) => {
      const price = row.original;
      const rates = Array.isArray(price.rate) ? price.rate : [];
      const courierCount = rates.length;

      if (courierCount === 0) {
        return <div>No couriers</div>;
      }

      const isAdmin = userRole === "admin" || userRole === "moderator";
      let minPrice = Infinity;
      let maxPrice = 0;

      rates.forEach((c) => {
        const rawValues = Object.values(c.price || {}).filter(
          (v) => typeof v === "number"
        ) as number[];
        if (rawValues.length > 0) {
          const values = isAdmin
            ? rawValues.map((v) =>
                Number(
                  v *
                    (1 + (c.fuel || 0) / 100) *
                    (1 + (c.profitPercentage || 0) / 100)
                )
              )
            : rawValues;
          const localMin = Math.min(...values);
          const localMax = Math.max(...values);
          if (localMin < minPrice) minPrice = localMin;
          if (localMax > maxPrice) maxPrice = localMax;
        }
      });

      if (minPrice === Infinity) minPrice = 0;

      return (
        <div>
          <div>
            {courierCount} courier{courierCount > 1 ? "s" : ""}
          </div>
          <div>
            ${minPrice.toFixed(2)} – ${maxPrice.toFixed(2)}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={row.original.isActive === false ? "secondary" : "default"}>
        {row.original.isActive === false ? "Inactive" : "Active"}
      </Badge>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const price = row.original;
      const canManage = userRole === "admin" || userRole === "moderator";
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onView(price)}>
              View
            </DropdownMenuItem>
            {canManage && (
              <DropdownMenuItem onClick={() => onEdit(price)}>
                Edit
              </DropdownMenuItem>
            )}
            {canManage && onToggleStatus && (
              <DropdownMenuItem onClick={() => onToggleStatus(price)}>
                {price.isActive === false ? (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    Activate
                  </>
                ) : (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                )}
              </DropdownMenuItem>
            )}
            {userRole === "admin" && (
              <DropdownMenuItem
                onClick={() => onDelete(price)}
                className="text-red-600"
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
