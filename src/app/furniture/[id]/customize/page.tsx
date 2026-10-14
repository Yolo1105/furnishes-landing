import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProduct } from "@/lib/catalog";
import { parseConfig } from "@/lib/config";
import { Customizer } from "./Customizer";
import { parseGroup } from "./groups";

export async function generateMetadata(
  props: PageProps<"/furniture/[id]/customize">,
): Promise<Metadata> {
  const { id } = await props.params;
  const p = getProduct(id);
  return p
    ? {
        title: `Select configuration: ${p.name}`,
        robots: { index: false, follow: true },
      }
    : {};
}

/** Only the launch pieces can be configured (doc 13, ch. 05). */
export default async function CustomizePage(
  props: PageProps<"/furniture/[id]/customize">,
) {
  const { id } = await props.params;
  const product = getProduct(id);
  if (!product) notFound();
  if (!product.hero) redirect(`/furniture/${product.id}`);
  const sp = await props.searchParams;
  const { config, issues } = parseConfig(product.id, sp);
  const saved = typeof sp.saved === "string" ? sp.saved : null;
  const group = parseGroup(sp.open);
  return (
    <Customizer
      designId={product.id}
      initial={config!}
      initialGroup={group}
      issues={issues}
      savedId={saved}
    />
  );
}
