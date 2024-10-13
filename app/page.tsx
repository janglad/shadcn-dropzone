"use client";

import { Dropzone, DropZoneArea } from "@/components/dropzone";
import { LabeledDropzone } from "@/components/labeled-dropzone/labeled-dropzone";
import { Upload } from "lucide-react";
import { errAsync, okAsync } from "neverthrow";

export default function Home() {
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

      <Dropzone
        onDropFile={() => {
          return okAsync("");
        }}
      >
        <DropZoneArea className="flex flex-col items-center gap-2">
          <Upload />
          <p>Click or drag and drop files to upload them</p>
        </DropZoneArea>
      </Dropzone>
    </div>
  );
}
