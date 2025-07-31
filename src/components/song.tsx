import { cn } from "@/lib/utils";
import type { MidiFile, MidiFileWithName } from "@/types";
import { Loader, Music2 } from "lucide-react";

export const Song = ({
  file,
  isLoading,
  isSearching,
  selectedFile,
  setSelectedFile,
}: {
  file: MidiFileWithName;
  isLoading: boolean;
  isSearching: boolean;
  selectedFile: MidiFile | undefined;
  setSelectedFile: (file: MidiFileWithName | null) => void;
}) => {
  const isSelected =
    selectedFile &&
    file.source === selectedFile.source &&
    file.id === selectedFile.id;

  return (
    <button
      onClick={isLoading ? undefined : () => setSelectedFile(file)}
      disabled={isLoading}
      className={cn(
        "rounded-md group transition font-body text-left",
        isLoading ||
          "cursor-pointer hover:text-tinted-text hover:text-shadow-dino",
        isSelected && "text-tinted-text text-shadow-dino",
        (isLoading || isSearching) && !isSelected && "opacity-50"
      )}
    >
      <span className="w-4 mr-2 inline-block">
        {isSelected ? (
          <Loader className="size-4 animate-spin relative top-0.5" />
        ) : (
          <Music2 className="size-4 relative top-0.5" />
        )}
      </span>
      <span>{file.displayName}</span>
    </button>
  );
};
