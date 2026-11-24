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
import { Item, Role } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { Edit, MoreHorizontal, Power, PowerOff, Trash2 } from "lucide-react";

interface ItemColumnsProps {
  userRole: Role;
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onToggleStatus: (item: Item) => void;
}

export const createItemColumns = ({
  userRole,
  onEdit,
  onDelete,
  onToggleStatus,
}: ItemColumnsProps): ColumnDef<Item>[] => {
  const canManage = userRole === "admin" || userRole === "moderator";

  return [
    {
      accessorKey: "name",
      header: "Item Name",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "hsCode",
      header: "HS Code",
      cell: ({ row }) => (
        <span className="text-sm font-mono text-muted-foreground">
          {row.original.hsCode || "—"}
        </span>
      ),
    },
    {
      accessorKey: "defaultPrice",
      header: "Default Price",
      cell: ({ row }) => (
        <span className="font-medium">
          ${Number(row.original.defaultPrice || 0).toFixed(2)}
        </span>
      ),
    },
    {
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.unit || "pcs"}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const item = row.original;

        if (!canManage) return null;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                data-testid={`item-actions-${item._id}`}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onEdit(item)}
                data-testid={`edit-item-${item._id}`}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Item
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onToggleStatus(item)}
                data-testid={`toggle-item-${item._id}`}
              >
                {item.isActive ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(item)}
                className="text-red-600 focus:text-red-600"
                data-testid={`delete-item-${item._id}`}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
};
