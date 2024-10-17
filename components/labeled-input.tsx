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
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface LabeledInputProps<TFieldValues extends FieldValues>
  extends UseControllerProps<TFieldValues> {
  className?: string;
  // Optional in default type
  control: Control<TFieldValues>;
  description?: string;
  label?: string;
  inputProps?: Omit<
    React.ComponentProps<typeof Input>,
    keyof ControllerRenderProps
  >;
}

export function LabeledInput<TFieldValues extends FieldValues>(
  props: LabeledInputProps<TFieldValues>
) {
  const { inputProps, ...restProps } = props;
  const isInvalid = props.control.getFieldState(props.name).invalid;

  return (
    <FormField
      {...restProps}
      render={({ field }) => (
        <FormItem
          className={cn("flex flex-col gap-1 space-y-0", props.className)}
        >
          <div className="flex justify-between">
            {props.label === undefined ? null : (
              <FormLabel className="leading-normal">{props.label}</FormLabel>
            )}
            <FormMessage />
          </div>

          <FormControl>
            <Input {...inputProps} {...field} aria-invalid={isInvalid} />
          </FormControl>
          {props.description === undefined ? null : (
            <FormDescription>{props.description}</FormDescription>
          )}
        </FormItem>
      )}
    />
  );
}
