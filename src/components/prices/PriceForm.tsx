"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  WEIGHT_TIER_KEYS,
  emptyWeightPrices,
  weightTierLabel,
} from "@/lib/weightTiers";
import { countryService } from "@/services/countryService";
import { zoneService } from "@/services/zoneService";
import { Country, PriceChart, Zone } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

const weightPricesSchema = z.object(
  Object.fromEntries(
    WEIGHT_TIER_KEYS.map((key) => [
      key,
      z.coerce.number().min(0, "Price cannot be negative"),
    ])
  ) as Record<(typeof WEIGHT_TIER_KEYS)[number], z.ZodNumber>
);

const courierPriceSchema = z.object({
  name: z.string().min(1, "Courier name is required"),
  profitPercentage: z.coerce.number().min(0),
  gift: z.coerce.number().min(0),
  fuel: z.coerce.number().min(0),
  price: weightPricesSchema,
  serviceDetails: z.array(z.string()).optional().default([]),
});

export type WeightPrices = z.infer<typeof weightPricesSchema>;

const priceFormSchema = z.object({
  from: z.string().min(1, "Origin country is required"),
  to: z.string().min(1, "Destination zone is required"),
  isActive: z.boolean().default(true),
  rate: z.array(courierPriceSchema).min(1, "Add at least one courier"),
});

type PriceFormData = z.infer<typeof priceFormSchema>;

interface PriceFormProps {
  price?: PriceChart;
  onSubmit: (data: PriceFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

function normalizeRate(rate: PriceChart["rate"][number]) {
  const price = emptyWeightPrices();
  for (const key of WEIGHT_TIER_KEYS) {
    price[key] = Number(rate.price?.[key]) || 0;
  }

  return {
    name: rate.name ?? "",
    profitPercentage: Number(rate.profitPercentage) || 0,
    gift: Number(rate.gift) || 0,
    fuel: Number(rate.fuel) || 0,
    serviceDetails: Array.isArray(rate.serviceDetails)
      ? rate.serviceDetails
      : [],
    price,
  };
}

export function PriceForm({ price, onSubmit, onCancel, loading }: PriceFormProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  const initialFrom =
    typeof price?.from === "string" ? price.from : price?.from?._id ?? "";
  const initialTo =
    typeof price?.to === "string" ? price.to : price?.to?._id ?? "";

  const form = useForm<PriceFormData>({
    // @ts-expect-error react-hook-form + zod resolver generic mismatch
    resolver: zodResolver(priceFormSchema),
    defaultValues: (price
      ? {
          from: initialFrom,
          to: initialTo,
          isActive: price.isActive !== false,
          rate: (price.rate ?? []).map(normalizeRate),
        }
      : {
          from: "",
          to: "",
          isActive: true,
          rate: [],
        }) as PriceFormData,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rate",
  });

  useEffect(() => {
    (async () => {
      // Admins must be able to configure a route even before a country/zone is
      // made publicly active, so load the full lists (not only active ones).
      const res = await countryService.getCountries({
        limit: 500,
        sortBy: "name",
        sortOrder: "asc",
      });
      if (res.status === 200 && Array.isArray(res.data)) setCountries(res.data);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await zoneService.getZones({
        limit: 200,
        sortBy: "name",
        sortOrder: "asc",
      });
      if (res.status === 200 && Array.isArray(res.data)) setZones(res.data);
    })();
  }, []);

  const addCourier = () => {
    append({
      name: "",
      profitPercentage: 0,
      fuel: 0,
      gift: 0,
      serviceDetails: [],
      price: emptyWeightPrices(),
    });
  };

  const renderServiceDetails = (index: number) => {
    const details: string[] = form.watch(`rate.${index}.serviceDetails`) ?? [];
    return (
      <div className="mt-3">
        <FormLabel className="text-sm font-medium">Service Details</FormLabel>
        <div className="space-y-2 mt-1">
          {details.map((_, di) => (
            <div key={di} className="flex items-center gap-2">
              <Input
                placeholder="e.g. Free doorstep pickup"
                value={details[di] ?? ""}
                onChange={(e) => {
                  const next = [...details];
                  next[di] = e.target.value;
                  form.setValue(`rate.${index}.serviceDetails`, next, {
                    shouldValidate: true,
                  });
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  form.setValue(
                    `rate.${index}.serviceDetails`,
                    details.filter((_, i) => i !== di),
                    { shouldValidate: true }
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              form.setValue(`rate.${index}.serviceDetails`, [...details, ""], {
                shouldValidate: true,
              })
            }
          >
            <Plus className="h-4 w-4 mr-1" /> Add Detail
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Form {...form}>
      {/* @ts-expect-error react-hook-form submit handler generic mismatch */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {price ? "Edit Price Chart" : "Create Price Chart"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                // @ts-expect-error react-hook-form field typing
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origin Country</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Origin" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.length === 0 && (
                          <SelectItem value="__none__" disabled>
                            No countries available. Add a country first.
                          </SelectItem>
                        )}
                        {countries.map((c) => (
                          <SelectItem key={c._id} value={c._id}>
                            {c.name}
                            {c.isActive === false ? " (inactive)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                // @ts-expect-error react-hook-form field typing
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Zone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Destination Zone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {zones.length === 0 && (
                          <SelectItem value="__none__" disabled>
                            No zones available. Add zones first.
                          </SelectItem>
                        )}
                        {zones.map((z) => (
                          <SelectItem key={z._id} value={z._id}>
                            {z.name}
                            {z.isActive === false ? " (inactive)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              // @ts-expect-error react-hook-form field typing
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Route</FormLabel>
                    <FormDescription>
                      Inactive routes are hidden from the public calculator
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No couriers added yet. Use “Add Courier” to create the first
                  rate.
                </p>
              )}

              {fields.map((field, index) => (
                <Card key={field.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div>Courier {index + 1}</div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                    <Input
                      placeholder="Courier Name"
                      {...form.register(`rate.${index}.name` as const)}
                    />
                    <Input
                      placeholder="Fuel %"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register(`rate.${index}.fuel` as const)}
                    />
                    <Input
                      placeholder="Profit %"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register(
                        `rate.${index}.profitPercentage` as const
                      )}
                    />
                    <Input
                      placeholder="Gift %"
                      type="number"
                      step="0.01"
                      min="0"
                      {...form.register(`rate.${index}.gift` as const)}
                    />
                  </div>

                  {form.formState.errors.rate?.[index]?.name && (
                    <p className="text-sm text-destructive mt-1">
                      {form.formState.errors.rate[index]?.name?.message}
                    </p>
                  )}

                  {/* Weight Prices */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {WEIGHT_TIER_KEYS.map((key) => (
                      <FormField
                        key={key}
                        // @ts-expect-error react-hook-form field typing
                        control={form.control}
                        name={`rate.${index}.price.${key}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{weightTierLabel(key)}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.001"
                                min="0"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  {renderServiceDetails(index)}
                </Card>
              ))}

              <Button type="button" variant="outline" onClick={addCourier}>
                <Plus className="h-4 w-4 mr-2" /> Add Courier
              </Button>
            </div>

            <div className="flex flex-wrap justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : price ? "Update" : "Create"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
