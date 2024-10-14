"use client";

import {
  Dropzone,
  DropzoneAction,
  DropZoneArea,
  DropzoneFileList,
  useOurDropZone,
} from "@/components/dropzone";
import { LabeledDropzone } from "@/components/labeled-dropzone/labeled-dropzone";
import { Trash, Upload } from "lucide-react";
import { errAsync, okAsync } from "neverthrow";

export default function Home() {
  const dropzone = useOurDropZone({
    onDropFile: () => {
      return okAsync("");
    },
  });

  return (
    <div>
      <LabeledDropzone
        onDropFile={() => {
          if (Math.random() > 0.1) {
            return okAsync("");
          }
          return errAsync("Failed to upload file");
        }}
      />

      <Dropzone {...dropzone}>
        <DropZoneArea className="flex flex-col items-center gap-2">
          <Upload />
          <p>Click or drag and drop files to upload them</p>
          <DropzoneFileList
            render={({ fileName }) => (
              <div>
                {fileName}
                <DropzoneAction action="remove">
                  <Trash />
                </DropzoneAction>
              </div>
            )}
          />
        </DropZoneArea>
      </Dropzone>
    </div>
  );
}
