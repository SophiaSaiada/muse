import { useEffect, useState, type Dispatch } from "react";
import { debounce } from "es-toolkit";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const SearchBox = ({
  setSearch,
  initialValue,
}: {
  setSearch: Dispatch<string>;
  initialValue: string | null;
}) => {
  const [value, setValue] = useState(initialValue ?? "");
  useEffect(() => {
    setValue(initialValue ?? "");
  }, [initialValue]);

  const [setSearchDebounced] = useState(() => debounce(setSearch, 1000));

  const onChange = (value: string) => {
    setValue(value);
    if (value) {
      setSearchDebounced(value);
    } else {
      setSearch(value);
    }
  };

  return (
    <div className="relative mt-1 mb-2 w-full border border-tinted-text/50 bg-input/30 rounded-md group focus-within:border-white transition">
      <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none z-0 text-muted-foreground group-focus-within:text-white-text" />
      <input
        type="text"
        placeholder="Search for a song..."
        className="outline-0 grow font-body py-2.5 px-4 pl-10 z-10 relative text-sm w-full"
        onChange={(e) => onChange(e.target.value)}
        value={value}
      />
      <button
        onClick={() => onChange("")}
        className={cn(
          "w-8 absolute right-0 px-2 top-0 h-full pointer-events-none z-0 text-muted-foreground group-focus-within:text-white-text opacity-0 scale-50 transition flex items-center justify-center",
          value &&
            "cursor-pointer pointer-events-auto z-20 opacity-100 scale-100"
        )}
      >
        <X className="size-4" />
      </button>
    </div>
  );
};
