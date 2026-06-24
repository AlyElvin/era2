import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Chip } from "@/shared/ui/era";
import { Input } from "@/shared/ui/input";
import { cn } from "@/shared/lib/utils";
import type { QueueCounts, SortOrder, VisibleFilter } from "../model/selectors";

export interface QueueToolbarProps {
  filter: VisibleFilter;
  onFilterChange: (filter: VisibleFilter) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
  query: string;
  onQueryChange: (query: string) => void;
  counts?: QueueCounts;
  className?: string;
}

interface FilterOption {
  value: VisibleFilter;
  label: string;
  countKey?: keyof QueueCounts;
}

const FILTERS: FilterOption[] = [
  { value: "all", label: "Все" },
  { value: "queued", label: "В очереди", countKey: "queued" },
  { value: "running", label: "Идёт", countKey: "running" },
  { value: "done", label: "Готово", countKey: "done" },
  { value: "failed", label: "Ошибка", countKey: "failed" },
];

const QUERY_DEBOUNCE_MS = 280;

/** Тулбар очереди: чипы-фильтры + сортировка + поиск с внутренним debounce. */
export function QueueToolbar({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  query,
  onQueryChange,
  counts,
  className,
}: QueueToolbarProps): React.ReactElement {
  const [localQuery, setLocalQuery] = useState(query);

  useEffect(() => {
    setLocalQuery(query);
  }, [query]);

  useEffect(() => {
    if (localQuery === query) {
      return;
    }
    const handle = window.setTimeout(() => onQueryChange(localQuery), QUERY_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [localQuery, query, onQueryChange]);

  const handleSortChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    onSortChange(event.target.value === "oldest" ? "oldest" : "newest");
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div
        role="group"
        aria-label="Фильтр по статусу"
        className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 no-scrollbar sm:flex-wrap sm:overflow-visible"
      >
        {FILTERS.map((option) => {
          const count = option.countKey !== undefined ? counts?.[option.countKey] : undefined;
          return (
            <Chip
              key={option.value}
              active={filter === option.value}
              aria-pressed={filter === option.value}
              onClick={() => onFilterChange(option.value)}
              className="shrink-0"
            >
              {option.label}
              {count !== undefined && (
                <span className="font-mono text-[11px] tabular-nums opacity-70">{count}</span>
              )}
            </Chip>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={localQuery}
            onChange={(event) => setLocalQuery(event.target.value)}
            placeholder="Поиск по промпту"
            aria-label="Поиск по промпту"
            className="pl-9"
          />
        </div>

        <select
          value={sort}
          onChange={handleSortChange}
          aria-label="Сортировка"
          className="h-9 shrink-0 rounded-md border border-input bg-transparent px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="newest">Сначала новые</option>
          <option value="oldest">Сначала старые</option>
        </select>
      </div>
    </div>
  );
}
