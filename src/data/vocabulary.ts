import type { ActivityId, FamilyId, HomeId, ObjectId, UseId } from "./types";

/** Rooms and uses, in the order a visitor scans them. */
export const uses: { id: UseId; name: string; line: string; cover: string }[] =
  [
    {
      id: "entryway",
      name: "Entryway",
      line: "A place for what comes in and goes out with you.",
      cover: "entry",
    },
    {
      id: "bedroom",
      name: "Bedroom",
      line: "The things you reach for last at night and first in the morning.",
      cover: "bedside",
    },
    {
      id: "work",
      name: "Work",
      line: "Your tools in reach, beside the desk you have or with a new one.",
      cover: "desk",
    },
    {
      id: "kitchen",
      name: "Kitchen",
      line: "A little more counter, close to where you cook.",
      cover: "kitchen",
    },
    {
      id: "living",
      name: "Living room",
      line: "Longer pieces for books, records and everything under the TV.",
      cover: "sideboard",
    },
    {
      id: "dividing",
      name: "Sharing a room",
      line: "Two uses in one room, with shelves or a screen between them.",
      cover: "bookwall",
    },
    {
      id: "children",
      name: "Children's room",
      line: "Lower reach, toys away, a line between two beds.",
      cover: "child-divider",
    },
    {
      id: "bath",
      name: "Bathroom & balcony",
      line: "Small carts for towels, bottles and evenings outside.",
      cover: "bath-cart",
    },
  ];

export const activities: { id: ActivityId; name: string; fits: string }[] = [
  { id: "hang", name: "Hang things up", fits: "has hooks or a rail" },
  { id: "set-down", name: "Set things down", fits: "has a top or tray" },
  { id: "store", name: "Put things away", fits: "keeps things out of sight" },
  { id: "display", name: "Show things", fits: "has shelves to show things" },
  { id: "work", name: "Work or make", fits: "gives you a work surface" },
  { id: "divide", name: "Divide a room", fits: "draws a line in a room" },
  { id: "sit", name: "Sit", fits: "includes a place to sit (concept)" },
  { id: "move", name: "Move it around", fits: "rolls or folds away" },
  { id: "pass", name: "Pass through", fits: "has an opening to walk through" },
];

export const objects: { id: ObjectId; name: string; fits: string }[] = [
  {
    id: "coats-bags",
    name: "Coats & bags",
    fits: "a place for coats and bags",
  },
  { id: "keys-post", name: "Keys & post", fits: "a place for keys and post" },
  { id: "shoes", name: "Shoes", fits: "a place for shoes" },
  { id: "books", name: "Books", fits: "shelves for books" },
  {
    id: "records",
    name: "Records & collections",
    fits: "room to show a collection",
  },
  {
    id: "headphones-cables",
    name: "Headphones & cables",
    fits: "somewhere for headphones and cables",
  },
  {
    id: "laptop-printer",
    name: "Laptop & printer",
    fits: "room for a laptop or printer",
  },
  { id: "clothes", name: "Clothes", fits: "space to hang clothes" },
  { id: "towels", name: "Towels & toiletries", fits: "a place for towels" },
  { id: "toys", name: "Toys", fits: "somewhere for toys" },
  { id: "cups-coffee", name: "Cups & coffee", fits: "a place for cups" },
  {
    id: "jars-tools",
    name: "Jars & kitchen tools",
    fits: "room for jars and tools",
  },
  { id: "plants", name: "Plants", fits: "a top for plants" },
  {
    id: "tv-devices",
    name: "TV & devices",
    fits: "a place for the TV and devices",
  },
  {
    id: "phone-glasses",
    name: "Phone, glasses, a book",
    fits: "a top within arm's reach",
  },
];

export const families: Record<
  FamilyId,
  { name: string; plural: string; line: string }
> = {
  pieces: {
    name: "Piece",
    plural: "Single pieces",
    line: "One piece for one spot: by the door, beside the bed, next to the desk.",
  },
  walls: {
    name: "Room piece",
    plural: "Room pieces",
    line: "Shelving that works from both sides and shapes a room.",
  },
  screens: {
    name: "Screen",
    plural: "Moving screens",
    line: "On casters or folding: a line in the room you can move.",
  },
};

/** The illustrative homes the room renders are set in. */
export const homes: Record<HomeId, string> = {
  flat: "A two-room flat",
  studio: "A studio",
  family: "A family home",
  loft: "An open-plan loft",
  workshop: "A workshop",
};
