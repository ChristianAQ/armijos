import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 pb-10 pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 40px)" }}>
      {children}
    </div>
  );
}
