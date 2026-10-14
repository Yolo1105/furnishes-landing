"use client";

import { useId, useState } from "react";
import styles from "@/components/prose/prose.module.css";
import { claims } from "@/data/claims";
import { market } from "@/data/market";
import { getProduct } from "@/lib/catalog";
import { configSummary } from "@/lib/config";
import { useSaved } from "@/lib/saved";

/** A room-sized question, written into an email with the visitor's kept versions. */
export function PlanForm() {
  const id = useId();
  const { items } = useSaved();
  const [room, setRoom] = useState("");
  const [goal, setGoal] = useState("");
  const [size, setSize] = useState("");
  const [keep, setKeep] = useState("");
  const [include, setInclude] = useState(true);
  const [opened, setOpened] = useState(false);

  const saved = items.map((e) => {
    const d = getProduct(e.design)!;
    return `- ${d.name}${e.config ? `: ${configSummary(e.config)}` : " (coming soon, kept as an idea)"}`;
  });
  const body = [
    "Hello Furnishes,",
    "",
    `Room: ${room || "(not given)"}`,
    `Rough size: ${size || "(not given)"}`,
    `What I'd like to happen there: ${goal || "(not given)"}`,
    `What stays: ${keep || "(not given)"}`,
    ...(include && saved.length ? ["", "Designs I saved:", ...saved] : []),
    "",
  ].join("\n");
  const href = `mailto:${market.email}?subject=${encodeURIComponent("A room I'd like help with")}&body=${encodeURIComponent(body)}`;

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <label htmlFor={`${id}-room`}>
        Which room?
        <input
          id={`${id}-room`}
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Shared bedroom, living room, studio…"
        />
      </label>
      <label htmlFor={`${id}-goal`}>
        What would you like to happen there?
        <textarea
          id={`${id}-goal`}
          rows={3}
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Two children, one room, a line between them"
        />
      </label>
      <label htmlFor={`${id}-size`}>
        Rough size, if you know it <span className="muted">(optional)</span>
        <input
          id={`${id}-size`}
          value={size}
          onChange={(e) => setSize(e.target.value)}
          placeholder="About 3 × 3.5 m"
        />
      </label>
      <label htmlFor={`${id}-keep`}>
        What stays as it is? <span className="muted">(optional)</span>
        <input
          id={`${id}-keep`}
          value={keep}
          onChange={(e) => setKeep(e.target.value)}
          placeholder="The beds and the desk"
        />
      </label>
      {saved.length > 0 && (
        <label className={styles.check}>
          <span>
            <input
              type="checkbox"
              checked={include}
              onChange={(e) => setInclude(e.target.checked)}
            />{" "}
            Include my {saved.length} kept{" "}
            {saved.length === 1 ? "version" : "versions"}
          </span>
        </label>
      )}
      <a
        href={href}
        className="btn btn-primary"
        onClick={() => setOpened(true)}
      >
        Write the email
      </a>
      <p className={styles.small}>
        {claims.draft.detail} No photos or measurements are needed to start.
      </p>
      {opened && (
        <p className="notice" role="status">
          We opened an email draft. It is not sent until you send it. If nothing
          opened, write to <a href={`mailto:${market.email}`}>{market.email}</a>
          .
        </p>
      )}
    </form>
  );
}
