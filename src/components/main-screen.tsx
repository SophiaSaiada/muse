import { useState } from "react";
import { MIDI_FILES } from "@/constants";
import { SearchBox } from "@/components/search-box";
import useSWRImmutable from "swr/immutable";
import { searchSongOnBitMidi } from "@/lib/scraper-bitmidi";
import { toast } from "sonner";
import { VizTypeSelect } from "@/components/viz-type-select";
import { Song } from "@/components/song";
import type { MidiFile, MidiFileWithName } from "@/types";
import { SiteName } from "@/components/site-name";

export const MainScreen = ({
  isLoading,
  selectedFile,
  setSelectedFile,
}: {
  isLoading: boolean;
  selectedFile: MidiFile | undefined;
  setSelectedFile: (file: MidiFileWithName | null) => void;
}) => {
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
      <SiteName className="text-5xl mb-1" />

      <SearchBox setSearch={setSearch} isLoading={isLoading} />

      {(search && results?.length ? results : MIDI_FILES).map((file) => (
        <Song
          key={JSON.stringify(file)}
          file={file}
          isLoading={isLoading}
          isSearching={isSearching}
          selectedFile={selectedFile}
          setSelectedFile={setSelectedFile}
        />
      ))}

      <VizTypeSelect />
    </div>
  );
};
