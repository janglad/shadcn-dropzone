import type {
  Control,
  ControllerRenderProps,
  FieldValues,
  UseControllerProps,
} from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

interface LabeledCheckboxProps<TFieldValues extends FieldValues>
  extends UseControllerProps<TFieldValues> {
  // Optional in default type
  control: Control<TFieldValues>;
  label?: string;
  inputProps?: Omit<
    React.ComponentProps<typeof Checkbox>,
    keyof ControllerRenderProps
  >;
}

export function LabeledCheckbox<TFieldValues extends FieldValues>(
  props: LabeledCheckboxProps<TFieldValues>
) {
  const { inputProps, ...restProps } = props;
  const isInvalid = props.control.getFieldState(props.name).invalid;

  return (
    <FormField
      {...restProps}
      render={({ field }) => (
        <FormItem className="flex flex-col gap-1 space-y-0">
          <div className="flex justify-between">
            {props.label === undefined ? null : (
              <FormLabel className="leading-normal">{props.label}</FormLabel>
            )}
            <FormMessage />
          </div>

          <FormControl>
            <Checkbox
              {...inputProps}
              {...field}
              checked={field.value}
              onCheckedChange={field.onChange}
              aria-invalid={isInvalid}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
