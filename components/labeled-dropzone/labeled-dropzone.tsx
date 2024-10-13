import { Upload } from "lucide-react";
import { Accept } from "react-dropzone";

import { ResultAsync } from "neverthrow";
import { useId } from "react";

import { DropZoneFileList } from "./file-list";
import { useOurDropZone } from "./hook";
import { Label } from "../ui/label";
import { cn } from "@/lib/utils";

const dummyFile = new File([new ArrayBuffer(1024 * 1024)], "test.png", {
  type: "image/png",
}); // 1MB file

const dummyFile2 = new File(["hi"], "test.png", {
  type: "image/png",
}); // 1MB file

const testFileStatuses: FileStatus<string, string>[] = [
  { id: "1", fileName: "test1.png", status: "pending", file: dummyFile },
  {
    id: "2",
    fileName: "test2.png",
    status: "success",
    file: dummyFile,
    result: "success",
  },
  {
    id: "3",
    fileName: "test3.png",
    status: "success",
    file: dummyFile2,
    result: "success",
  },
  {
    id: "4",
    fileName: "test3.png",
    status: "error",
    file: dummyFile,
    error: "Could not upload file",
  },
];

export type FileStatus<TUploadRes, TUploadError> = {
  id: string;
  fileName: string;
  file: File;
} & (
  | { status: "pending"; result?: undefined; error?: undefined }
  | { status: "success"; result: TUploadRes; error?: undefined }
  | { status: "error"; result?: undefined; error: TUploadError }
);

interface LabeledDropzoneProps<
  TUploadRes,
  TUploadError extends string | undefined | void
> {
  label?: string;
  dropzoneProps?: {
    accept?: Accept;
    minSize?: number;
    maxSize?: number;
    maxFiles?: number;
  };
  className?: string;
  onDropFile: (file: File) => ResultAsync<TUploadRes, TUploadError>;
  onRemoveFile?: (id: string) => void | Promise<void>;
  onAllUploaded?: (files: TUploadRes[]) => void;
}

export function LabeledDropzone<
  TUploadRes,
  TUploadError extends string | undefined | void
>(props: LabeledDropzoneProps<TUploadRes, TUploadError>) {
  const inputId = useId();
  const messageId = useId();
  const {
    dropzone,
    fileStatuses,
    isInvalid,
    fileErrors,
    rootError,
    onRemoveFile,
  } = useOurDropZone(props);

  return (
    <div className="w-full">
      <div className="flex justify-between">
        <Label htmlFor={inputId} className="leading-normal">
          {props.label}
        </Label>
        <div className="h-5 text-[0.8rem] font-medium text-destructive">
          {rootError}
          <div className="sr-only">{fileErrors.join(",")}</div>
        </div>
      </div>
      <div
        {...dropzone.getRootProps()}
        className={cn(
          "flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 ring-offset-background hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          dropzone.isDragActive && "animate-pulse bg-black/5",
          isInvalid && "border-destructive"
        )}
      >
        <div className="flex w-full flex-col items-center gap-2">
          <Upload />
          <p>Click or drag and drop files to upload them</p>
          <DropZoneFileList
            fileStatuses={fileStatuses}
            onRemoveFile={onRemoveFile}
          />
        </div>
      </div>
      <input
        {...dropzone.getInputProps()}
        className="sr-only !block"
        tabIndex={0}
        id={inputId}
        aria-describedby={isInvalid ? messageId : undefined}
        aria-invalid={isInvalid}
      />
    </div>
  );
}
