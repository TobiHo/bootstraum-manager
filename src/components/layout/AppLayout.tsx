import { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
}