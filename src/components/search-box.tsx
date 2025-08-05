import { useState, type Dispatch, type SetStateAction } from "react";
import { debounce } from "es-toolkit";
import { Search } from "lucide-react";

export const SearchBox = ({
  setSearch,
}: {
  setSearch: Dispatch<SetStateAction<string | null>>;
}) => {
  const [setSearchDebounced] = useState(() => debounce(setSearch, 1000));

  return (
    <div className="relative mt-1 mb-2 w-full border border-tinted-text/50 bg-input/30 rounded-md  group focus-within:border-white transition">
      <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-0 text-muted-foreground group-focus-within:text-white-text" />
      <input
        type="text"
        placeholder="Search for a song..."
        className="outline-0 grow font-body py-2.5 px-4 pl-10 z-10 relative text-sm w-full"
        onChange={(e) => setSearchDebounced(e.target.value)}
      />
    </div>
  );
};
