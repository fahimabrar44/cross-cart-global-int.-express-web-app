"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Zone, Role } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import {
  ArrowUpDown,
  Edit,
  Eye,
  Globe2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

interface ZoneColumnsProps {
  userRole: Role;
  onView: (zone: Zone) => void;
  onEdit: (zone: Zone) => void;
  onDelete: (zone: Zone) => void;
  onToggleStatus: (zone: Zone) => void;
}

export const createZoneColumns = ({
  userRole,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
}: ZoneColumnsProps): ColumnDef<Zone>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Zone
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const zone = row.original;
      return (
        <div className="flex items-center space-x-3">
          <Globe2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{zone.name}</div>
            {zone.code && (
              <div className="text-sm text-muted-foreground">{zone.code}</div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "countryIds",
    header: "Countries",
    cell: ({ row }) => {
      const zone = row.original;
      const count = Array.isArray(zone.countryIds)
        ? zone.countryIds.length
        : Array.isArray(zone.countries)
        ? zone.countries.length
        : 0;
      const names =
        Array.isArray(zone.countries) && zone.countries.length > 0
          ? zone.countries.map((c) => c.name).join(", ")
          : "";
      return (
        <div className="text-sm">
          <div className="font-medium">{count} country/{count !== 1 ? "ies" : "y"}</div>
          {names && (
            <div className="text-muted-foreground line-clamp-1 max-w-[260px]">
              {names}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive") as boolean;
      return (
        <Badge variant={isActive ? "default" : "secondary"}>
          {isActive ? "Active" : "Inactive"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const zone = row.original;
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

            <DropdownMenuItem onClick={() => onView(zone)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onEdit(zone)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Zone
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onToggleStatus(zone)}>
              <Eye className="mr-2 h-4 w-4" />
              {zone.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>

            {userRole === "admin" && (
              <DropdownMenuItem
                onClick={() => onDelete(zone)}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Zone
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
