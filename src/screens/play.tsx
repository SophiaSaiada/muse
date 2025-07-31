import { Footer } from "@/components/footer";
import { cn } from "@/lib/utils";
import type { MidiFileWithName } from "@/types";
import { LoaderPinwheel, Play } from "lucide-react";

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
        "flex flex-col gap-3 p-8 min-h-dvh justify-center items-center max-w-lg m-auto animate-fade-in",
        onClickPlay && "cursor-pointer"
      )}
      onClick={onClickPlay}
    >
      <div className="flex flex-row gap-2.5 items-center">
        {onClickPlay ? (
          <div className="size-8 text-tinted-text relative">
            <div className="absolute inset-1 rounded-full cursor-pointer bg-tinted-text/75 flex items-center justify-center animate-ping" />
            <div className="absolute inset-0 rounded-full cursor-pointer bg-[hsl(320,20%,10%)] flex items-center justify-center border-tinted-text/50 border-2 border-solid">
              <Play className="size-4 text-tinted-text" />
            </div>
          </div>
        ) : (
          <LoaderPinwheel
            className="size-7 mx-0.5 text-tinted-text opacity-60 animate-spin"
            strokeWidth={1.5}
          />
        )}
        <div className="text-3xl font-headline text-tinted-text inline">
          {displayName}
        </div>
      </div>
    </button>
    <Footer className="animate-fade-in" />
  </>
);
