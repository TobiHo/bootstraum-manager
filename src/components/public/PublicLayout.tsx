import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ship, Phone, Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { name: "Start", href: "/" },
  { name: "Touren", href: "/touren" },
  { name: "Charter buchen", href: "/charter" },
  { name: "Kontakt", href: "/kontakt" },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3">
            <Ship className="h-8 w-8" />
            <div>
              <div className="font-bold text-lg leading-tight">VVV Nordhorn</div>
              <div className="text-xs opacity-80">Bootstouren auf der Vechte</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition",
                    active ? "bg-white/15" : "hover:bg-white/10"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
            <Link
              to="/login"
              className="ml-2 px-4 py-2 rounded-md text-sm font-medium bg-white text-primary hover:bg-white/90"
            >
              Mitarbeiter-Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-foreground text-background mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-lg mb-3">
              <Ship className="h-5 w-5" /> VVV Nordhorn
            </div>
            <p className="text-sm opacity-80">
              Erleben Sie Nordhorn vom Wasser aus – mit unseren erfahrenen Bootsführern auf der Vechte.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Kontakt</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Firnhaberstr. 17, 48529 Nordhorn</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +49 5921 8039-0</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@vvv-nordhorn.de</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3">Service</h4>
            <ul className="space-y-2 text-sm opacity-90">
              <li><Link to="/touren">Öffentliche Touren</Link></li>
              <li><Link to="/charter">Private Charter</Link></li>
              <li><Link to="/kontakt">Kontakt &amp; Anfahrt</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs opacity-70 flex flex-col sm:flex-row justify-between gap-2">
            <span>© {new Date().getFullYear()} VVV Nordhorn e.V.</span>
            <span>Impressum · Datenschutz · AGB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
