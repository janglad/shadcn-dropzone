"use client";
import {
  Dropzone,
  DropZoneArea,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneFileMessage,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneRetryFile,
  DropzoneTrigger,
  InfiniteProgress,
  useDropzone,
} from "@/components/dropzone";
import {
  CloudUploadIcon,
  FileIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";

export function MultiFiles() {
  const dropzone = useDropzone({
    onDropFile: async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 500 + 1000),
      );

      if (Math.random() > 0.8) {
        return {
          status: "error",
          error: "Failed to upload file",
        };
      }
      return {
        status: "success",
        result: undefined,
      };
    },
    validation: {
      maxFiles: 10,
    },
  });

  return (
    <div className="not-prose flex flex-col gap-4">
      <Dropzone {...dropzone}>
        <div>
          <div className="flex justify-between">
            <DropzoneDescription>
              Please select up to 10 files
            </DropzoneDescription>
            <DropzoneMessage />
          </div>
          <DropZoneArea>
            <DropzoneTrigger className="flex flex-col items-center gap-4 bg-transparent p-10 text-center text-sm">
              <CloudUploadIcon className="size-8" />
              <div>
                <p className="font-semibold">Upload files</p>
                <p className="text-sm text-muted-foreground">
                  Click here or drag and drop to upload
                </p>
              </div>
            </DropzoneTrigger>
          </DropZoneArea>
        </div>

        <DropzoneFileList className="flex flex-col gap-3">
          {dropzone.fileStatuses.map((file) => (
            <DropzoneFileListItem
              className="flex flex-col gap-3"
              key={file.id}
              file={file}
            >
              <div className="flex justify-between">
                <div className="flex min-w-0 items-center gap-2 font-bold">
                  <FileIcon className="size-5 text-muted-foreground" />
                  <p className="truncate">{file.fileName}</p>
                </div>
                <div className="flex items-center gap-1">
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
                </div>
              </div>
              <InfiniteProgress status={file.status} />
              <div className="flex justify-between text-sm text-muted-foreground">
                <p>{(file.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                <DropzoneFileMessage />
              </div>
            </DropzoneFileListItem>
          ))}
        </DropzoneFileList>
      </Dropzone>
    </div>
  );
}
