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
            render={(file) => (
              <DropzoneFileListItem file={file} className=" h-[112px]">
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
