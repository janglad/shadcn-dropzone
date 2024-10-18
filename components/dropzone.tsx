/* eslint-disable @typescript-eslint/no-empty-object-type */
import { cn } from "@/lib/utils";
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  Accept,
  FileRejection,
  useDropzone as rootUseDropzone,
} from "react-dropzone";
import { Button, ButtonProps } from "./ui/button";

type DropzoneResult<TUploadRes, TUploadError> =
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
          error && "bg-destructive",
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
      } & DropzoneResult<TUploadRes, TUploadError>),
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
        dropZoneErrorCodes.includes(error.code as DropZoneErrorCode),
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
  },
) => {
  const errors = errorCodes.map((error) => {
    switch (error) {
      case "file-invalid-type":
        const acceptedTypes = Object.values(limits.accept ?? {})
          .flat()
          .join(", ");
        return `only ${acceptedTypes} are allowed`;
      case "file-too-large":
        const maxMb = limits.maxSize
          ? (limits.maxSize / (1024 * 1024)).toFixed(2)
          : "infinite?";
        return `max size is ${maxMb}MB`;
      case "file-too-small":
        const roundedMinSize = limits.minSize
          ? (limits.minSize / (1024 * 1024)).toFixed(2)
          : "negative?";
        return `min size is ${roundedMinSize}MB`;
      case "too-many-files":
        return `max ${limits.maxFiles} files`;
    }
  });
  const joinedErrors = errors.join(", ");
  return joinedErrors.charAt(0).toUpperCase() + joinedErrors.slice(1);
};

