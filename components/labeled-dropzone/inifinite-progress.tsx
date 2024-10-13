import { cn } from "@/lib/utils";

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
