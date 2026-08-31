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
import { countryService } from "@/services/countryService";
import { zoneService } from "@/services/zoneService";
import { Country, PriceChart, Zone } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel } from "../ui/form";
export const weightPricesSchema = z.object({
  gm500: z.coerce.number(),
  gm1000: z.coerce.number(),
  gm1500: z.coerce.number(),
  gm2000: z.coerce.number(),
  gm2500: z.coerce.number(),
  gm3000: z.coerce.number(),
  gm3500: z.coerce.number(),
  gm4000: z.coerce.number(),
  gm4500: z.coerce.number(),
  gm5000: z.coerce.number(),
  gm5500: z.coerce.number(),
  kg6to10: z.coerce.number(),
  kg11to20: z.coerce.number(),
  kg21to30: z.coerce.number(),
  kg31to40: z.coerce.number(),
  kg41to50: z.coerce.number(),
  kg51to80: z.coerce.number(),
  kg81to100: z.coerce.number(),
  kg101to500: z.coerce.number(),
  kg501to1000: z.coerce.number(),
});

const courierPriceSchema = z.object({
  name: z.string().min(1),
  profitPercentage: z.coerce.number().min(0),
  gift: z.coerce.number().min(0),
  fuel: z.coerce.number().min(0),
  price: weightPricesSchema,
  serviceDetails: z.array(z.string()).optional().default([]),
});


export type WeightPrices = z.infer<typeof weightPricesSchema>;


const priceFormSchema = z.object({
  from: z.string(),
  to: z.string(),
  rate: z.array(courierPriceSchema).min(1),
 
});

type PriceFormData = z.infer<typeof priceFormSchema>;

interface PriceFormProps {
  price?: PriceChart;
  onSubmit: (data: PriceFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function PriceForm({ price, onSubmit, onCancel }: PriceFormProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialFrom = typeof (price as any)?.from === "string" ? (price as any).from : (price as any)?.from?._id ?? "";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialTo = typeof (price as any)?.to === "string" ? (price as any).to : (price as any)?.to?._id ?? "";
  const form = useForm<PriceFormData>({
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error  
    resolver: zodResolver(priceFormSchema),
    defaultValues: (price
      ? { ...price, from: initialFrom, to: initialTo }
      : { from: "", to: "", rate: [] }) as PriceFormData,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "rate",
  });

  useEffect(() => {
    (async () => {
      const res = await countryService.getActiveCountries();
      if (res.status == 200) setCountries(res.data || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const res = await zoneService.getActiveZones();
      if (res.status == 200) setZones(res.data || []);
    })();
  }, []);

  const addCourier = () => {
    append({
      name: "",
      profitPercentage: 0,
      fuel:0,
      gift: 0,
      serviceDetails: [],
      price: {
        gm500: 0,
        gm1000: 0,
        gm1500: 0,
        gm2000: 0,
        gm2500: 0,
        gm3000: 0,
        gm3500: 0,
        gm4000: 0,
        gm4500: 0,
        gm5000: 0,
        gm5500: 0,
        kg6to10: 0,
        kg11to20: 0,
        kg21to30: 0,
        kg31to40: 0,
        kg41to50: 0,
        kg51to80: 0,
        kg81to100: 0,
        kg101to500: 0,
        kg501to1000: 0,
      },
    });
  };

  const renderServiceDetails = (index: number) => {
    const details: string[] =
      form.watch(`rate.${index}.serviceDetails`) ?? [];
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
                    { shouldValidate: true },
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
              form.setValue(
                `rate.${index}.serviceDetails`,
                [...details, ""],
                { shouldValidate: true },
              )
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
      <form 
      
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error  
      onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {price ? "Edit Price Chart" : "Create Price Chart"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                control={form.control}
                name="from"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Origin" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <FormField
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                control={form.control}
                name="to"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Destination Zone" />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.length === 0 && (
                        <SelectItem value="__none__" disabled>
                          No active zones. Add zones first.
                        </SelectItem>
                      )}
                      {zones.map((z) => (
                        <SelectItem key={z._id} value={z._id}>
                          {z.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-4">
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
                      {...form.register(`rate.${index}.fuel` as const)}
                    />
                    <Input
                      placeholder="Profit %"
                      type="number"
                      {...form.register(
                        `rate.${index}.profitPercentage` as const
                      )}
                    />
                    <Input
                      placeholder="Gift %"
                      type="number"
                      {...form.register(`rate.${index}.gift` as const)}
                    />
                  </div>
                  {/* Weight Prices */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                    {(Object.keys(field.price) as (keyof WeightPrices)[]).map(
                      (key) => (
                        <FormField
                          key={key}
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error  
                          control={form.control}
                          name={`rate.${index}.price.${key}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {key == "gm500"
                                  ? "500 GM"
                                  : key == "gm1000"
                                  ? "1000 GM"
                                  : key == "gm1500"
                                  ? "1500 GM"
                                  : key == "gm2000"
                                  ? "2000 GM"
                                  : key == "gm2500"
                                  ? "2500 GM"
                                  : key == "gm3000"
                                  ? "3000 GM"
                                  : key == "gm3500"
                                  ? "3500 GM"
                                  : key == "gm4000"
                                  ? "4000 GM"
                                  : key == "gm4500"
                                  ? "4500 GM"
                                  : key == "gm5000"
                                  ? "5000 GM"
                                  : key == "gm5500"
                                  ? "5500 GM"
                                  : key == "kg6to10"
                                  ? "6 TO 10 PER KG"
                                  : key == "kg11to20"
                                  ? "11 TO 20 PER KG"
                                  : key == "kg21to30"
                                  ? "21 TO 30 PER KG"
                                  : key == "kg31to40"
                                  ? "31 TO 40 PER KG"
                                  : key == "kg41to50"
                                  ? "41 TO 50 PER KG"
                                  : key == "kg51to80"
                                  ? "51 TO 80 PER KG"
                                  : key == "kg81to100"
                                  ? "81 TO 100 PER KG"
                                  : key == "kg101to500"
                                  ? "101 TO 500 PER KG"
                                  : key == "kg501to1000"
                                  ? "501 TO 1000 PER KG"
                                  : ""}
                              </FormLabel>
                              <FormControl>
                                <Input type="number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )
                    )}
                  </div>
                  {renderServiceDetails(index)}
                </Card>
              ))}

              <Button type="button" variant="outline" onClick={addCourier}>
                <Plus className="h-4 w-4 mr-2" /> Add Courier
              </Button>
            </div>

            <div className="flex flex-wrap justify-end space-x-2 mt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit">{price ? "Update" : "Create"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
