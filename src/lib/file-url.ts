import type { MidiFile } from "@/types";

export const getFileUrl = ({ id, source }: Pick<MidiFile, "source" | "id">) => {
  switch (source) {
    case "bitmidi":
      return `https://bitmidi.com/uploads/${id}.mid`;
    case "example":
      return `/midi/${id}.mid`;
    default:
      return null;
  }
};
