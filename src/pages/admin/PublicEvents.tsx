import { AppLayout } from "@/components/layout/AppLayout";
import { ExclusiveTourManager } from "@/components/admin/ExclusiveTourManager";

export default function AdminExclusiveTours() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ExclusiveTourManager />
      </div>
    </AppLayout>
  );
}
