import { ReactNode } from "react";
import { ResponsiveShell } from "./ResponsiveShell";

interface AppLayoutProps {
  children: ReactNode;
  fullHeight?: boolean;
}

export function AppLayout({ 
  children, 
  fullHeight = false,
}: AppLayoutProps) {
  return (
    <ResponsiveShell fullHeight={fullHeight}>
      {children}
    </ResponsiveShell>
  );
}
