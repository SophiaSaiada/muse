import { getFileId } from "@/lib/file-id";
import { cn } from "@/lib/utils";
import type { MidiFileWithName } from "@/types";
import { Music2 } from "lucide-react";
import { NavLink } from "react-router";

export const Song = ({
  file,
  isSearching,
}: {
  file: MidiFileWithName;
  isSearching: boolean;
}) => {
  return (
    <NavLink
      to={`/s/${getFileId(file)}`}
      state={{ displayName: file.displayName }}
      className={cn(
        "rounded-md group transition font-body text-left",
        isSearching && "opacity-50"
      )}
    >
      <span className="w-4 mr-2 inline-block">
        <Music2 className="size-4 relative top-0.5" />
      </span>
      <span>{file.displayName}</span>
    </NavLink>
  );
};
