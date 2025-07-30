import { cn } from "@/lib/utils";
import type { MidiFile } from "@/types";

export const Song = ({
  file,
  isLoading,
  isSearching,
  selectedFile,
  setSelectedFile,
}: {
  file: MidiFile;
  isLoading: boolean;
  isSearching: boolean;
  selectedFile: MidiFile | undefined;
  setSelectedFile: (file: MidiFile | null) => void;
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
          "cursor-pointer hover:translate-x-1 hover:text-tinted-text hover:text-shadow-dino",
        isSelected && "text-tinted-text text-shadow-dino translate-x-1",
        (isLoading || isSearching) && !isSelected && "opacity-50"
      )}
    >
      <span className="w-4 mr-2">{isSelected ? "⏳" : "♪"}</span>
      <span>{file.displayName}</span>
    </button>
  );
};
