import { Badge, statusBadgeVariant } from "@/components/ui/Badge";
import { expertInitials, formatLastLogin } from "@/lib/expert-metrics";
import type { Expert } from "@/types/admin-api";

export function ExpertProfileHeader({ expert }: { expert: Expert }) {
  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm sm:flex-row sm:items-center">
      {expert.profilePicture ? (
        <img
          src={expert.profilePicture}
          alt=""
          className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-2 ring-border"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-2xl font-bold text-primary">
          {expertInitials(expert.name)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold text-text">{expert.name}</h2>
          <Badge variant={statusBadgeVariant(expert.status)}>
            {expert.status}
          </Badge>
          {expert.isInternal ? <Badge variant="info">Internal</Badge> : null}
          <Badge variant={expert.isAvailableForRequests ? "success" : "muted"}>
            {expert.isAvailableForRequests ? "Available" : "Unavailable"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-text-muted">{expert.email}</p>
        {expert.oneLineDescription ? (
          <p className="mt-2 text-sm text-text">{expert.oneLineDescription}</p>
        ) : null}
        {(expert.expertise || expert.yearsOfXp) && (
          <p className="mt-2 text-sm text-text-muted">
            {[expert.expertise, expert.yearsOfXp].filter(Boolean).join(" · ")}
          </p>
        )}
        <p className="mt-2 font-mono text-xs text-text-muted">ID: {expert._id}</p>
        <p className="mt-1 text-xs text-text-muted">
          Last login: {formatLastLogin(expert.lastLoginAt)}
        </p>
      </div>
    </div>
  );
}
