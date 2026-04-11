import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader>
          <CardContent><Skeleton className="h-8 w-16" /></CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
      <CardContent className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
      </CardContent>
    </Card>
  </div>
);
