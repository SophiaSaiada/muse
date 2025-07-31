import { SiteName } from "@/components/site-name";
import { cn } from "@/lib/utils";
import { Share2 } from "lucide-react";

export const Footer = ({ className }: { className?: string }) => (
  <SiteName
    className={cn(
      "mt-2 absolute bottom-0 left-1/2 -translate-x-1/2 text-center pb-4",
      className
    )}
    prefix={
      <button
        onClick={() => {
          navigator.share({
            url: window.location.href,
            text: "Check out how amazing this song looks! 🤩",
          });
        }}
        className="mr-2 cursor-pointer"
      >
        <Share2 className="size-4" />
      </button>
    }
  />
);
