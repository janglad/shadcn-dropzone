/* eslint-disable @typescript-eslint/no-empty-object-type */
import { cn } from "@/lib/utils";
import { createContext, useContext, useId, useReducer, useState } from "react";
import { Accept, FileRejection, useDropzone } from "react-dropzone";
import { Button, ButtonProps } from "./ui/button";

type OurDropzoneResult<TUploadRes, TUploadError> =
  | {
      status: "pending";
    }
  | {
      status: "error";
      error: TUploadError;
    }
  | {
      status: "success";
      result: TUploadRes;
    };

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
  tries: number;
} & (
  | {
      status: "pending";
      result?: undefined;
      error?: undefined;
    }
  | {
      status: "error";
      error: TUploadError;
      result?: undefined;
    }
  | {
      status: "success";
      result: TUploadRes;
      error?: undefined;
    }
);

const fileStatusReducer = <TUploadRes, TUploadError>(
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
      } & OurDropzoneResult<TUploadRes, TUploadError>)
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
          tries: 1,
        },
      ];
    case "remove":
      return state.filter((fileStatus) => fileStatus.id !== action.id);
    case "update-status":
      return state.map((fileStatus) => {
        if (fileStatus.id === action.id) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id, type, ...rest } = action;
          return {
            ...fileStatus,
            ...rest,
            tries:
              action.status === "pending"
                ? fileStatus.tries + 1
                : fileStatus.tries,
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

type UseOurDropzoneProps<TUploadRes, TUploadError> = {
  onDropFile: (
    file: File
  ) => Promise<
    Exclude<OurDropzoneResult<TUploadRes, TUploadError>, { status: "pending" }>
  >;
  onRemoveFile?: (id: string) => void | Promise<void>;
  onFileUploaded?: (result: TUploadRes) => void;
  onFileUploadError?: (error: TUploadError) => void;
  onAllUploaded?: () => void;
  onRootError?: (error: string) => void;
  maxRetryCount?: number;
  autoRetry?: boolean;
  dropzoneProps?: {
    accept?: Accept;
    minSize?: number;
    maxSize?: number;
    maxFiles?: number;
  };
} & (TUploadError extends string
  ? {
      shapeUploadError?: (error: NoInfer<TUploadError>) => string | void;
    }
  : {
      shapeUploadError: (error: NoInfer<TUploadError>) => string | void;
    });

interface UseOurDropzoneReturn<TUploadRes, TUploadError> {
  getRootProps: ReturnType<typeof useDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof useDropzone>["getInputProps"];
  onRemoveFile: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  canRetry: (id: string) => boolean;
  fileStatuses: FileStatus<TUploadRes, TUploadError>[];
  isInvalid: boolean;
  isDragActive: boolean;
  fileErrors: TUploadError[];
  rootError: string | undefined;
  inputId: string;
  rootMessageId: string;
  messageIds: string[];
}

export function useOurDropZone<TUploadRes, TUploadError>(
  props: UseOurDropzoneProps<TUploadRes, TUploadError>
): UseOurDropzoneReturn<TUploadRes, TUploadError> {
  const inputId = useId();
  const rootMessageId = useId();
  const [rootError, setRootError] = useState<string | undefined>(undefined);
  const [fileStatuses, dispatch] = useReducer(fileStatusReducer, []);

  const messageIds = fileStatuses
    .filter((file) => file.status === "error")
    .map((file) => `${inputId}-${file.fileName}-message`);

  const fileErrors = fileStatuses
    .filter((file) => file.status === "error")
    .map((file) => file.error);

  const isInvalid = fileErrors.length > 0 || rootError !== undefined;

  const _uploadFile = async (file: File, id: string, tries = 0) => {
    const result = await props.onDropFile(file);

    if (result.status === "error") {
      if (
        props.autoRetry === true &&
        tries < (props.maxRetryCount ?? Infinity)
      ) {
        dispatch({ type: "update-status", id, status: "pending" });
        return _uploadFile(file, id, tries + 1);
      }

      dispatch({
        type: "update-status",
        id,
        status: "error",
        error:
          props.shapeUploadError !== undefined
            ? props.shapeUploadError(result.error)
            : result.error,
      });
      return;
    }
    dispatch({
      type: "update-status",
      id,
      ...result,
    });
  };

  const onRemoveFile = async (id: string) => {
    await props.onRemoveFile?.(id);
    dispatch({ type: "remove", id });
  };

  const canRetry = (id: string) => {
    const fileStatus = fileStatuses.find((file) => file.id === id);
    return (
      fileStatus?.status === "error" &&
      fileStatus.tries < (props.maxRetryCount ?? Infinity)
    );
  };

  const onRetry = async (id: string) => {
    if (!canRetry(id)) {
      return;
    }
    dispatch({ type: "update-status", id, status: "pending" });
    const fileStatus = fileStatuses.find((file) => file.id === id);
    if (!fileStatus || fileStatus.status !== "error") {
      return;
    }
    await _uploadFile(fileStatus.file, id);
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
        await _uploadFile(file, id);
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
    rootMessageId,
    messageIds,
    onRemoveFile,
    onRetry,
    canRetry,
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
  onRetry: async () => {},
  canRetry: () => false,
  fileStatuses: [],
  isInvalid: false,
  isDragActive: false,
  fileErrors: [],
  rootError: undefined,
  inputId: "",
  rootMessageId: "",
  messageIds: [],
});

const useOurDropzoneContext = <TUploadRes, TUploadError>() => {
  return useContext(DropZoneContext) as UseOurDropzoneReturn<
    TUploadRes,
    TUploadError
  >;
};

export function Dropzone<TUploadRes, TUploadError>(
  props: UseOurDropzoneReturn<TUploadRes, TUploadError> & {
    children: React.ReactNode;
  }
) {
  const { children, ...rest } = props;
  return (
    <DropZoneContext.Provider value={rest}>{children}</DropZoneContext.Provider>
  );
}

interface DropZoneAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DropZoneArea(props: DropZoneAreaProps) {
  const { children, ...rest } = props;
  const context = useOurDropzoneContext();

  if (!context) {
    throw new Error("DropzoneArea must be used within a Dropzone");
  }

  return (
    <div
      {...context.getRootProps()}
      {...rest}
      aria-label="dropzone"
      role="button"
      className={cn(
        "flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 ring-offset-background hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        context.isDragActive && "animate-pulse bg-black/5",
        context.isInvalid && "border-destructive",
        rest.className
      )}
    >
      <input
        {...context.getInputProps()}
        style={{
          display: "block",
        }}
        className="sr-only"
        tabIndex={0}
        id={context.inputId}
        aria-describedby={
          context.isInvalid
            ? [context.rootMessageId, ...context.messageIds].join(" ")
            : undefined
        }
        aria-invalid={context.isInvalid}
      />
      {children}
    </div>
  );
}

interface DropzoneFileListContext<TUploadRes, TUploadError> {
  onRemoveFile: () => Promise<void>;
  onRetry: () => Promise<void>;
  fileStatus: FileStatus<TUploadRes, TUploadError>;
  canRetry: boolean;
  dropzoneId: string;
  messageId: string;
}

const DropzoneFileListContext = createContext<
  DropzoneFileListContext<unknown, unknown>
>({
  onRemoveFile: async () => {},
  onRetry: async () => {},
  fileStatus: {} as FileStatus<unknown, unknown>,
  canRetry: false,
  dropzoneId: "",
  messageId: "",
});

const useDropzoneFileListContext = () => {
  return useContext(DropzoneFileListContext);
};

interface DropZoneFileListProps<TUploadRes, TUploadError>
  extends React.OlHTMLAttributes<HTMLOListElement> {
  render: (status: FileStatus<TUploadRes, TUploadError>) => React.ReactNode;
}

export function DropzoneFileList<TUploadRes, TUploadError = string>(
  props: DropZoneFileListProps<TUploadRes, TUploadError>
) {
  const context = useOurDropzoneContext<TUploadRes, TUploadError>();
  const { render, ...rest } = props;
  return (
    <ol
      aria-label="dropzone-file-list"
      {...rest}
      className={cn("flex flex-col gap-4 py-2 px-4", props.className)}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {context.fileStatuses.map((status) => render(status))}
    </ol>
  );
}

interface DropzoneFileListItemProps<TUploadRes, TUploadError>
  extends React.LiHTMLAttributes<HTMLLIElement> {
  file: FileStatus<TUploadRes, TUploadError>;
}

export function DropzoneFileListItem<TUploadRes, TUploadError>(
  props: DropzoneFileListItemProps<TUploadRes, TUploadError>
) {
  const context = useOurDropzoneContext<TUploadRes, TUploadError>();
  const onRemoveFile = () => context.onRemoveFile(props.file.id);
  const onRetry = () => context.onRetry(props.file.id);
  const messageId = `${context.inputId}-${props.file.fileName}-message`;
  return (
    <DropzoneFileListContext.Provider
      value={{
        onRemoveFile,
        onRetry,
        fileStatus: props.file,
        canRetry: context.canRetry(props.file.id),
        dropzoneId: context.inputId,
        messageId,
      }}
    >
      <li
        aria-label="dropzone-file-list-item"
        aria-describedby={messageId}
        className={cn(
          "flex flex-col gap-2 rounded-md bg-muted/40 px-4 py-2 justify-center",
          props.className
        )}
      >
        {props.children}
      </li>
    </DropzoneFileListContext.Provider>
  );
}

interface DropzoneRemoveFileProps extends ButtonProps {}

export function DropzoneRemoveFile(props: DropzoneRemoveFileProps) {
  const context = useDropzoneFileListContext();
  return (
    <Button onClick={context.onRemoveFile} type="button" size="icon" {...props}>
      {props.children}
    </Button>
  );
}
interface DropzoneRetryFileProps extends ButtonProps {}

export function DropzoneRetryFile(props: DropzoneRetryFileProps) {
  const context = useDropzoneFileListContext();

  const canRetry = context.canRetry;

  return (
    <Button
      aria-disabled={!canRetry}
      aria-label="retry"
      onClick={context.onRetry}
      type="button"
      size="icon"
      {...props}
      className={cn(
        "aria-disabled:opacity-50 aria-disabled:pointer-events-none",
        props.className
      )}
    >
      {props.children}
    </Button>
  );
}

interface DropzoneFileMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DropzoneFileMessage(props: DropzoneFileMessageProps) {
  const { children, ...rest } = props;
  const context = useDropzoneFileListContext();

  const body =
    context.fileStatus.status === "error"
      ? String(context.fileStatus.error)
      : children;
  return (
    <p
      id={context.messageId}
      {...rest}
      className={cn(
        "h-5 text-[0.8rem] font-medium text-destructive",
        rest.className
      )}
    >
      {body}
    </p>
  );
}

interface DropzoneRootMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DropzoneRootMessage(props: DropzoneRootMessageProps) {
  const { children, ...rest } = props;
  const context = useOurDropzoneContext();

  const body = context.rootError ? String(context.rootError) : children;
  return (
    <p
      id={context.rootMessageId}
      {...rest}
      className={cn(
        "h-5 text-[0.8rem] font-medium text-destructive",
        rest.className
      )}
    >
      {body}
    </p>
  );
}
