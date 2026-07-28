import { useEffect, useState } from "react";

export function useIsDesktop(breakpoint = 768): boolean {
  const [v, setV] = useState(typeof window !== "undefined" ? window.innerWidth >= breakpoint : false);
  useEffect(() => {
    const h = () => setV(window.innerWidth >= breakpoint);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [breakpoint]);
  return v;
}
