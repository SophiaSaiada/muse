import { NavLink } from "react-router";
import { cn } from "@/lib/utils";

export const SiteName = ({
  className,
  prefix,
}: {
  className?: string;
  prefix?: React.ReactNode;
}) => (
  <h1
    className={cn(
      "text-2xl font-headline text-white-text text-shadow-dino relative",
      className
    )}
  >
    {prefix}
    <NavLink to="/" className="text-tinted-text">
      Muse
    </NavLink>{" "}
    by{" "}
    <a href="https://sophies.dev" target="_blank" className="text-tinted-text">
      Sophie
    </a>
    {import.meta.env.DEV && (
      <span className="text-[50%] ml-2 absolute top-[10%]">Local</span>
    )}
  </h1>
);
