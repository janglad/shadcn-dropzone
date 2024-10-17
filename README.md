# ShadCn style Dropzone

A dropzone component built in the style of ShadCn. Uses the `useDropzone` hook from react-dropzone, builds on ShadCn primitives and aims to be fully accessible.

## Todo

- [ ] Integrate with React Hook Form
- [ ] Make example responsive
- [ ] Integrate with Shadcn CLI
- [ ] Look more into accessibility
- [ ] Actual documentation

## Installation

Copy [this file](/components/dropzone.tsx) and update imports as needed.

## Usage

```tsx
import {
  Dropzone,
  DropZoneArea,
  DropzoneFileList,
  DropzoneFileListItem,
  DropzoneFileMessage,
  DropzoneRemoveFile,
  DropzoneRetryFile,
  DropzoneRootMessage,
  InfiniteProgress,
  useDropzone,
} from "@/components/dropzone";
```

```tsx
const dropzone = useDropzone();

<Dropzone {...dropzone}>
  <DropZoneArea>
    <DropzoneRootMessage />
    <DropzoneFileList
      render={() => (
        <DropzoneFileListItem>
          <DropzoneFileMessage />
          <DropzoneRemoveFile />
          <DropzoneRetryFile />
        </DropzoneFileListItem>
      )}
    />
  </DropZoneArea>
</Dropzone>;
```

## Example

[Playground](https://shadcn-dropzone.vercel.app/). (Quick settings are available through top right menu)

For the example used in the playground [see here](app/page.tsx)
