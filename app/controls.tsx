import { LabeledInput } from "@/components/labeled-input";
import { LabeledSwitch } from "@/components/labeled-switch";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Form } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useIsMobile } from "@/lib/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { CogIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export const playgroundFormSchema = z.object({
  successRate: z.coerce.number().min(0).max(100),
  maxFiles: z.coerce.number().min(1),
  maxFileSize: z.coerce.number().min(1),
  autoRetry: z.boolean(),
  maxRetryCount: z.coerce.number(),
  onlyImage: z.boolean(),
});

type PlaygroundFormInput = z.input<typeof playgroundFormSchema>;
type PlaygroundFormOutput = z.output<typeof playgroundFormSchema>;

const playgroundFormDefaultValues: PlaygroundFormInput = {
  successRate: 50,
  maxFiles: 2,
  maxFileSize: 10,
  autoRetry: false,
  maxRetryCount: 3,
  onlyImage: false,
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
  const isMobile = useIsMobile();

  return isMobile ? (
    <PlaygroundFormMobile {...props} />
  ) : (
    <PlaygroundFormDesktop {...props} />
  );
}

export function PlaygroundFormMobile(props: {
  form: ReturnType<typeof usePlaygroundForm>;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild className="fixed right-10 top-10">
        <Button size="icon">
          <CogIcon />
          <span className="sr-only">Settings</span>
        </Button>
      </DrawerTrigger>
      <DrawerContent className="overflow-y-auto px-8 pb-8">
        <DrawerTitle>Settings</DrawerTitle>
        <DrawerDescription>
          Configure the behavior of the fake uploader
        </DrawerDescription>
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
              className="rounded-md border p-4"
              control={props.form.control}
              name="autoRetry"
              label="Auto Retry"
              description="Automatically retry failed uploads"
            />
            <LabeledSwitch
              className="rounded-md border p-4"
              control={props.form.control}
              name="onlyImage"
              label="Only Images"
              description="Only allow images. You can pass exact file/mime types, but don't want to make an input for this lol"
            />
            <DrawerClose asChild>
              <Button type="button">Close</Button>
            </DrawerClose>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}

function PlaygroundFormDesktop(props: {
  form: ReturnType<typeof usePlaygroundForm>;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild className="fixed right-10 top-10">
        <Button size="icon">
          <CogIcon />
          <span className="sr-only">Settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent>
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
              className="rounded-md border p-4"
              control={props.form.control}
              name="autoRetry"
              label="Auto Retry"
              description="Automatically retry failed uploads"
            />
            <LabeledSwitch
              className="rounded-md border p-4"
              control={props.form.control}
              name="onlyImage"
              label="Only Images"
              description="Only allow images. You can pass exact file/mime types, but don't want to make an input for this lol"
            />
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