type UseDropzoneProps<TUploadRes, TUploadError> = {
  onDropFile: (
    file: File,
  ) => Promise<
    Exclude<DropzoneResult<TUploadRes, TUploadError>, { status: "pending" }>
  >;
  onRemoveFile?: (id: string) => void | Promise<void>;
  onFileUploaded?: (result: TUploadRes) => void;
  onFileUploadError?: (error: TUploadError) => void;
  onAllUploaded?: () => void;
  onRootError?: (error: string | undefined) => void;
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

interface UseDropzoneReturn<TUploadRes, TUploadError> {
  getRootProps: ReturnType<typeof rootUseDropzone>["getRootProps"];
  getInputProps: ReturnType<typeof rootUseDropzone>["getInputProps"];
  onRemoveFile: (id: string) => Promise<void>;
  onRetry: (id: string) => Promise<void>;
  canRetry: (id: string) => boolean;
  fileStatuses: FileStatus<TUploadRes, TUploadError>[];
  isInvalid: boolean;
  isDragActive: boolean;
  rootError: string | undefined;
  inputId: string;
  rootMessageId: string;
  getFileMessageId: (id: string) => string;
}

export function useDropzone<TUploadRes, TUploadError>(
  props: UseDropzoneProps<TUploadRes, TUploadError>,
): UseDropzoneReturn<TUploadRes, TUploadError> {
  const {
    onDropFile: pOnDropFile,
    onRemoveFile: pOnRemoveFile,
    shapeUploadError: pShapeUploadError,
    onFileUploaded: pOnFileUploaded,
    onFileUploadError: pOnFileUploadError,
    onAllUploaded: pOnAllUploaded,
    onRootError: pOnRootError,
    maxRetryCount,
    autoRetry,
    dropzoneProps,
  } = props;

  const inputId = useId();
  const rootMessageId = `${inputId}-root-message`;
  const [rootError, _setRootError] = useState<string | undefined>(undefined);

  const setRootError = useCallback(
    (error: string | undefined) => {
      _setRootError(error);
      if (pOnRootError !== undefined) {
        pOnRootError(error);
      }
    },
    [pOnRootError, _setRootError],
  );

  const [fileStatuses, dispatch] = useReducer(fileStatusReducer, []);

  const isInvalid = useMemo(() => {
    return (
      fileStatuses.filter((file) => file.status === "error").length > 0 ||
      rootError !== undefined
    );
  }, [fileStatuses, rootError]);

  const _uploadFile = useCallback(
    async (file: File, id: string, tries = 0) => {
      const result = await pOnDropFile(file);

      if (result.status === "error") {
        if (autoRetry === true && tries < (maxRetryCount ?? Infinity)) {
          dispatch({ type: "update-status", id, status: "pending" });
          return _uploadFile(file, id, tries + 1);
        }

        dispatch({
          type: "update-status",
          id,
          status: "error",
          error:
            pShapeUploadError !== undefined
              ? pShapeUploadError(result.error)
              : result.error,
        });
        if (pOnFileUploadError !== undefined) {
          pOnFileUploadError(result.error);
        }
        return;
      }
      if (pOnFileUploaded !== undefined) {
        pOnFileUploaded(result.result);
      }
      dispatch({
        type: "update-status",
        id,
        ...result,
      });
    },
    [
      autoRetry,
      maxRetryCount,
      pOnDropFile,
      pShapeUploadError,
      pOnFileUploadError,
      pOnFileUploaded,
    ],
  );

  const onRemoveFile = useCallback(
    async (id: string) => {
      await pOnRemoveFile?.(id);
      dispatch({ type: "remove", id });
    },
    [pOnRemoveFile],
  );

  const canRetry = useCallback(
    (id: string) => {
      const fileStatus = fileStatuses.find((file) => file.id === id);
      return (
        fileStatus?.status === "error" &&
        fileStatus.tries < (maxRetryCount ?? Infinity)
      );
    },
    [fileStatuses, maxRetryCount],
  );

  const onRetry = useCallback(
    async (id: string) => {
      if (!canRetry(id)) {
        return;
      }
      dispatch({ type: "update-status", id, status: "pending" });
      const fileStatus = fileStatuses.find((file) => file.id === id);
      if (!fileStatus || fileStatus.status !== "error") {
        return;
      }
      await _uploadFile(fileStatus.file, id);
    },
    [canRetry, fileStatuses, _uploadFile],
  );

  const getFileMessageId = (id: string) => `${inputId}-${id}-message`;

  const dropzone = rootUseDropzone({
    ...dropzoneProps,
    onDropAccepted: async (newFiles) => {
      setRootError(undefined);

      // useDropzone hook only checks max file count per group of uploaded files, allows going over if in multiple batches
      const fileCount = fileStatuses.length;
      const maxNewFiles =
        dropzoneProps?.maxFiles === undefined
          ? undefined
          : dropzoneProps?.maxFiles - fileCount;

      const slicedFiles = newFiles.slice(0, maxNewFiles);

      if (maxNewFiles !== undefined && maxNewFiles < newFiles.length) {
        setRootError(getRootError(["too-many-files"], dropzoneProps ?? {}));
      }

      const onDropFilePromises = slicedFiles.map(async (file) => {
        const id = crypto.randomUUID();
        dispatch({ type: "add", fileName: file.name, file, id });
        await _uploadFile(file, id);
      });

      await Promise.all(onDropFilePromises);
      if (pOnAllUploaded !== undefined) {
        pOnAllUploaded();
      }
    },
    onDropRejected: (fileRejections) => {
      const errorMessage = getRootError(
        getDropZoneErrorCodes(fileRejections),
        dropzoneProps ?? {},
      );
      setRootError(errorMessage);
    },
  });

  return {
    getRootProps: dropzone.getRootProps,
    getInputProps: dropzone.getInputProps,
    inputId,
    rootMessageId,
    getFileMessageId,
    onRemoveFile,
    onRetry,
    canRetry,
    fileStatuses: fileStatuses as FileStatus<TUploadRes, TUploadError>[],
    isInvalid,
    rootError,
    isDragActive: dropzone.isDragActive,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DropZoneContext = createContext<UseDropzoneReturn<any, any>>({
  getRootProps: () => ({}) as never,
  getInputProps: () => ({}) as never,
  onRemoveFile: async () => {},
  onRetry: async () => {},
  canRetry: () => false,
  fileStatuses: [],
  isInvalid: false,
  isDragActive: false,
  rootError: undefined,
  inputId: "",
  rootMessageId: "",
  getFileMessageId: () => "",
});

const useDropzoneContext = <TUploadRes, TUploadError>() => {
  return useContext(DropZoneContext) as UseDropzoneReturn<
    TUploadRes,
    TUploadError
  >;
};

export function Dropzone<TUploadRes, TUploadError>(
  props: UseDropzoneReturn<TUploadRes, TUploadError> & {
    children: React.ReactNode;
  },
) {
  const { children, ...rest } = props;
  return (
    <DropZoneContext.Provider value={rest}>{children}</DropZoneContext.Provider>
  );
}

interface DropZoneAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DropZoneArea(props: DropZoneAreaProps) {
  const { children, ...rest } = props;
  const context = useDropzoneContext();

  if (!context) {
    throw new Error("DropzoneArea must be used within a Dropzone");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { onClick: _, ...rootProps } = context.getRootProps();

  return (
    <div
      {...rootProps}
      {...rest}
      aria-label="dropzone"
      className={cn(
        "flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        context.isDragActive && "animate-pulse bg-black/5",
        context.isInvalid && "border-destructive",
        rest.className,
      )}
    >
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
  props: DropZoneFileListProps<TUploadRes, TUploadError>,
) {
  const context = useDropzoneContext<TUploadRes, TUploadError>();
  const { render, ...rest } = props;
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <ol
      aria-label="dropzone-file-list"
      {...rest}
      className={cn("flex flex-col gap-4 px-4 py-2", props.className)}
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
  props: DropzoneFileListItemProps<TUploadRes, TUploadError>,
) {
  const fileId = props.file.id;
  const {
    onRemoveFile: cOnRemoveFile,
    onRetry: cOnRetry,
    getFileMessageId: cGetFileMessageId,
    canRetry: cCanRetry,
    inputId: cInputId,
  } = useDropzoneContext<TUploadRes, TUploadError>();

  const onRemoveFile = useCallback(
    () => cOnRemoveFile(fileId),
    [fileId, cOnRemoveFile],
  );
  const onRetry = useCallback(() => cOnRetry(fileId), [fileId, cOnRetry]);
  const messageId = cGetFileMessageId(fileId);
  const isInvalid = props.file.status === "error";
  const canRetry = useMemo(() => cCanRetry(fileId), [fileId, cCanRetry]);
  return (
    <DropzoneFileListContext.Provider
      value={{
        onRemoveFile,
        onRetry,
        fileStatus: props.file,
        canRetry,
        dropzoneId: cInputId,
        messageId,
      }}
    >
      <li
        aria-label="dropzone-file-list-item"
        aria-describedby={isInvalid ? messageId : undefined}
        className={cn(
          "flex flex-col justify-center gap-2 rounded-md bg-muted/40 px-4 py-2",
          props.className,
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
  if (!context) {
    throw new Error(
      "DropzoneRemoveFile must be used within a DropzoneFileListItem",
    );
  }
  return (
    <Button onClick={context.onRemoveFile} type="button" size="icon" {...props}>
      {props.children}
      <span className="sr-only">Remove file</span>
    </Button>
  );
}
interface DropzoneRetryFileProps extends ButtonProps {}

export function DropzoneRetryFile(props: DropzoneRetryFileProps) {
  const context = useDropzoneFileListContext();
  if (!context) {
    throw new Error(
      "DropzoneRetryFile must be used within a DropzoneFileListItem",
    );
  }

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
        "aria-disabled:pointer-events-none aria-disabled:opacity-50",
        props.className,
      )}
    >
      {props.children}
      <span className="sr-only">Retry</span>
    </Button>
  );
}

interface DropzoneFileMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DropzoneFileMessage(props: DropzoneFileMessageProps) {
  const { children, ...rest } = props;
  const context = useDropzoneFileListContext();
  if (!context) {
    throw new Error(
      "DropzoneFileMessage must be used within a DropzoneFileListItem",
    );
  }

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
        rest.className,
      )}
    >
      {body}
    </p>
  );
}

interface DropzoneMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement> {}

export function DropzoneMessage(props: DropzoneMessageProps) {
  const { children, ...rest } = props;
  const context = useDropzoneContext();
  if (!context) {
    throw new Error("DropzoneRootMessage must be used within a Dropzone");
  }

  const body = context.rootError ? String(context.rootError) : children;
  return (
    <p
      id={context.rootMessageId}
      {...rest}
      className={cn(
        "h-5 text-[0.8rem] font-medium text-destructive",
        rest.className,
      )}
    >
      {body}
    </p>
  );
}

interface DropzoneTriggerProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function DropzoneLabel({
  className,
  children,
  ...props
}: DropzoneTriggerProps) {
  const context = useDropzoneContext();
  if (!context) {
    throw new Error("DropzoneLabel must be used within a Dropzone");
  }

  const { fileStatuses, getFileMessageId } = context;

  const fileMessageIds = useMemo(
    () =>
      fileStatuses
        .filter((file) => file.status === "error")
        .map((file) => getFileMessageId(file.id)),
    [fileStatuses, getFileMessageId],
  );

  return (
    <label
      {...props}
      className={cn(
        "cursor-pointer rounded-sm bg-secondary px-4 py-2 font-medium ring-offset-background focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:bg-secondary/80",
        className,
      )}
    >
      {children}
      <input
        {...context.getInputProps({
          style: {
            display: undefined,
          },
          className: "sr-only",
          tabIndex: undefined,
        })}
        aria-describedby={
          context.isInvalid
            ? [context.rootMessageId, ...fileMessageIds].join(" ")
            : undefined
        }
        aria-invalid={context.isInvalid}
      />
    </label>
  );
}
