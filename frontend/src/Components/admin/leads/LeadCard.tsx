import { AlarmClock, UserRound } from "lucide-react";
import { formatMoney, isOverdue, relativeDay, SOURCE_LABELS, type LeadSummary } from "../../../lib/leads";
import styles from "./Leads.module.css";

type Props = {
  lead: LeadSummary;
  onOpen: (id: string) => void;
  draggable?: boolean;
  dragging?: boolean;
  onDragStart?: (id: string) => void;
  onDragEnd?: () => void;
};

export default function LeadCard({ lead, onOpen, draggable = false, dragging = false, onDragStart, onDragEnd }: Props) {
  const overdue = isOverdue(lead);
  const name = lead.contactName || lead.title;
  return (
    <button
      type="button"
      className={`${styles.card} ${dragging ? styles.cardDragging : ""}`}
      onClick={() => onOpen(lead._id)}
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", lead._id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart?.(lead._id);
      }}
      onDragEnd={onDragEnd}
      aria-label={`${name}${lead.company ? `, ${lead.company}` : ""}. Open lead`}
    >
      <span className={styles.cardName}>{name}</span>
      <span className={styles.cardSub}>
        {[lead.company, lead.interest || SOURCE_LABELS[lead.source] || lead.source].filter(Boolean).join(" · ")}
      </span>
      <span className={styles.cardFoot}>
        <span className={styles.tag}>{lead.tracked ? lead.channel : "Not tracked"}</span>
        {lead.value ? <span className={`${styles.tag} ${styles.tagValue}`}>{formatMoney(lead.value, lead.currency)}</span> : null}
        {lead.followUpAt && lead.stage !== "won" && lead.stage !== "lost" ? (
          <span className={`${styles.tag} ${overdue ? styles.tagOverdue : styles.tagDue}`}>
            <AlarmClock size={11} aria-hidden /> {overdue ? "Overdue · " : ""}
            {relativeDay(lead.followUpAt)}
          </span>
        ) : null}
        {lead.owner?.name ? (
          <span className={styles.tag}>
            <UserRound size={11} aria-hidden /> {lead.owner.name.split(" ")[0]}
          </span>
        ) : null}
      </span>
    </button>
  );
}
