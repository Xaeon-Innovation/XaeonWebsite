import { useState } from "react";
import { formatMoney, STAGE_META, STAGES, type LeadSummary, type Stage } from "../../../lib/leads";
import LeadCard from "./LeadCard";
import styles from "./Leads.module.css";

type Props = {
  leads: LeadSummary[];
  onOpen: (id: string) => void;
  onMove: (id: string, stage: Stage) => void;
};

/** Pipeline board: one column per stage; drag a card to change its stage (or open it and pick one). */
export default function LeadBoard({ leads, onOpen, onMove }: Props) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);

  return (
    <div className={styles.board} role="list" aria-label="Pipeline">
      {STAGES.map((stage) => {
        const items = leads.filter((l) => l.stage === stage);
        // Totals per currency so mixed currencies are never summed together.
        const totals = new Map<string, number>();
        for (const l of items) if (l.value) totals.set(l.currency, (totals.get(l.currency) ?? 0) + l.value);
        const meta = STAGE_META[stage];
        return (
          <section
            key={stage}
            role="listitem"
            aria-label={`${meta.label}: ${items.length} ${items.length === 1 ? "lead" : "leads"}`}
            className={`${styles.column} ${over === stage ? styles.columnOver : ""}`}
            onDragOver={(e) => {
              // Check the drag payload, not React state: a fast drag can reach here before re-render.
              if (!e.dataTransfer.types.includes("text/plain")) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (over !== stage) setOver(stage);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(null);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain") || dragId;
              setOver(null);
              setDragId(null);
              const lead = leads.find((l) => l._id === id);
              if (lead && lead.stage !== stage) onMove(lead._id, stage);
            }}
          >
            <header className={styles.columnHead} title={meta.hint}>
              <span className={styles.columnTitle}>
                <span className={styles.dot} style={{ background: meta.color }} aria-hidden />
                {meta.label}
                <span className={styles.chipCount}>{items.length}</span>
              </span>
              <span className={styles.columnMeta}>
                {[...totals].map(([cur, sum]) => (
                  <span key={cur}>{formatMoney(sum, cur)}</span>
                ))}
              </span>
            </header>
            {items.length === 0 ? <p className={styles.columnEmpty}>No leads</p> : null}
            {items.map((lead) => (
              <LeadCard
                key={lead._id}
                lead={lead}
                onOpen={onOpen}
                draggable
                dragging={dragId === lead._id}
                onDragStart={setDragId}
                onDragEnd={() => {
                  setDragId(null);
                  setOver(null);
                }}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}
