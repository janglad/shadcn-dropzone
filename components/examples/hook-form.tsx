import { Upload } from "lucide-react"

import {
  DropZoneArea,
  Dropzone,
  DropzoneMessage,
  DropzoneTrigger,
  useDropzone,
} from "@/components/ui/dropzone"

export function AudioVideoDropzone({
  children,
  file,
  onDropFile,
}: {
  children?: React.ReactNode
  file: File | null
  onDropFile: (file: File) => void
}) {
  const dropzone = useDropzone({
    // this off-the-shelf component seems to want to upload files right away, which we do not do
    // this expectation mismatch could cause issues in the future. Additionally, react-dropzone
    // is not officially supported by react 19, which could further cause issues.

    onDropFile: async (file: File) => {
      // naming is confusing here! This is the argument passed to the image drop
      // designed to bet a hook to set the file reference
      onDropFile(file)

      return {
        status: "success",
        result: null,
      }
    },
    validation: {
      accept: {
        "audio/*": [".mp3", ".wav", ".m4a"],
        "video/*": [".mp4", "mov", "avi"],
      },
      // 300mb? this is arbitrary
      maxSize: 300 * 1024 * 1024,
      maxFiles: 1,
    },
    shiftOnMaxFiles: true,
  })

  return (
    <Dropzone {...dropzone}>
      <div className="flex justify-between">
        <DropzoneMessage />
      </div>
      <DropZoneArea>
        <DropzoneTrigger className="my-6 flex gap-8 bg-transparent text-sm">
          {children}
          {!children && !file && (
            <div className="flex items-center gap-4 font-semibold">
              <div className="bg-muted rounded-full p-3">
                <Upload className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-1">
                <p>Upload Audio or Video</p>
                <p className="text-muted-foreground text-xs">
                  Click here or drag to select an audio or video smaller than
                  300MB
                </p>
              </div>
            </div>
          )}
          {!children && file && (
            <div className="flex flex-col gap-1 font-semibold">
              <p>{file.name}</p>
              <p className="text-muted-foreground text-xs">
                Press the upload button below
              </p>
            </div>
          )}
        </DropzoneTrigger>
      </DropZoneArea>
    </Dropzone>
  )
}

function VisitAudioUploadForm() {
  const formSchema = z.object({
    // most of the file validation is done within the dropzone component
    file: z.instanceof(File, {
      message: "Please select a valid audio or video file",
    }),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // upload to s3 via SAS, etc
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormDescription>
                Upload an audio or video recording
              </FormDescription>
              <FormControl>
                <AudioVideoDropzone
                  onDropFile={(file: File) => form.setValue("file", file)}
                  file={form.watch("file")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload"
          )}
        </Button>
      </form>
    </Form>
  )
}