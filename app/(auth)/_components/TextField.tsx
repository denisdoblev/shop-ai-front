import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import type { TextFieldProps } from "../_types/Auth";

export function TextField({
  icon: Icon,
  id,
  label,
  registration,
  error,
  ...props
}: TextFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id} className="font-label font-bold text-auth-ink">
        {label}
      </FieldLabel>
      <InputGroup className="h-12">
        <InputGroupAddon>
          <Icon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          {...registration}
          {...props}
          className="text-auth-ink"
        />
      </InputGroup>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}
