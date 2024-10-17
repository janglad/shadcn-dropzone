import { LabeledInput } from "@/components/labeled-input";
import { LabeledSwitch } from "@/components/labeled-switch";
import { Form } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const playgroundFormSchema = z.object({
  successRate: z.coerce.number().min(0).max(100),
  maxFiles: z.coerce.number().min(1),
  maxFileSize: z.coerce.number().min(1),
  autoRetry: z.boolean(),
  maxRetryCount: z.coerce.number(),
});

type PlaygroundFormInput = z.input<typeof playgroundFormSchema>;
type PlaygroundFormOutput = z.output<typeof playgroundFormSchema>;

const playgroundFormDefaultValues: PlaygroundFormInput = {
  successRate: 100,
  maxFiles: 1,
  maxFileSize: 100,
  autoRetry: true,
  maxRetryCount: 3,
};

export const usePlaygroundForm = () => {
  const form = useForm<PlaygroundFormInput, unknown, PlaygroundFormOutput>({
    resolver: zodResolver(playgroundFormSchema),
    defaultValues: playgroundFormDefaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  return form;
};

export function PlaygroundForm(props: {
  form: ReturnType<typeof usePlaygroundForm>;
}) {
  return (
    <Form {...props.form}>
      <form className="flex flex-col gap-4">
        <LabeledInput
          control={props.form.control}
          name="successRate"
          label="Success Rate"
          inputProps={{ type: "number" }}
          description="Success rate of the fake upload, between 0 and 100"
        />
        <LabeledInput
          control={props.form.control}
          name="maxFiles"
          label="Max Files"
          inputProps={{ type: "number" }}
          description="Maximum number of files to upload"
        />
        <LabeledInput
          control={props.form.control}
          name="maxFileSize"
          label="Max File Size"
          inputProps={{ type: "number" }}
          description="Maximum size of a file to upload in MB"
        />
        <LabeledSwitch
          className="p-4 rounded-md border"
          control={props.form.control}
          name="autoRetry"
          label="Auto Retry"
          description="Automatically retry failed uploads"
        />
      </form>
    </Form>
  );
}