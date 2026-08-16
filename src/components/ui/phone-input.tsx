"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  PHONE_COUNTRIES,
  getCountryByIso,
  flagEmoji,
  parseE164,
  validateNational,
  formatNational,
} from "@/lib/phoneCountries";
import { cn } from "@/lib/utils";

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  defaultCountry?: string;
  disabled?: boolean;
  id?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  onBlur?: () => void;
  autoComplete?: string;
  dataTestId?: string;
}

export function CountryPhoneInput({
  value,
  onChange,
  defaultCountry = "BD",
  disabled = false,
  id,
  placeholder,
  className,
  error,
  onBlur,
  autoComplete,
  dataTestId,
}: CountryPhoneInputProps) {
  const initial = React.useMemo(
    () => parseE164(value || "", defaultCountry),
    [] // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [iso, setIso] = React.useState(initial.iso);
  const [national, setNational] = React.useState(initial.national);
  const [touched, setTouched] = React.useState(false);
  const lastEmitted = React.useRef(value);

  // Sync when the parent passes a new value (prefill / reset).
  React.useEffect(() => {
    if (value && value !== lastEmitted.current) {
      const parsed = parseE164(value, iso);
      setIso(parsed.iso);
      setNational(parsed.national);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const emit = (nextIso: string, nextNational: string) => {
    const digits = nextNational.replace(/\D/g, "");
    const nationalDigits = digits.startsWith("0") ? digits.slice(1) : digits;
    const country = getCountryByIso(nextIso);
    const e164 = country ? `+${country.dialCode}${nationalDigits}` : "";
    lastEmitted.current = e164;
    onChange(e164);
  };

  const handleCountry = (next: string) => {
    setIso(next);
    emit(next, national);
  };

  const handleNational = (raw: string) => {
    const cleaned = raw.replace(/[^\d\s()-]/g, "");
    const formatted = formatNational(iso, cleaned);
    setNational(formatted);
    emit(iso, formatted);
  };

  const country = getCountryByIso(iso);
  const validation = validateNational(iso, national);

  const message = error || (touched ? validation.error : undefined);
  const showError = Boolean(message);

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex gap-2">
        <Select value={iso} onValueChange={handleCountry} disabled={disabled}>
          <SelectTrigger className="w-[132px] shrink-0" aria-label="Country code">
            <SelectValue>
              <span className="flex items-center gap-1">
                <span aria-hidden>{flagEmoji(iso)}</span>
                <span>+{country?.dialCode}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {PHONE_COUNTRIES.map((c) => (
              <SelectItem key={c.iso} value={c.iso}>
                <span className="flex items-center gap-2">
                  <span aria-hidden>{flagEmoji(c.iso)}</span>
                  <span>{c.name}</span>
                  <span className="text-muted-foreground">+{c.dialCode}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          data-testid={dataTestId}
          value={national}
          onChange={(e) => handleNational(e.target.value)}
          onBlur={() => {
            setTouched(true);
            onBlur?.();
          }}
          placeholder={placeholder || country?.example}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(showError && "border-red-500")}
        />
      </div>
      {showError && (
        <p className="text-sm text-red-500" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
