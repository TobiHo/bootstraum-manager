import { PublicLayout } from "@/components/public/PublicLayout";
import { Phone, Mail, MapPin } from "lucide-react";

export default function PublicContact() {
  return (
    <PublicLayout>
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-6">Kontakt</h1>
        <div className="space-y-3 text-lg">
          <p className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /> Firnhaberstr. 17, 48529 Nordhorn</p>
          <p className="flex items-center gap-3"><Phone className="h-5 w-5 text-primary" /> +49 5921 8039-0</p>
          <p className="flex items-center gap-3"><Mail className="h-5 w-5 text-primary" /> info@vvv-nordhorn.de</p>
        </div>
      </section>
    </PublicLayout>
  );
}
