import { Button } from "@/components/ui/Button";
import { FormActionField } from "@/components/ui/FormActionField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { UserFilters, UserSortKey } from "@/lib/user-metrics";

type UserFilterBarProps = {
  draftFilters: UserFilters;
  draftSortKey: UserSortKey;
  onDraftFiltersChange: (next: UserFilters) => void;
  onDraftSortChange: (sortKey: UserSortKey) => void;
  onApply: () => void;
  onRefresh: () => void;
  hasActiveFilters: boolean;
  resultCount: number;
  totalCount: number;
};

const SORT_OPTIONS = [
  { value: "most_requests", label: "Most requests" },
  { value: "most_active", label: "Most active" },
  { value: "most_credits", label: "Highest credits" },
  { value: "newest", label: "Newest joined" },
];

export function UserFilterBar({
  draftFilters,
  draftSortKey,
  onDraftFiltersChange,
  onDraftSortChange,
  onApply,
  onRefresh,
  hasActiveFilters,
  resultCount,
  totalCount,
}: UserFilterBarProps) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-input-bg/40 p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onApply();
        }}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_12rem_auto]"
      >
        <Input
          label="Search by email"
          placeholder="Partial email match…"
          value={draftFilters.search}
          onChange={(e) =>
            onDraftFiltersChange({ ...draftFilters, search: e.target.value })
          }
        />
        <Select
          label="Sort by"
          value={draftSortKey}
          onChange={(e) => onDraftSortChange(e.target.value as UserSortKey)}
          options={SORT_OPTIONS}
          reserveHintSpace
        />
        <FormActionField>
          <div className="flex h-10 items-center gap-2">
            <Button type="submit" className="h-10 w-full lg:w-auto">
              Apply
            </Button>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="secondary"
                className="h-10 shrink-0"
                onClick={onRefresh}
              >
                Refresh
              </Button>
            ) : null}
          </div>
        </FormActionField>
      </form>
      <p className="mt-3 text-right text-xs text-text-muted">
        Showing {resultCount} of {totalCount}
      </p>
    </div>
  );
}
