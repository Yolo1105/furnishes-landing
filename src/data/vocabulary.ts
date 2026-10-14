import type { ObjectId } from "./types";

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
