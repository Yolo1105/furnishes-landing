import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getDesign, isConfigurable } from "@/lib/catalog";
import { parseConfig } from "@/lib/config";
import { Customizer } from "./Customizer";

export async function generateMetadata(
  props: PageProps<"/furniture/[id]/customize">,
): Promise<Metadata> {
  const { id } = await props.params;
  const d = getDesign(id);
  return d
    ? { title: `Customize the ${d.name}`, robots: { index: false, follow: true } }
    : {};
}

export default async function CustomizePage(props: PageProps<"/furniture/[id]/customize">) {
  const { id } = await props.params;
  const design = getDesign(id);
  if (!design) notFound();
  if (!isConfigurable(design)) redirect(`/furniture/${design.id}`);
  const sp = await props.searchParams;
  const { config, issues } = parseConfig(design.id, sp);
  const saved = typeof sp.saved === "string" ? sp.saved : null;
  return (
    <Customizer
      designId={design.id}
      initial={config!}
      issues={issues}
      savedId={saved}
    />
  );
}
