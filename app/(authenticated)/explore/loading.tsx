import { Skeleton } from "@/components/ui/skeleton";

export default function ExploreLoading() {
  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-12 w-full max-w-2xl" />
        <Skeleton className="h-7 w-full max-w-xl" />
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <Skeleton className="hidden h-[34rem] lg:block" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-[28rem]" />)}
        </div>
      </div>
    </main>
  );
}
