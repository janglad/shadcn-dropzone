"use client";

import {
  Dropzone,
  DropZoneArea,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneFileMessage,
  DropzoneRemoveFile,
  DropzoneRetryFile,
  InfiniteProgress,
  useOurDropZone,
} from "@/components/dropzone";
import { FileIcon, RotateCcwIcon, Trash2Icon, Upload } from "lucide-react";
import { PlaygroundForm, usePlaygroundForm } from "./controls";

export default function Home() {
  const form = usePlaygroundForm();

  const values = form.watch();

  const dropzone = useOurDropZone({
    onDropFile: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(values.successRate);
      if (values.successRate > Math.random() * 100) {
        return {
          status: "success",
          result: "success",
        };
      }
      return {
        status: "error",
        error: {
          message: "Failed to upload file",
        },
      };
    },
    shapeUploadError: (error) => {
      return error.message;
    },
    maxRetryCount: values.maxRetryCount,
    autoRetry: values.autoRetry,
    dropzoneProps: {
      maxFiles: values.maxFiles,
      maxSize: values.maxFileSize * 1024 * 1024,
    },
  });

  console.log(
    dropzone.fileStatuses.length * 112 +
      (dropzone.fileStatuses.length - 1) * 8 +
      16
  );

  return (
    <main className="container min-h-[100dvh] pt-80">
      <PlaygroundForm form={form} />
      <Dropzone {...dropzone}>
        <DropZoneArea className="flex flex-col items-center gap-2">
          <Upload />
          <p>Click or drag and drop files to upload them</p>
          <DropzoneFileList
            style={{
              height: `${
                dropzone.fileStatuses.length * 112 +
                (dropzone.fileStatuses.length - 1) * 8 +
                16
              }px`,
              gap: "8px",
              paddingTop: "8px",
              paddingBottom: "8px",
            }}
            className="w-full transition-all duration-300 overflow-hidden"
            render={(file) => (
              <DropzoneFileListItem
                key={file.id}
                file={file}
                className=" h-[112px] shrink-0"
              >
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <FileIcon className="size-5 text-muted-foreground" />
                    {file.fileName}
                  </div>
                  <div className="flex items-center gap-2">
                    {file.status === "error" && (
                      <DropzoneRetryFile
                        variant="ghost"
                        className="hover:border"
                        type="button"
                        size="icon"
                      >
                        <RotateCcwIcon className="size-4" />
                      </DropzoneRetryFile>
                    )}

                    <DropzoneRemoveFile
                      variant="ghost"
                      className="hover:border"
                      type="button"
                      size="icon"
                    >
                      <Trash2Icon className="size-4" />
                    </DropzoneRemoveFile>
                    <p>tries: {file.tries}</p>
                  </div>
                </div>
                <InfiniteProgress status={file.status} />
                <div className="flex justify-between">
                  <p>{Math.round(file.file.size / 1024 / 1024)} MB</p>
                  <DropzoneFileMessage />
                </div>
              </DropzoneFileListItem>
            )}
          />
        </DropZoneArea>
      </Dropzone>
    </main>
  );
}
