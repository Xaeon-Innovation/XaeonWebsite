import { MessageCircle } from "lucide-react";
import { CONTACT } from "@/lib/site";

/** Floating WhatsApp shortcut (plain link: works without JavaScript; tracked as contact_click). */
export default function WhatsAppButton({ label }: { label: string }) {
  return (
    <a
      href={`https://wa.me/${CONTACT.whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] end-[max(1.25rem,env(safe-area-inset-right))] z-30 inline-flex h-14 w-14 items-center justify-center rounded-full bg-sage text-on-sage shadow-lg shadow-black/40 transition-transform hover:scale-105"
    >
      <MessageCircle size={26} aria-hidden />
    </a>
  );
}
