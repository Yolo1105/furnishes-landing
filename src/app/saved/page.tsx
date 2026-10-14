import type { Metadata } from "next";
import { SavedList } from "./SavedList";

export const metadata: Metadata = {
  title: "Kept versions",
  description:
    "The exact versions you kept, and an email you can send about them.",
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return <SavedList />;
}
