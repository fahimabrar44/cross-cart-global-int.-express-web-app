"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Switch } from "@/components/ui/switch";
import { Country, CreateCountryData } from "@/types";

const countryFormSchema = z.object({
  name: z
    .string()
    .min(1, "Country name is required")
    .min(2, "Country name must be at least 2 characters")
    .max(120, "Country name is too long"),
  code: z
    .string()
    .min(2, "Country code must be at least 2 characters")
    .max(3, "Country code must be at most 3 characters")
    .regex(/^[A-Za-z]{2,3}$/, "Use the 2–3 letter ISO country code"),
  phoneCode: z
    .string()
    .regex(/^\+\d{1,4}$/, "Phone code must start with + and contain 1–4 digits")
    .or(z.literal("")),
  zone: z.string().max(100, "Zone name is too long"),
  timezone: z.string().max(100, "Timezone is too long"),
  flagUrl: z.string().max(500, "Flag URL is too long"),
  isActive: z.boolean(),
});

type CountryFormData = z.infer<typeof countryFormSchema>;

interface CountryFormProps {
  country?: Country;
  onSubmit: (data: CreateCountryData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function CountryForm({
  country,
  onSubmit,
  onCancel,
  loading = false,
}: CountryFormProps) {
  const isEdit = !!country;

  const form = useForm<CountryFormData>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: country
      ? {
          name: country.name,
          code: country.code,
          phoneCode: country.phoneCode ?? "",
          zone: country.zone ?? "",
          timezone: country.timezone ?? "",
          flagUrl: country.flagUrl ?? "",
          isActive: country.isActive,
        }
      : {
          name: "",
          code: "",
          phoneCode: "",
          zone: "",
          timezone: "",
          flagUrl: "",
          isActive: true,
        },
  });

  const handleSubmit = (data: CountryFormData) => {
    onSubmit({
      name: data.name.trim(),
      code: data.code.trim().toUpperCase(),
      phoneCode: data.phoneCode.trim() || undefined,
      zone: data.zone.trim() || undefined,
      timezone: data.timezone.trim() || undefined,
      flagUrl: data.flagUrl.trim() || undefined,
      isActive: data.isActive,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card data-testid="country-form-card">
          <CardHeader>
            <CardTitle>
              {isEdit ? "Edit Country" : "Create New Country"}
            </CardTitle>
            <CardDescription>
              {isEdit
                ? "Update country information and delivery settings"
                : "Add a new country to the system with delivery configurations"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Bangladesh"
                        {...field}
                        data-testid="country-name-input"
                      />
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
                    <FormLabel>Country Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., BD"
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.value.toUpperCase())
                        }
                        data-testid="country-code-input"
                      />
                    </FormControl>
                    <FormDescription>
                      ISO country code (2–3 letters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., +880"
                        {...field}
                        data-testid="country-phonecode-input"
                      />
                    </FormControl>
                    <FormDescription>
                      Country dialing code (must start with +)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Region / Zone Label</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., South Asia"
                        {...field}
                        data-testid="country-zone-input"
                      />
                    </FormControl>
                    <FormDescription>
                      Used for grouping on the coverage-area page
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Asia/Dhaka"
                        {...field}
                        data-testid="country-timezone-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="flagUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flag URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://... or /flags/bd.svg"
                        {...field}
                        data-testid="country-flag-input"
                      />
                    </FormControl>
                    <FormDescription>Optional flag image</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Country</FormLabel>
                    <FormDescription>
                      Allow this country to be used for shipping services
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="country-active-switch"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div
          className="flex flex-wrap justify-end space-x-4"
          data-testid="country-form-actions"
        >
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            data-testid="cancel-country-btn"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
            data-testid="submit-country-btn"
          >
            {loading
              ? "Saving..."
              : isEdit
                ? "Update Country"
                : "Create Country"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
