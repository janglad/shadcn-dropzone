"use client";
import {
  Dropzone,
  DropZoneArea,
  DropzoneMessage,
  DropzoneTrigger,
  useDropzone,
} from "@/components/dropzone";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function SingleFile() {
  const dropzone = useDropzone({
    onDropFile: async (file: File) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return {
        status: "success",
        result: URL.createObjectURL(file),
      };
    },
    validation: {
      accept: {
        "image/*": [".png", ".jpg", ".jpeg"],
      },
      maxSize: 10 * 1024 * 1024,
      maxFiles: 1,
    },
    shiftOnMaxFiles: true,
  });

  const avatarSrc = dropzone.fileStatuses[0]?.result;
  const isPending = dropzone.fileStatuses[0]?.status === "pending";

  return (
    <div className="not-prose">
      <Dropzone {...dropzone}>
        <div className="flex justify-between">
          <DropzoneMessage />
        </div>
        <DropZoneArea>
          <DropzoneTrigger className="flex gap-8 bg-transparent text-sm">
            <Avatar className={cn(isPending && "animate-pulse")}>
              <AvatarImage className="object-cover" src={avatarSrc} />
              <AvatarFallback>JG</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 font-semibold">
              <p>Upload a new avatar</p>
              <p className="text-xs text-muted-foreground">
                Please select an image smaller than 10MB
              </p>
            </div>
          </DropzoneTrigger>
        </DropZoneArea>
      </Dropzone>
    </div>
  );
}
