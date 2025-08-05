import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";
import type { MidiFileWithName } from "@/types";
import { LoaderPinwheel, Play } from "lucide-react";

// TODO: handle long song names
export const PlayScreen = ({
  displayName,
  onClickPlay,
}: {
  displayName: MidiFileWithName["displayName"];
  onClickPlay?: () => void;
}) => (
  <>
    <button
      className={cn(
        "flex flex-col p-8 min-h-dvh justify-center items-center w-full animate-fade-in",
        onClickPlay && "cursor-pointer"
      )}
      onClick={onClickPlay}
    >
      <div className="flex flex-row items-center">
        <div className="size-8 text-tinted-text relative shrink-0">
          {onClickPlay ? (
            <>
              <div className="absolute inset-1 rounded-full cursor-pointer bg-tinted-text/75 flex items-center justify-center animate-ping delay-300" />
              <div className="absolute inset-0 rounded-full cursor-pointer bg-[hsl(320,20%,10%)] flex items-center justify-center border-tinted-text/50 border-2 border-solid animate-slight-scale-in">
                <Play className="size-4 text-tinted-text" />
              </div>
            </>
          ) : (
            <LoaderPinwheel
              className="size-7 text-tinted-text opacity-60 animate-spin m-0.5"
              strokeWidth={1.5}
            />
          )}
        </div>
        <div
          className={cn(
            "text-3xl font-headline text-tinted-text inline text-left",
            "h-12 leading-12 max-w-0 whitespace-nowrap overflow-hidden opacity-0 transition-all duration-500 delay-200 ease-in-out",
            displayName && "ml-2.5 max-w-[30rem] opacity-100"
          )}
        >
          {displayName}
        </div>
      </div>
    </button>
    <Footer className="animate-fade-in" />
  </>
);
