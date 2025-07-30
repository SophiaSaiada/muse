import { useState } from "react";
import {
  INITIAL_VIZ_TYPE,
  MIDI_FILES,
  VIZ_TYPE_LOCAL_STORAGE_KEY,
} from "@/constants";
import { cn } from "@/lib/utils";
import { SearchBox } from "@/components/search-box";
import useSWRImmutable from "swr/immutable";
import { searchSongOnBitMidi } from "@/lib/scraper-bitmidi";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocalStorage } from "react-use";
import type { VizType } from "@/types";
export const MainScreen = ({
  onSelectFile,
  isLoading,
  selectedFile,
}: {
  onSelectFile: (file: (typeof MIDI_FILES)[number]) => void;
  isLoading: boolean;
  selectedFile: (typeof MIDI_FILES)[number] | null;
}) => {
  const [vizType, setVizType] = useLocalStorage<VizType>(
    VIZ_TYPE_LOCAL_STORAGE_KEY,
    INITIAL_VIZ_TYPE
  );

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

      <Select
        value={vizType}
        onValueChange={(value) => setVizType(value as VizType)}
      >
        <SelectTrigger className="w-full mt-2 p-4 py-5 border-tinted-text/50">
          <SelectValue placeholder={vizType} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TUNNEL">
            <span className="mr-0">🪨</span> Tunnel
          </SelectItem>
          <SelectItem value="STARS">
            <span className="mr-0">✨</span> Stars
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
