import { useState } from "react";
import { cn } from "../utils/cn";

export const SearchBox = ({
  onSearch,
  isLoading,
}: {
  onSearch: (search: string) => void;
  isLoading: boolean;
}) => {
  const [search, setSearch] = useState("");

  const onButtonClick = () => {
    onSearch(search);
  };

  return (
    <div className="flex flex-row group mt-1 mb-2 w-full">
      <input
        type="text"
        className="border border-tinted-text rounded-l-md px-2 py-1 outline-0 focus:border-white transition grow font-body"
        readOnly={isLoading}
        onChange={(e) => setSearch(e.target.value)}
      />
      <button
        onClick={onButtonClick}
        disabled={isLoading}
        className={cn(
          "text-xl rounded-r-md bg-white-text px-2 cursor-pointer group-focus-within:bg-white transition",
          isLoading && "opacity-50"
        )}
      >
        {isLoading ? "⏳" : "🔎"}
      </button>
    </div>
  );
};
