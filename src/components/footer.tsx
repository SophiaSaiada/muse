import { SiteName } from "@/components/site-name";
import { cn } from "@/lib/utils";

export const Footer = ({ className }: { className?: string }) => (
  <SiteName
    className={cn(
      "mt-2 absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-4",
      className
    )}
  />
);
