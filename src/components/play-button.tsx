import { Play } from "lucide-react";

export const PlayButton = ({ onClickPlay }: { onClickPlay: () => void }) => {
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-12 animate-fade-in">
      <div className="absolute inset-1.5 rounded-full cursor-pointer bg-tinted-text flex items-center justify-center animate-ping" />
      <button
        onClick={onClickPlay}
        className="absolute inset-0 rounded-full cursor-pointer bg-tinted-text flex items-center justify-center border-background/50 border-2 border-solid"
      >
        <Play className="size-6 text-background" />
      </button>
    </div>
  );
};
