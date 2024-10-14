"use client";

import {
  Dropzone,
  DropzoneAction,
  DropZoneArea,
  DropzoneFileList,
  InfiniteProgress,
  useOurDropZone,
} from "@/components/dropzone";
import { LabeledDropzone } from "@/components/labeled-dropzone/labeled-dropzone";
import { FileIcon, RotateCcwIcon, Trash2Icon, Upload } from "lucide-react";
import { errAsync, okAsync } from "neverthrow";

export default function Home() {
  const dropzone = useOurDropZone({
    onDropFile: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (Math.random() > 0.5) {
        return {
          status: "success",
          result: "success",
        };
      }
      return {
        status: "error",
        error: "Failed to upload file",
      };
    },
  });

  return (
    <div>
      <LabeledDropzone
        onDropFile={() => {
          if (Math.random() > 0.5) {
            return okAsync("");
          }
          return errAsync("Failed to upload file");
        }}
      />

      <Dropzone {...dropzone}>
        <DropZoneArea className="flex flex-col items-center gap-2">
          <Upload />
          <p>Click or drag and drop files to upload them</p>
          <DropzoneFileList
            className="w-full"
            render={({ fileName, status, file, error }) => (
              <li className="flex flex-col gap-2 rounded-md bg-muted/40 px-4 py-2">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <FileIcon className="size-5 text-muted-foreground" />
                    {fileName}
                  </div>
                  {status === "error" ? (
                    <DropzoneAction
                      action="retry"
                      variant="ghost"
                      className="hover:border"
                      type="button"
                      size="icon"
                    >
                      <RotateCcwIcon className="size-4" />
                    </DropzoneAction>
                  ) : (
                    <DropzoneAction
                      action="remove"
                      variant="ghost"
                      className="hover:border"
                      type="button"
                      size="icon"
                    >
                      <Trash2Icon className="size-4" />
                    </DropzoneAction>
                  )}
                </div>
                <InfiniteProgress status={status} />
                <div className="flex justify-between">
                  <p>{Math.round(file.size / 1024 / 1024)} MB</p>
                  {error !== undefined && (
                    <p className="text-sm text-destructive">{error}</p>
                  )}
                </div>
              </li>
            )}
          />
        </DropZoneArea>
      </Dropzone>
    </div>
  );
}
