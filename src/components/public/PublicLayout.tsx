import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Ship, Phone, Mail, MapPin, Menu, Search, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { name: "Start", href: "/" },
  { name: "Kontakt", href: "/kontakt" },
];

export function PublicLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top utility bar – wie auf vvv-nordhorn.de */}
      <div className="bg-foreground text-background text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-9 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-medium">DE</span>
            <span className="opacity-50">·</span>
            <span className="opacity-70 hover:opacity-100 cursor-pointer">EN</span>
            <span className="opacity-50">·</span>
            <span className="opacity-70 hover:opacity-100 cursor-pointer">NL</span>
          </div>
          <div className="hidden md:flex items-center gap-5 opacity-90">
            <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Firnhaberstraße 17, Nordhorn</span>
            <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> +49 5921 80390</span>
            <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> info@vvv-nordhorn.de</span>
          </div>
        </div>
      </div>

      {/* Main header – Menu links, Logo zentriert, Aktionen rechts */}
      <header className="bg-background border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 grid grid-cols-3 items-center">
          <div className="flex items-center">
            <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-md text-sm font-semibold hover:opacity-90">
              <Menu className="h-4 w-4" /> Menü
            </button>
          </div>
          <Link to="/" className="flex flex-col items-center justify-center text-foreground">
            <div className="flex items-center gap-2">
              <Ship className="h-6 w-6 text-primary" />
              <span className="font-bold text-xl tracking-tight">VVV Nordhorn</span>
            </div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-primary/80 -mt-0.5">
              Erlebe die Wasserstadt
            </span>
          </Link>
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <button className="hidden sm:flex flex-col items-center text-foreground hover:text-primary px-2">
              <Search className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Suche</span>
            </button>
            <button className="hidden sm:flex flex-col items-center text-foreground hover:text-primary px-2">
              <MapIcon className="h-5 w-5" />
              <span className="text-[10px] mt-0.5">Karte</span>
            </button>
            <Link
              to="/#touren"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 py-3 text-sm uppercase tracking-wide"
            >
              Buchen
            </Link>
          </div>
        </div>
        {/* sekundäre Nav für unsere App */}
        <nav className="border-t bg-secondary/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 h-11 overflow-x-auto">
            {nav.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition",
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-primary/10"
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
            <Link
              to="/login"
              className="ml-auto px-3 py-1.5 rounded-md text-sm font-medium text-foreground hover:bg-primary/10"
            >
              Mitarbeiter-Login
            </Link>
          </div>
        </nav>
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
