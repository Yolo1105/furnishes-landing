import type { ActivityId, FamilyId, ObjectId } from "./types";

/**
 * Everyday things for "Start with what you love" (doc 13 v1.1, ch. 02).
 * Picking one only narrows what we show; it never adds anything to a
 * version, and it doesn't promise every object's size, weight or number
 * will fit.
 */
export const objects: { id: ObjectId; name: string; fits: string }[] = [
  { id: "bag-coat", name: "Bag and coat", fits: "hooks for a bag and a coat" },
  { id: "keys-post", name: "Keys and post", fits: "a tray for keys and post" },
  { id: "shoes", name: "Shoes", fits: "a shelf for shoes" },
  { id: "umbrella", name: "Umbrella", fits: "a ring for the umbrella" },
  { id: "headphones", name: "Headphones", fits: "somewhere for headphones" },
  {
    id: "laptop",
    name: "Laptop and printer",
    fits: "room for a laptop or printer",
  },
  { id: "cables", name: "Cables and chargers", fits: "a place for cables" },
  { id: "books", name: "Books", fits: "shelves for books" },
  { id: "records", name: "Records", fits: "room to show records" },
  { id: "camera", name: "Camera and gear", fits: "a shelf for your gear" },
  {
    id: "phone-glasses",
    name: "Phone, glasses, a book",
    fits: "a top within reach",
  },
  { id: "cups", name: "Cups", fits: "a place for cups" },
  { id: "jars", name: "Jars and spices", fits: "room for jars" },
  { id: "plants", name: "Plants", fits: "a top for a plant" },
  { id: "tv-devices", name: "Router and devices", fits: "a place for devices" },
];

export const activities: {
  id: ActivityId;
  name: string;
  fits: string;
}[] = [
  { id: "hang", name: "Hang things up", fits: "has hooks or a rail" },
  {
    id: "set-down",
    name: "Set things down",
    fits: "has a top or a tray at hand",
  },
  { id: "store", name: "Put things away", fits: "keeps things out of sight" },
  { id: "display", name: "Show things", fits: "has shelves to show things" },
  {
    id: "work",
    name: "Work or make",
    fits: "keeps tools at hand while you work",
  },
  { id: "divide", name: "Divide a room", fits: "draws a line in a room" },
  { id: "move", name: "Move it around", fits: "rolls to where it's needed" },
];

export const families: Record<FamilyId, { name: string; line: string }> = {
  pieces: {
    name: "Pieces",
    line: "Single pieces against a wall: by the door, beside the desk or the bed, in the kitchen.",
  },
  walls: {
    name: "Walls",
    line: "Segments that stand in the room: a line of shelves between two uses, both sides working.",
  },
  screens: {
    name: "Screens",
    line: "The function face on casters: a backdrop on one side, a working face on the other.",
  },
};
