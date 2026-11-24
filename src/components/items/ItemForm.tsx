"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CreateItemData, Item } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

const itemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(120, "Item name is too long"),
  hsCode: z.string().trim().max(20, "HS code is too long"),
  defaultPrice: z
    .number()
    .min(0, "Default price cannot be negative"),
  unit: z.string().trim().max(20, "Unit is too long"),
  description: z.string().trim().max(500, "Description is too long"),
  isActive: z.boolean(),
});

type ItemFormData = z.infer<typeof itemFormSchema>;

interface ItemFormProps {
  item?: Item;
  onSubmit: (data: CreateItemData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ItemForm({
  item,
  onSubmit,
  onCancel,
  loading = false,
}: ItemFormProps) {
  const isEdit = !!item;

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: item
      ? {
          name: item.name,
          hsCode: item.hsCode ?? "",
          defaultPrice: item.defaultPrice ?? 0,
          unit: item.unit || "pcs",
          description: item.description ?? "",
          isActive: item.isActive,
        }
      : {
          name: "",
          hsCode: "",
          defaultPrice: 0,
          unit: "pcs",
          description: "",
          isActive: true,
        },
  });

  const handleSubmit = (data: ItemFormData) => {
    onSubmit({
      name: data.name.trim(),
      hsCode: data.hsCode.trim() || undefined,
      defaultPrice: Number(data.defaultPrice) || 0,
      unit: data.unit.trim() || "pcs",
      description: data.description.trim() || undefined,
      isActive: data.isActive,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card data-testid="item-form-card">
          <CardHeader>
            <CardTitle>{isEdit ? "Edit Item" : "Add New Item"}</CardTitle>
            <CardDescription>
              Saved items appear as suggestions while creating an order.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Cotton T-Shirt"
                      {...field}
                      data-testid="item-name-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="defaultPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Unit Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        name={field.name}
                        ref={field.ref}
                        value={field.value ?? 0}
                        onBlur={field.onBlur}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === "" ? 0 : Number(e.target.value)
                          )
                        }
                        data-testid="item-price-input"
                      />
                    </FormControl>
                    <FormDescription>
                      Pre-filled when this item is selected in an order.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="pcs"
                        {...field}
                        data-testid="item-unit-input"
                      />
                    </FormControl>
                    <FormDescription>e.g. pcs, kg, box</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hsCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HS Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 6109.10.00"
                        {...field}
                        data-testid="item-hs-code-input"
                      />
                    </FormControl>
                    <FormDescription>
                      Customs classification code for this item.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Short description or internal note"
                      {...field}
                      data-testid="item-description-input"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Item</FormLabel>
                    <FormDescription>
                      Inactive items are hidden from order suggestions.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="item-active-switch"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            data-testid="cancel-item-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            data-testid="submit-item-btn"
          >
            {loading ? "Saving..." : isEdit ? "Update Item" : "Add Item"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
