"use client";
import {
  Dropzone,
  DropZoneArea,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneTrigger,
  useDropzone,
} from "@/components/dropzone";
import { Trash2Icon } from "lucide-react";

export function MultiImages() {
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        status: "success",
        result: URL.createObjectURL(file),
      };
    },
    dropzoneProps: {
      accept: {
        "image/*": [".png", ".jpg", ".jpeg"],
      },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 10,
    },
  });

  return (
    <div className="not-prose">
      <Dropzone {...dropzone}>
        <div className="flex justify-between">
          <DropzoneMessage />
        </div>
        <DropZoneArea>
          <DropzoneTrigger className="flex gap-8 bg-transparent text-sm">
            Upload images
          </DropzoneTrigger>
        </DropZoneArea>
        <DropzoneFileList className="grid grid-cols-3 gap-2">
          {dropzone.fileStatuses.map((file) => (
            <DropzoneFileListItem
              className="bg-secondary p-0"
              key={file.id}
              file={file}
            >
              {file.status === "success" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={file.result} alt={`uploaded-${file.fileName}`} />
              )}
              <div className="flex items-center justify-between p-2 pl-4">
                <div>
                  <p className="text-sm">{file.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <DropzoneRemoveFile variant="ghost" className="hover:outline">
                  <Trash2Icon className="size-4" />
                </DropzoneRemoveFile>
              </div>
            </DropzoneFileListItem>
          ))}
        </DropzoneFileList>
      </Dropzone>
    </div>
  );
}
