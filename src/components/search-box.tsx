import { useState, type Dispatch, type SetStateAction } from "react";
import { debounce } from "es-toolkit";
import { cn } from "../utils/cn";

export const SearchBox = ({
  setSearch,
  isLoading,
}: {
  setSearch: Dispatch<SetStateAction<string | null>>;
  isLoading: boolean;
}) => {
  const [setSearchDebounced] = useState(() => debounce(setSearch, 1000));

  return (
    <div className="flex flex-col gap-2.5 mt-1 mb-2 w-full">
      <input
        type="text"
        className={cn(
          "border border-tinted-text rounded-md px-2 py-1 outline-0 focus:border-white transition grow font-body",
          isLoading && "opacity-50"
        )}
        readOnly={isLoading}
        onChange={(e) => setSearchDebounced(e.target.value)}
      />
    </div>
  );
};
