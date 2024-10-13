"use client";

import { LabeledDropzone } from "@/components/labeled-dropzone/labeled-dropzone";
import { errAsync, okAsync } from "neverthrow";

export default function Home() {
  return (
    <LabeledDropzone
      onDropFile={() => {
        if (Math.random() > 0.1) {
          return okAsync("");
        }
        return errAsync("Failed to upload file");
      }}
    />
  );
}
