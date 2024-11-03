"use client";
import {
  Dropzone,
  DropZoneArea,
  DropzoneDescription,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneFileMessage,
  DropzoneLabel,
  DropzoneMessage,
  DropzoneRemoveFile,
  DropzoneRetryFile,
  InfiniteProgress,
  useDropzone,
} from "@/components/dropzone";

export function SingleFile() {
  const dropzone = useDropzone({
    onDropFile: async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        status: "success",
        result: "Yay!",
      };
    },
  });

  return (
    <Dropzone {...dropzone}>
      <DropzoneDescription>
        These will be uploaded to the server.
      </DropzoneDescription>
      <DropzoneMessage />
      <DropZoneArea>
        <DropzoneLabel>
          Click here or drag and drop files to upload them
        </DropzoneLabel>
        <DropzoneFileList>
          {dropzone.fileStatuses.map((file) => (
            <DropzoneFileListItem key={file.id} file={file}>
              <DropzoneRetryFile>Retry</DropzoneRetryFile>
              <DropzoneRemoveFile>Remove</DropzoneRemoveFile>
              <DropzoneFileMessage />
              <InfiniteProgress status={file.status} />
            </DropzoneFileListItem>
          ))}
        </DropzoneFileList>
      </DropZoneArea>
    </Dropzone>
  );
}
