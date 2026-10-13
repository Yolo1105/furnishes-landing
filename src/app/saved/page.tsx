import type { Metadata } from "next";
import { SavedList } from "./SavedList";

export const metadata: Metadata = {
  title: "Saved designs",
  description:
    "The exact versions you saved, and a quote request you can send for them.",
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return <SavedList />;
}
