import { MIDI_FILES } from "@/constants";
import { SearchBox } from "@/components/search-box";
import useSWRImmutable from "swr/immutable";
import { searchSongOnBitMidi } from "@/lib/scraper-bitmidi";
import { toast } from "sonner";
import { VizTypeSelect } from "@/components/viz-type-select";
import { Song } from "@/components/song";
import { SiteName } from "@/components/site-name";
import { useSearchParams } from "react-router";

const SEARCH_KEY = "q";

export const MainScreen = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get(SEARCH_KEY);

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

  const setSearch = (value: string) => {
    const replace =
      new URLSearchParams(window.location.search).has(SEARCH_KEY) && !!value; // window.location.search is more up to date than searchParams

    setSearchParams(
      (searchParams) => {
        const newSearchParams = new URLSearchParams(searchParams);

        if (!value) {
          newSearchParams.delete(SEARCH_KEY);
        } else {
          newSearchParams.set(SEARCH_KEY, value);
        }

        return newSearchParams;
      },
      { replace }
    );
  };

  return (
    <div className="flex flex-col gap-3 p-8 min-h-dvh justify-center items-start max-w-lg m-auto">
      <SiteName className="text-5xl mb-1" />

      <SearchBox setSearch={setSearch} initialValue={search} />

      {(search && results?.length ? results : MIDI_FILES).map((file) => (
        <Song
          key={JSON.stringify(file)}
          file={file}
          isSearching={isSearching}
        />
      ))}

      <VizTypeSelect />
    </div>
  );
};
