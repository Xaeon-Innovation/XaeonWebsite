import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { useDebounce } from "use-debounce";

export type Column<T> = {
  header: string;
  accessor: keyof T | ((row: T) => unknown);
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyText?: string;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
};

function getValue<T>(row: T, accessor: Column<T>["accessor"]): unknown {
  if (typeof accessor === "function") return accessor(row);
  return row[accessor];
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField,
  onRowClick,
  pageSize = 10,
  emptyText = "No data found",
  searchPlaceholder = "Search…",
  searchFields,
}: Props<T>) {
  const [searchInput, setSearchInput] = useState("");
  const [search] = useDebounce(searchInput, 300);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim() || !searchFields?.length) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchFields.some((f) => String(row[f] ?? "").toLowerCase().includes(q)),
    );
  }, [data, search, searchFields]);

  const sorted = useMemo(() => {
    if (sortCol === null) return filtered;
    const col = columns[sortCol];
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const va = String(getValue(a, col.accessor) ?? "");
      const vb = String(getValue(b, col.accessor) ?? "");
      const cmp = va.localeCompare(vb, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortCol, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageData = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  const handleSort = (i: number) => {
    if (!columns[i]?.sortable) return;
    if (sortCol === i) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortCol(i);
      setSortDir("asc");
    }
  };

  return (
    <div className="admin-table-wrap">
      {searchFields?.length ? (
        <div className="admin-table-toolbar">
          <input
            type="search"
            className="admin-search"
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
          />
          <span className="admin-table-count">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
        </div>
      ) : null}

      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={col.header}
                  className={`admin-th ${col.sortable ? "admin-th-sortable" : ""} ${col.className ?? ""}`}
                  onClick={() => handleSort(i)}
                >
                  <span className="admin-th-inner">
                    {col.header}
                    {col.sortable && (
                      <span className="admin-sort-icon">
                        {sortCol === i ? (
                          sortDir === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : (
                          <ChevronsUpDown size={14} />
                        )}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="admin-td-empty">
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageData.map((row) => (
                <tr
                  key={String(row[keyField])}
                  className={onRowClick ? "admin-tr-clickable" : ""}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => {
                    const val = getValue(row, col.accessor);
                    return (
                      <td key={col.header} className={`admin-td ${col.className ?? ""}`}>
                        {col.render ? col.render(val, row) : String(val ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="admin-pagination">
          <button
            type="button"
            className="admin-page-btn"
            disabled={safePage === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            ← Prev
          </button>
          <span className="admin-page-info">
            {safePage + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="admin-page-btn"
            disabled={safePage >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
