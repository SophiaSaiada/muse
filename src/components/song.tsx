import { cn } from "@/lib/utils";
import { isEqual } from "es-toolkit";
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
}) => (
  <button
    onClick={isLoading ? undefined : () => setSelectedFile(file)}
    disabled={isLoading}
    className={cn(
      "rounded-md group transition font-body text-left",
      isLoading ||
        "cursor-pointer hover:translate-x-1 hover:text-tinted-text hover:text-shadow-dino",
      isEqual(file, selectedFile) &&
        "text-tinted-text text-shadow-dino translate-x-1",
      (isLoading || isSearching) && !isEqual(file, selectedFile) && "opacity-50"
    )}
  >
    <span className="w-4 mr-2">{isEqual(file, selectedFile) ? "⏳" : "♪"}</span>
    <span>{file.displayName}</span>
  </button>
);
