import { AppLayout } from "@/components/layout/AppLayout";
import { PublicTourManager } from "@/components/admin/PublicTourManager";

export default function AdminPublicEvents() {
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <PublicTourManager
          category="event"
          title="Events & Sondertouren"
          description="Themen-, Sundowner-, Punsch- und Cliquentouren — saisonale und besondere Events."
        />
      </div>
    </AppLayout>
  );
}
