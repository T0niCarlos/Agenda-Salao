import { Skeleton } from "@/components/ui/skeleton";

export default function ProfessionalsLoading() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
  );
}
