"use client";

import { useState } from "react";
import { CountryPhoneInput } from "./phone-input";

// Self-contained phone field for forms that don't lift the value to parent state
// (e.g. static/marketing forms). Renders the country-aware picker with validation.
export function StandalonePhoneInput(props: {
  placeholder?: string;
  defaultCountry?: string;
  id?: string;
  className?: string;
}) {
  const [value, setValue] = useState("");
  return (
    <CountryPhoneInput
      id={props.id}
      value={value}
      onChange={setValue}
      placeholder={props.placeholder}
      defaultCountry={props.defaultCountry}
      className={props.className}
    />
  );
}
