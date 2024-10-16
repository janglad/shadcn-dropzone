"use client";

import {
  Dropzone,
  DropZoneArea,
  DropzoneFileList,
  DropzoneFileMessage,
  DropzoneRemoveFile,
  DropzoneRetryFile,
  InfiniteProgress,
  useOurDropZone,
} from "@/components/dropzone";
import { FileIcon, RotateCcwIcon, Trash2Icon, Upload } from "lucide-react";

export default function Home() {
  const dropzone = useOurDropZone({
    onDropFile: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (Math.random() > 90) {
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
    maxRetryCount: 3,
  });

  return (
    <main className="container">
      <Dropzone {...dropzone}>
        <DropZoneArea className="flex flex-col items-center gap-2">
          <Upload />
          <p>Click or drag and drop files to upload them</p>
          <DropzoneFileList
            style={{
              height: `${dropzone.fileStatuses.length * 112}px`,
            }}
            className="w-full transition-all duration-300 overflow-hidden"
            render={({ fileName, status, file, tries }) => (
              <li className="flex flex-col gap-2 rounded-md bg-muted/40 px-4 py-2 h-[112px] justify-center">
                <div className="flex justify-between">
                  <div className="flex items-center gap-2 font-bold">
                    <FileIcon className="size-5 text-muted-foreground" />
                    {fileName}
                  </div>
                  <div className="flex items-center gap-2">
                    {status === "error" && (
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
                    <p>tries: {tries}</p>
                  </div>
                </div>
                <InfiniteProgress status={status} />
                <div className="flex justify-between">
                  <p>{Math.round(file.size / 1024 / 1024)} MB</p>
                  <DropzoneFileMessage />
                </div>
              </li>
            )}
          />
        </DropZoneArea>
      </Dropzone>
    </main>
  );
}
