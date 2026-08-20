import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ExpertFilters, ExpertSortKey } from "@/lib/expert-metrics";

type ExpertFilterBarProps = {
  filters: ExpertFilters;
  onChange: (next: ExpertFilters) => void;
  sortKey: ExpertSortKey;
  onSortChange: (sortKey: ExpertSortKey) => void;
  resultCount: number;
  totalCount: number;
};

const SORT_OPTIONS = [
  { value: "name", label: "Name A–Z" },
  { value: "most_active_requests", label: "Most workload" },
  { value: "last_login_desc", label: "Last login (newest)" },
  { value: "last_login_asc", label: "Last login (oldest)" },
];

export function ExpertFilterBar({
  filters,
  onChange,
  sortKey,
  onSortChange,
  resultCount,
  totalCount,
}: ExpertFilterBarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-input-bg/40 p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[200px] flex-1">
        <Input
          label="Search"
          placeholder="Name or email…"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
        />
      </div>
      <div className="w-full sm:w-40">
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as ExpertFilters["status"],
            })
          }
          options={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "suspended", label: "Suspended" },
            { value: "blocked", label: "Blocked" },
          ]}
        />
      </div>
      <div className="w-full sm:w-44">
        <Select
          label="Availability"
          value={filters.availability}
          onChange={(e) =>
            onChange({
              ...filters,
              availability: e.target.value as ExpertFilters["availability"],
            })
          }
          options={[
            { value: "all", label: "All" },
            { value: "available", label: "Available" },
            { value: "unavailable", label: "Unavailable" },
          ]}
        />
      </div>
      <div className="w-full sm:w-40">
        <Select
          label="Type"
          value={filters.type}
          onChange={(e) =>
            onChange({
              ...filters,
              type: e.target.value as ExpertFilters["type"],
            })
          }
          options={[
            { value: "all", label: "All types" },
            { value: "external", label: "External" },
            { value: "internal", label: "Internal" },
          ]}
        />
      </div>
      <div className="w-full sm:w-44">
        <Select
          label="Sort by"
          value={sortKey}
          onChange={(e) => onSortChange(e.target.value as ExpertSortKey)}
          options={SORT_OPTIONS}
        />
      </div>
      <p className="pb-2 text-xs text-text-muted sm:ml-auto">
        Showing {resultCount} of {totalCount}
      </p>
    </div>
  );
}
