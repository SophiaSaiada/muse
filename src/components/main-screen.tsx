import { useState } from "react";
import { MIDI_FILES } from "@/constants";
import { cn } from "@/lib/utils";
import { SearchBox } from "@/components/search-box";
import useSWRImmutable from "swr/immutable";
import { searchSongOnBitMidi } from "@/lib/scraper-bitmidi";
import { toast } from "sonner";
import { useSelectedFile } from "@/hooks/useSelectedFile";
import { isEqual } from "es-toolkit";
import { VizTypeSelect } from "@/components/viz-type-select";

export const MainScreen = ({ isLoading }: { isLoading: boolean }) => {
  const [selectedFile, setSelectedFile] = useSelectedFile();

  const [search, setSearch] = useState<string | null>(null);
  const { data: results, isLoading: isSearching } = useSWRImmutable(
    search,
    searchSongOnBitMidi,
    {
      errorRetryCount: 0,
      keepPreviousData: true,
      onSuccess(data) {
        if (data.length === 0) {
          toast("No results found, try a different song");
        }
      },
      onError(err, key, config) {
        console.error(err, key, config);
        toast.error("Error searching for songs, try again");
      },
    }
  );

  return (
    <div className="flex flex-col gap-3 p-8 min-h-dvh justify-center items-start max-w-lg m-auto">
      <h1 className="text-5xl mb-1 font-headline text-shadow-dino flex flex-row items-start">
        Muse by Sophie
        {import.meta.env.DEV && <span className="text-2xl ml-2">Local</span>}
      </h1>

      <SearchBox setSearch={setSearch} isLoading={isLoading} />

      {(search && results?.length ? results : MIDI_FILES).map((file) => (
        <button
          key={JSON.stringify(file)}
          onClick={isLoading ? undefined : () => setSelectedFile(file)}
          disabled={isLoading}
          className={cn(
            "rounded-md group transition font-body text-left",
            isLoading ||
              "cursor-pointer hover:translate-x-1 hover:text-tinted-text hover:text-shadow-dino",
            isEqual(file, selectedFile) &&
              "text-tinted-text text-shadow-dino translate-x-1",
            (isLoading || isSearching) &&
              !isEqual(file, selectedFile) &&
              "opacity-50"
          )}
        >
          <span className="w-4 mr-2">
            {isEqual(file, selectedFile) ? "⏳" : "♪"}
          </span>
          <span>{file.displayName}</span>
        </button>
      ))}

      <VizTypeSelect />
    </div>
  );
};
