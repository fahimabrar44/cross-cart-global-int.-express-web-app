"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { countryService } from "@/services/countryService";
import { CreateZoneData, UpdateZoneData } from "@/services/zoneService";
import { Country, Zone } from "@/types";
import { useEffect, useState } from "react";

const zoneFormSchema = z.object({
  name: z.string().min(1, "Zone name is required"),
  code: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  countryIds: z.array(z.string()),
  isActive: z.boolean(),
});

type ZoneFormData = z.infer<typeof zoneFormSchema>;

interface ZoneFormProps {
  zone?: Zone;
  onSubmit: (data: CreateZoneData | UpdateZoneData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ZoneForm({ zone, onSubmit, onCancel, loading = false }: ZoneFormProps) {
  const isEdit = !!zone;
  const [countries, setCountries] = useState<Country[]>([]);

  const form = useForm<ZoneFormData>({
    resolver: zodResolver(zoneFormSchema),
    defaultValues: zone
      ? {
          name: zone.name,
          code: zone.code || "",
          description: zone.description || "",
          countryIds: Array.isArray(zone.countryIds) ? zone.countryIds : [],
          isActive: zone.isActive,
        }
      : {
          name: "",
          code: "",
          description: "",
          countryIds: [],
          isActive: true,
        },
  });

  useEffect(() => {
    (async () => {
      const res = await countryService.getActiveCountries();
      if (res.status == 200) setCountries(res.data || []);
    })();
  }, []);

  const handleSubmit = (data: ZoneFormData) => {
    onSubmit({
      name: data.name,
      code: data.code || undefined,
      description: data.description || undefined,
      countryIds: data.countryIds,
      isActive: data.isActive,
    });
  };

  const countryIds = form.watch("countryIds") || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? "Edit Zone" : "Create New Zone"}</CardTitle>
            <CardDescription>
              {isEdit
                ? "Update zone details and country grouping"
                : "Add a new shipping zone and group its countries"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., EUROPE (D)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zone Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., D"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormDescription>Optional short code (e.g. D, E, J, B, F)</FormDescription>
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional description of this zone" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="countryIds"
              render={() => (
                <FormItem>
                  <FormLabel>Countries in this Zone</FormLabel>
                  <FormDescription>
                    Select all countries grouped under this zone. Selected: {countryIds.length}
                  </FormDescription>
                  <div className="max-h-64 overflow-y-auto rounded-lg border p-3 space-y-2">
                    {countries.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        No active countries found. Add countries first.
                      </p>
                    )}
                    {countries.map((c) => (
                      <label
                        key={c._id}
                        className="flex items-center space-x-2 rounded px-2 py-1 hover:bg-muted cursor-pointer"
                      >
                        <Checkbox
                          checked={countryIds.includes(c._id)}
                          onCheckedChange={(checked) => {
                            const next = checked
                              ? [...countryIds, c._id]
                              : countryIds.filter((id) => id !== c._id);
                            form.setValue("countryIds", next);
                          }}
                        />
                        <span className="text-sm">{c.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {c.code}
                        </span>
                      </label>
                    ))}
                  </div>
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
                    <FormLabel className="text-base">Active Zone</FormLabel>
                    <FormDescription>
                      Allow this zone to be used for shipping rates
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : isEdit ? "Update Zone" : "Create Zone"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
