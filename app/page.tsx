"use client";

import { Dropzone } from "@/components/dropzone";
import { LabeledDropzone } from "@/components/labeled-dropzone/labeled-dropzone";
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
        <div>Hello</div>
      </Dropzone>
    </div>
  );
}
