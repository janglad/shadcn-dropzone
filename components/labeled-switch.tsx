import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type {
  Control,
  ControllerRenderProps,
  FieldValues,
  UseControllerProps,
} from "react-hook-form";

interface LabeledSwitchProps<TFieldValues extends FieldValues>
  extends UseControllerProps<TFieldValues> {
  // Optional in default type
  control: Control<TFieldValues>;
  className?: string;
  label?: string;
  description?: string;
  inputProps?: Omit<
    React.ComponentProps<typeof Switch>,
    keyof ControllerRenderProps
  >;
}

export function LabeledSwitch<TFieldValues extends FieldValues>(
  props: LabeledSwitchProps<TFieldValues>,
) {
  const { inputProps, ...restProps } = props;
  const isInvalid = props.control.getFieldState(props.name).invalid;

  return (
    <FormField
      {...restProps}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex items-center justify-between space-y-0",
            props.className,
          )}
        >
          <div className="flex flex-col justify-between">
            {props.label === undefined ? null : (
              <FormLabel className="leading-normal">{props.label}</FormLabel>
            )}
            {props.description === undefined ? null : (
              <FormDescription>{props.description}</FormDescription>
            )}
            <FormMessage />
          </div>

          <FormControl>
            <Switch
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
