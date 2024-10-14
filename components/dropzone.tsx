import { cn } from "@/lib/utils";
import { ResultAsync } from "neverthrow";
import { createContext, useContext, useId, useReducer, useState } from "react";
import { Accept, FileRejection, useDropzone } from "react-dropzone";
import { Button, ButtonProps } from "./ui/button";

interface InfiniteProgressProps {
  status: "pending" | "success" | "error";
}

const valueTextMap = {
  pending: "indeterminate",
  success: "100%",
  error: "error",
};

export function InfiniteProgress(props: InfiniteProgressProps) {
  const done = props.status === "success" || props.status === "error";
  const error = props.status === "error";
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={valueTextMap[props.status]}
      className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        //   TODO: add proper done transition
        className={cn(
          "h-full w-full rounded-full bg-primary",
          done ? "translate-x-0" : "animate-infinite-progress",
          error && "bg-destructive"
        )}
      />
    </div>
  );
}

export type FileStatus<TUploadRes, TUploadError> = {
  id: string;
  fileName: string;
  file: File;
} & (
  | { status: "pending"; result?: undefined; error?: undefined }
  | { status: "success"; result: TUploadRes; error?: undefined }
  | { status: "error"; result?: undefined; error: TUploadError }
);

const fileStatusReducer = <TUploadRes, TUploadError extends string | undefined>(
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
  const roundUpTo = (num: number, decimals: number) => {
    return Math.ceil(num * 10 ** decimals) / 10 ** decimals;
  };
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

interface UseOurDropzoneProps<
  TUploadRes,
  TUploadError extends string | undefined
> {
  onDropFile: (file: File) => ResultAsync<TUploadRes, TUploadError>;
  onRemoveFile?: (id: string) => void | Promise<void>;
  onFileUploaded?: (result: TUploadRes) => void;
  onFileUploadError?: (error: TUploadError) => void;
  onAllUploaded?: () => void;
  onRootError?: (error: string) => void;
  dropzoneProps?: {
    accept?: Accept;
    minSize?: number;
    maxSize?: number;
    maxFiles?: number;
  };
}

interface UseOurDropzoneReturn<
  TUploadRes,
  TUploadError extends string | undefined
> {
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  onRemoveFile: (id: string) => Promise<void>;
  fileStatuses: FileStatus<TUploadRes, TUploadError>[];
  isInvalid: boolean;
  isDragActive: boolean;
  fileErrors: TUploadError[];
  rootError: string | undefined;
  inputId: string;
  messageId: string;
}

export function useOurDropZone<
  TUploadRes,
  TUploadError extends string | undefined
>(
  props: UseOurDropzoneProps<TUploadRes, TUploadError>
): UseOurDropzoneReturn<TUploadRes, TUploadError> {
  const inputId = useId();
  const messageId = useId();
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
    getRootProps: dropzone.getRootProps,
    getInputProps: dropzone.getInputProps,
    inputId,
    messageId,
    onRemoveFile,
    fileStatuses: fileStatuses as FileStatus<TUploadRes, TUploadError>[],
    isInvalid,
    fileErrors: fileErrors as TUploadError[],
    rootError,
    isDragActive: dropzone.isDragActive,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DropZoneContext = createContext<UseOurDropzoneReturn<any, any>>({
  getRootProps: () => ({} as never),
  getInputProps: () => ({} as never),
  onRemoveFile: async () => {},
  fileStatuses: [],
  isInvalid: false,
  isDragActive: false,
  fileErrors: [],
  rootError: undefined,
  inputId: "",
  messageId: "",
});

const useOurDropzoneContext = <
  TUploadRes,
  TUploadError extends string | undefined
>() => {
  return useContext(DropZoneContext) as UseOurDropzoneReturn<
    TUploadRes,
    TUploadError
  >;
};

export function Dropzone<TUploadRes, TUploadError extends string | undefined>(
  props: UseOurDropzoneReturn<TUploadRes, TUploadError> & {
    children: React.ReactNode;
  }
) {
  const { children, ...rest } = props;
  return (
    <DropZoneContext.Provider value={rest}>{children}</DropZoneContext.Provider>
  );
}

interface DropZoneAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function DropZoneArea(props: DropZoneAreaProps) {
  const context = useOurDropzoneContext();

  if (!context) {
    throw new Error("DropzoneArea must be used within a Dropzone");
  }

  return (
    <div
      {...context.getRootProps()}
      className={cn(
        "flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 ring-offset-background hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        context.isDragActive && "animate-pulse bg-black/5",
        context.isInvalid && "border-destructive",
        props.className
      )}
    >
      <input
        {...context.getInputProps()}
        className="sr-only !block"
        tabIndex={0}
        id={context.inputId}
        aria-describedby={context.isInvalid ? context.messageId : undefined}
        aria-invalid={context.isInvalid}
      />
      {props.children}
    </div>
  );
}

interface DropzoneFileListContext<
  TUploadRes,
  TUploadError extends string | undefined
> {
  onRemoveFile: () => Promise<void>;
  fileStatus: FileStatus<TUploadRes, TUploadError>;
}

const DropzoneFileListContext = createContext<
  DropzoneFileListContext<any, any>
>({
  onRemoveFile: async () => {},
  fileStatus: {} as FileStatus<any, any>,
});

const useDropzoneFileListContext = () => {
  return useContext(DropzoneFileListContext);
};

export function DropzoneFileListItem<
  TUploadRes,
  TUploadError extends string | undefined
>(props: {
  children: React.ReactNode;
  fileStatus: FileStatus<TUploadRes, TUploadError>;
}) {
  const context = useOurDropzoneContext();
  const onRemoveFile = () => context.onRemoveFile(props.fileStatus.id);
  return (
    <DropzoneFileListContext.Provider
      value={{ onRemoveFile, fileStatus: props.fileStatus }}
    >
      {props.children}
    </DropzoneFileListContext.Provider>
  );
}

interface DropZoneFileListProps<
  TUploadRes,
  TUploadError extends string | undefined
> {
  className?: string;
  render: (status: FileStatus<TUploadRes, TUploadError>) => React.ReactNode;
}

export function DropzoneFileList<
  TUploadRes,
  TUploadError extends string | undefined
>(props: DropZoneFileListProps<TUploadRes, TUploadError>) {
  const context = useOurDropzoneContext<TUploadRes, TUploadError>();

  return (
    <ol
      onClick={(e) => {
        e.stopPropagation();
      }}
      className={cn("flex flex-col gap-4 py-2 px-4", props.className)}
    >
      {context.fileStatuses.map((status) => (
        <DropzoneFileListItem key={status.id} fileStatus={status}>
          {props.render(status)}
        </DropzoneFileListItem>
      ))}
    </ol>
  );
}

interface DropzoneActionProps extends Omit<ButtonProps, "onClick"> {
  action: "remove";
  children: React.ReactNode;
}

export function DropzoneAction(props: DropzoneActionProps) {
  const context = useDropzoneFileListContext();
  return (
    <Button onClick={context.onRemoveFile} type="button" size="icon" {...props}>
      {props.children}
    </Button>
  );
}
