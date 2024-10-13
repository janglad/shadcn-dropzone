import { useReducer, useState } from "react";

import { roundUpTo } from "@/lib/utils";
import { ResultAsync } from "neverthrow";
import { Accept, FileRejection, useDropzone } from "react-dropzone";
import { FileStatus } from "./labeled-dropzone";

const fileStatusReducer = <
  TUploadRes,
  TUploadError extends string | undefined | void
>(
  state: FileStatus<TUploadRes, TUploadError>[],
  action:
    | {
        type: "add";
        id: string;
        fileName: string;
        file: File;
      }
    | {
        type: "remove";
        id: string;
      }
    | ({
        type: "update-status";
        id: string;
      } & (
        | { status: "pending"; result?: undefined; error?: undefined }
        | { status: "success"; result: TUploadRes; error?: undefined }
        | { status: "error"; result?: undefined; error: TUploadError }
      ))
): FileStatus<TUploadRes, TUploadError>[] => {
  switch (action.type) {
    case "add":
      return [
        ...state,
        {
          id: action.id,
          fileName: action.fileName,
          file: action.file,
          status: "pending",
        },
      ];
    case "remove":
      return state.filter((fileStatus) => fileStatus.id !== action.id);
    case "update-status":
      return state.map((fileStatus) => {
        if (fileStatus.id === action.id) {
          return {
            ...fileStatus,
            status: action.status,
            error: action.error,
            result: action.result,
          } as FileStatus<TUploadRes, TUploadError>;
        }
        return fileStatus;
      });
  }
};
type DropZoneErrorCode = (typeof dropZoneErrorCodes)[number];
const dropZoneErrorCodes = [
  "file-invalid-type",
  "file-too-large",
  "file-too-small",
  "too-many-files",
] as const;

const getDropZoneErrorCodes = (fileRejections: FileRejection[]) => {
  const errors = fileRejections.map((rejection) => {
    return rejection.errors
      .filter((error) =>
        dropZoneErrorCodes.includes(error.code as DropZoneErrorCode)
      )
      .map((error) => error.code) as DropZoneErrorCode[];
  });
  return Array.from(new Set(errors.flat()));
};

const getRootError = (
  errorCodes: DropZoneErrorCode[],
  limits: {
    accept?: Accept;
    maxSize?: number;
    minSize?: number;
    maxFiles?: number;
  }
) => {
  const errors = errorCodes.map((error) => {
    switch (error) {
      case "file-invalid-type":
        const acceptedTypes = Object.values(limits.accept ?? {})
          .flat()
          .join(", ");
        return `only ${acceptedTypes} are allowed`;
      case "file-too-large":
        const maxMb = roundUpTo(limits.maxSize ?? 0, 2);
        return `max size is ${maxMb}MB`;
      case "file-too-small":
        const roundedMinSize = roundUpTo(limits.minSize ?? 0, 2);
        return `min size is ${roundedMinSize}MB`;
      case "too-many-files":
        return `max ${limits.maxFiles} files`;
    }
  });
  const joinedErrors = errors.join(", ");
  return joinedErrors.charAt(0).toUpperCase() + joinedErrors.slice(1);
};

interface UseOurDropZoneProps<
  TUploadRes,
  TUploadError extends string | undefined | void
> {
  onDropFile: (file: File) => ResultAsync<TUploadRes, TUploadError>;
  onRemoveFile?: (id: string) => void | Promise<void>;
  onAllUploaded?: (files: TUploadRes[]) => void;
  dropzoneProps?: {
    accept?: Accept;
    minSize?: number;
    maxSize?: number;
    maxFiles?: number;
  };
}
export function useOurDropZone<
  TUploadRes,
  TUploadError extends string | undefined | void
>(props: UseOurDropZoneProps<TUploadRes, TUploadError>) {
  const [rootError, setRootError] = useState<string | undefined>(undefined);
  const [fileStatuses, dispatch] = useReducer(fileStatusReducer, []);

  const fileErrors = fileStatuses
    .filter((file) => file.status === "error")
    .map((file) => file.error);

  const isInvalid = fileErrors.length > 0 || rootError !== undefined;

  const onRemoveFile = async (id: string) => {
    await props.onRemoveFile?.(id);
    dispatch({ type: "remove", id });
  };

  const dropzone = useDropzone({
    ...props.dropzoneProps,
    onDropAccepted: async (newFiles) => {
      setRootError(undefined);

      // useDropzone hook only checks max file count per group of uploaded files, allows going over if in multiple batches
      const fileCount = fileStatuses.length;
      const maxNewFiles =
        props.dropzoneProps?.maxFiles === undefined
          ? undefined
          : props.dropzoneProps.maxFiles - fileCount;

      const slicedFiles = newFiles.slice(0, maxNewFiles);

      if (maxNewFiles !== undefined && maxNewFiles < newFiles.length) {
        setRootError(
          getRootError(["too-many-files"], props.dropzoneProps ?? {})
        );
      }

      const onDropFilePromises = slicedFiles.map(async (file) => {
        const id = crypto.randomUUID();
        dispatch({ type: "add", fileName: file.name, file, id });
        const result = await props.onDropFile(file);
        if (result.isOk()) {
          dispatch({
            type: "update-status",
            id,
            status: "success",
            result: result.value,
          });
        } else {
          dispatch({
            type: "update-status",
            id,
            status: "error",
            error: result.error,
          });
        }
      });

      await Promise.all(onDropFilePromises);
    },
    onDropRejected: (fileRejections) => {
      const errorMessage = getRootError(
        getDropZoneErrorCodes(fileRejections),
        props.dropzoneProps ?? {}
      );
      setRootError(errorMessage);
    },
  });

  return {
    dropzone,
    onRemoveFile,
    fileStatuses,
    isInvalid,
    fileErrors,
    rootError,
  };
}
