import { roundUpTo } from "@/lib/utils";
import { FileIcon, Trash2Icon } from "lucide-react";
import { InfiniteProgress } from "./inifinite-progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FileStatus } from "./labeled-dropzone";

interface DropZoneFileListProps<
  TUploadRes,
  TUploadError extends string | undefined | void
> {
  fileStatuses: FileStatus<TUploadRes, TUploadError>[];
  onRemoveFile: (id: string) => void | Promise<void>;
}

export function DropZoneFileList<
  TUploadRes,
  TUploadError extends string | undefined | void
>(props: DropZoneFileListProps<TUploadRes, TUploadError>) {
  const totalFiles = props.fileStatuses.length;
  const uploadedFiles = props.fileStatuses.filter(
    (fileStatus) => fileStatus.status === "success"
  ).length;

  const olHeight = Math.max(totalFiles * 96 + (totalFiles - 1) * 16, 0);

  return (
    <Accordion
      className="w-full"
      onClick={(e) => {
        e.stopPropagation();
      }}
      type="single"
      collapsible
    >
      <AccordionItem className="border-none" value="1">
        <AccordionTrigger
          className="relative justify-center"
          iconProps={{ className: "absolute right-0" }}
        >
          Uploaded {uploadedFiles} / {totalFiles}
        </AccordionTrigger>
        <AccordionContent asChild>
          <ol
            className="flex flex-col gap-4 pl-9 transition-all duration-300"
            style={{
              height: `${olHeight}px`,
            }}
          >
            {props.fileStatuses.map((fileStatus) => (
              <FileLine
                key={fileStatus.id}
                fileStatus={fileStatus}
                onRemoveFile={props.onRemoveFile}
              />
            ))}
          </ol>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

interface FileLineProps<
  TUploadRes,
  TUploadError extends string | undefined | void
> {
  fileStatus: FileStatus<TUploadRes, TUploadError>;
  onRemoveFile: (id: string) => void | Promise<void>;
}

function FileLine<TUploadRes, TUploadError extends string | undefined | void>(
  props: FileLineProps<TUploadRes, TUploadError>
) {
  return (
    <li className="flex h-24 flex-col gap-2 rounded-md bg-muted/40 px-4 py-2">
      <div className="flex justify-between">
        <div className="flex items-center gap-2 font-bold">
          <FileIcon className="size-5 text-muted-foreground" />
          {props.fileStatus.fileName}
        </div>
        <Button
          variant="ghost"
          className="hover:border"
          type="button"
          size="icon"
          onClick={() => props.onRemoveFile(props.fileStatus.id)}
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>
      <InfiniteProgress status={props.fileStatus.status} />
      <div className="flex justify-between">
        <p>{roundUpTo(props.fileStatus.file.size / 1024 / 1024, 2)} MB</p>
        {props.fileStatus.error !== undefined && (
          <p className="text-sm text-destructive">{props.fileStatus.error}</p>
        )}
      </div>
    </li>
  );
}
