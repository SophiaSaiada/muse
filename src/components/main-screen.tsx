import { useState } from "react";
import { MIDI_FILES } from "@/constants";
import { cn } from "@/utils/cn";
import { SearchBox } from "@/components/search-box";
import useSWRImmutable from "swr/immutable";
import { searchSongOnBitMidi } from "@/lib/scraper-bitmidi";

export const MainScreen = ({
  onSelectFile,
  isLoading,
  selectedFile,
}: {
  onSelectFile: (file: (typeof MIDI_FILES)[number]) => void;
  isLoading: boolean;
  selectedFile: (typeof MIDI_FILES)[number] | null;
}) => {
  const [search, setSearch] = useState<string | null>(null);
  const { data: results, isLoading: isSearching } = useSWRImmutable(
    search,
    searchSongOnBitMidi,
    {
      errorRetryCount: 0,
      keepPreviousData: true,
      onError(err, key, config) {
        console.error(err, key, config);
      },
    }
  );

  return (
    <div className="flex flex-col gap-3 p-8">
      <h1 className="text-5xl mb-1 font-headline text-shadow-dino flex flex-row items-start">
        Muse by Sophie
        {import.meta.env.DEV && <span className="text-2xl ml-2">Local</span>}
      </h1>

      <SearchBox setSearch={setSearch} isLoading={isLoading} />

      {search && results && !results.length && (
        <div className="text-sm font-body -mt-2 opacity-75 mb-2">
          No results found.
        </div>
      )}

      {(search && results?.length ? results : MIDI_FILES).map((file) => (
        <button
          key={file.url}
          onClick={isLoading ? undefined : () => onSelectFile(file)}
          disabled={isLoading}
          className={cn(
            "rounded-md group transition font-body text-left",
            isLoading ||
              "cursor-pointer hover:translate-x-1 hover:text-tinted-text hover:text-shadow-dino",
            file.url === selectedFile?.url &&
              "text-tinted-text text-shadow-dino translate-x-1",
            (isLoading || isSearching) &&
              file.url !== selectedFile?.url &&
              "opacity-50"
          )}
        >
          <span className="w-4 mr-2">
            {file.url === selectedFile?.url ? "⏳" : "♪"}
          </span>
          <span>{file.displayName}</span>
        </button>
      ))}
    </div>
  );
};
