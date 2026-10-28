"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { COUNTRIES, POPULAR_COUNTRIES } from "@/lib/builder";

type Option = { code: string; name: string; other: string };

function flag(code: string): string {
  return code === "XK" ? "🏳️" : String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/**
 * Searchable country picker (ARIA combobox + listbox). Names come from the browser's Intl data in the
 * page language, so all ~250 countries are available in English and Arabic without shipping a list.
 * Search matches the name in either language or the ISO code.
 */
export default function CountrySelect({
  value,
  onChange,
  locale,
  label,
  placeholder,
  noResults,
  invalid,
  describedBy,
}: {
  value?: string;
  onChange: (code: string) => void;
  locale: string;
  label: string;
  placeholder: string;
  noResults: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const options = useMemo<Option[]>(() => {
    const names = new Intl.DisplayNames([locale], { type: "region" });
    const other = new Intl.DisplayNames([locale === "ar" ? "en" : "ar"], { type: "region" });
    return COUNTRIES.map((code) => ({ code, name: names.of(code) ?? code, other: other.of(code) ?? code })).sort((a, b) =>
      a.name.localeCompare(b.name, locale),
    );
  }, [locale]);

  const q = query.trim().toLowerCase();
  // Best matches first: exact code, then names starting with the search, then names containing it.
  const rank = (o: Option) =>
    o.code.toLowerCase() === q ? 0 : o.name.toLowerCase().startsWith(q) || o.other.toLowerCase().startsWith(q) ? 1 : 2;
  const filtered = q
    ? options
        .filter((o) => o.name.toLowerCase().includes(q) || o.other.toLowerCase().includes(q) || o.code.toLowerCase() === q)
        .sort((a, b) => rank(a) - rank(b))
    : [...POPULAR_COUNTRIES.map((c) => options.find((o) => o.code === c)!).filter(Boolean), ...options.filter((o) => !POPULAR_COUNTRIES.includes(o.code))];
  const selected = options.find((o) => o.code === value);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
  };

  const move = (delta: number) => {
    const next = Math.max(0, Math.min(filtered.length - 1, active + delta));
    setActive(next);
    listRef.current?.querySelector<HTMLElement>(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div className="relative">
      <label htmlFor={`${id}-input`} className="sr-only">{label}</label>
      <div className={`flex items-center gap-2 rounded-xl border bg-ink-2 px-4 focus-within:border-sage ${invalid ? "border-danger" : "border-line-strong"}`}>
        {selected && !open ? <span aria-hidden className="text-lg">{flag(selected.code)}</span> : <Search size={16} aria-hidden className="text-haze" />}
        <input
          ref={inputRef}
          id={`${id}-input`}
          data-field="country"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && filtered[active] ? `${id}-${filtered[active].code}` : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          autoComplete="country-name"
          className="w-full bg-transparent py-3 text-fog placeholder:text-haze focus:outline-none"
          placeholder={selected ? selected.name : placeholder}
          value={open ? query : selected?.name ?? ""}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (!open) setOpen(true);
              else move(1);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              move(-1);
            } else if (e.key === "Enter" && open && filtered[active]) {
              e.preventDefault();
              choose(filtered[active].code);
            } else if (e.key === "Escape") {
              setOpen(false);
              setQuery("");
            }
          }}
        />
        <ChevronDown size={16} aria-hidden className="text-haze" />
      </div>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-ink-2 p-1 shadow-2xl shadow-black/50"
        >
          {filtered.length === 0 && <li className="px-3 py-2 text-sm text-haze">{noResults}</li>}
          {filtered.map((o, i) => (
            <li
              key={o.code}
              id={`${id}-${o.code}`}
              role="option"
              data-index={i}
              aria-selected={o.code === value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(o.code)}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${i === active ? "bg-white/10 text-fog" : "text-mist"} ${
                !q && i === POPULAR_COUNTRIES.length ? "mt-1 border-t border-line pt-3" : ""
              }`}
            >
              <span aria-hidden className="text-base">{flag(o.code)}</span>
              <span className="flex-1">{o.name}</span>
              {o.code === value && <Check size={14} aria-hidden className="text-sage" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
