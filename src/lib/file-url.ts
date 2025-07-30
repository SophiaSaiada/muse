import type { MidiFile } from "@/types";

export const getFileUrl = ({ id, source }: Pick<MidiFile, "source" | "id">) => {
  switch (source) {
    case "b":
      return `https://bitmidi.com/uploads/${id}.mid`;
    case "e":
      return `/midi/${id}.mid`;
    default:
      return null;
  }
};
