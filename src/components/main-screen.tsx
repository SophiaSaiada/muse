import { MIDI_FILES } from "../constants";
import { cn } from "../utils/cn";
import { SearchBox } from "./search-box";

export const MainScreen = ({
  onSelectFile,
  isLoading,
  selectedFile,
  onSearch,
}: {
  onSelectFile: (file: (typeof MIDI_FILES)[number]) => void;
  isLoading: boolean;
  selectedFile: (typeof MIDI_FILES)[number] | null;
  onSearch: (search: string) => void;
}) => (
  <div className="flex flex-col gap-2.5">
    <h1 className="text-5xl mb-1 font-headline text-shadow-dino flex flex-row items-start">
      Muse by Sophie
      {import.meta.env.DEV && <span className="text-2xl ml-2">Local</span>}
    </h1>
    <SearchBox onSearch={onSearch} isLoading={isLoading} />
    {MIDI_FILES.map((file) => (
      <button
        key={file.fileName}
        onClick={isLoading ? undefined : () => onSelectFile(file)}
        disabled={isLoading}
        className={cn(
          "rounded-md flex items-center gap-2 group transition font-body",
          isLoading ||
            "cursor-pointer hover:translate-x-1 hover:text-tinted-text hover:text-shadow-dino",
          file.fileName === selectedFile?.fileName &&
            "text-tinted-text text-shadow-dino translate-x-1",
          isLoading && file.fileName !== selectedFile?.fileName && "opacity-50"
        )}
      >
        <span className="w-4">
          {file.fileName === selectedFile?.fileName ? "⏳" : "♪"}
        </span>
        <span>{file.displayName}</span>
      </button>
    ))}
  </div>
);
