import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { ExpertActiveRequestsPanel } from "@/components/experts/ExpertActiveRequestsPanel";
import { ExpertActivityTimeline } from "@/components/experts/ExpertActivityTimeline";
import { ExpertAllocationLookup } from "@/components/experts/ExpertAllocationLookup";
import { ExpertPerformancePanel } from "@/components/experts/ExpertPerformancePanel";
import { ExpertProfileHeader } from "@/components/experts/ExpertProfileHeader";
import { ExpertiseChipsInput } from "@/components/experts/ExpertiseChipsInput";
import { ProfileImageField } from "@/components/experts/ProfileImageField";
import { Badge, statusBadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, LoadingState, PageHeader } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import {
  getExpert,
  updateExpert,
  updateExpertStatus,
} from "@/lib/admin-api";
import {
  ONE_LINE_DESCRIPTION_MAX,
  buildPasswordChangeBody,
  buildUpdateExpertBody,
  canSetExpertStatus,
  clampOneLineDescription,
  validateExpertProfileForm,
  validatePasswordChangeForm,
  yearsOfXpInputValue,
  type ExpertProfileFormValues,
  type PasswordChangeFormValues,
} from "@/lib/expert-form";
import { useApiHandler } from "@/lib/useApiHandler";
import type { Expert, ExpertStatus } from "@/types/admin-api";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";

type Tab = "overview" | "edit" | "allocation";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "edit", label: "Edit profile" },
  { id: "allocation", label: "Allocation" },
];

const EMPTY_PASSWORD_FORM: PasswordChangeFormValues = {
  oldPassword: "",
  password: "",
  confirmPassword: "",
};

function formFromExpert(data: Expert): ExpertProfileFormValues {
  return {
    name: data.name,
    email: data.email,
    password: "",
    confirmPassword: "",
    supportedCountries: data.supportedCountries.join(", "),
    profilePicture: data.profilePicture ?? "",
    oneLineDescription: clampOneLineDescription(data.oneLineDescription ?? ""),
    yearsOfXp: yearsOfXpInputValue(data.yearsOfXp),
    expertise: data.expertise ?? "",
  };
}

export default function ExpertDetailPage() {
  const { id = "" } = useParams<{ id: string }>();
  const adminKey = useAdminKey();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();

  const [expert, setExpert] = useState<Expert | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [statusDialog, setStatusDialog] = useState<ExpertStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [form, setForm] = useState<ExpertProfileFormValues>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    supportedCountries: "",
    profilePicture: "",
    oneLineDescription: "",
    yearsOfXp: "",
    expertise: "",
  });
  const [passwordForm, setPasswordForm] =
    useState<PasswordChangeFormValues>(EMPTY_PASSWORD_FORM);

  const loadExpert = async () => {
    setLoading(true);
    try {
      const data = await getExpert(adminKey, id);
      setExpert(data);
      setForm(formFromExpert(data));
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setErrors({});
      setPasswordErrors({});
    } catch (err) {
      handleApiError(err, (msg) => showToast(msg, "error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadExpert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey, id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateExpertProfileForm(form, {
      requirePassword: false,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      const updated = await updateExpert(
        adminKey,
        id,
        buildUpdateExpertBody(form),
      );
      setExpert(updated);
      setForm(formFromExpert(updated));
      showToast("Expert updated", "success");
    } catch (err) {
      handleApiError(err, (msg) => showToast(msg, "error"));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validatePasswordChangeForm(passwordForm);
    setPasswordErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setPasswordSaving(true);
    try {
      const updated = await updateExpert(
        adminKey,
        id,
        buildPasswordChangeBody(passwordForm),
      );
      setExpert(updated);
      setPasswordForm(EMPTY_PASSWORD_FORM);
      setPasswordErrors({});
      showToast("Password updated", "success");
    } catch (err) {
      handleApiError(err, (msg) => showToast(msg, "error"));
    } finally {
      setPasswordSaving(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!statusDialog || !expert) return;
    if (!canSetExpertStatus(expert.isInternal, statusDialog)) {
      showToast("Internal expert cannot be deactivated", "error");
      setStatusDialog(null);
      return;
    }

    setStatusLoading(true);
    try {
      const updated = await updateExpertStatus(adminKey, id, statusDialog);
      setExpert(updated);
      showToast(`Status changed to ${statusDialog}`, "success");
      setStatusDialog(null);
    } catch (err) {
      handleApiError(err, (msg) => showToast(msg, "error"));
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return <LoadingState label="Loading expert…" />;
  if (!expert) {
    return (
      <div className="py-16 text-center text-text-muted">Expert not found</div>
    );
  }

  const statusOptions: ExpertStatus[] = ["active", "suspended", "blocked"];
  const availableStatusActions = statusOptions.filter(
    (status) =>
      status !== expert.status &&
      canSetExpertStatus(expert.isInternal, status),
  );

  return (
    <>
      <PageHeader
        title="Expert detail"
        description="Performance, editing, and allocation audit."
        action={
          <Link to="/experts">
            <Button variant="secondary" size="sm">
              Back to list
            </Button>
          </Link>
        }
      />

      <ExpertProfileHeader expert={expert} />

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-input-bg/40 p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-surface text-text shadow-sm"
                : "text-text-muted hover:text-text"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-6">
          <ExpertPerformancePanel expert={expert} />
          <div className="grid gap-6 lg:grid-cols-2">
            <ExpertActiveRequestsPanel expert={expert} />
            <ExpertActivityTimeline expert={expert} />
          </div>
          <Card title="Quick status actions">
            <p className="mb-4 text-sm text-text-muted">
              Current:{" "}
              <Badge variant={statusBadgeVariant(expert.status)}>
                {expert.status}
              </Badge>
            </p>
            {expert.isInternal ? (
              <p className="mb-4 text-sm text-text-muted">
                Internal experts cannot be suspended or blocked.
              </p>
            ) : null}
            {availableStatusActions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {availableStatusActions.map((status) => (
                  <Button
                    key={status}
                    variant={status === "blocked" ? "danger" : "secondary"}
                    size="sm"
                    onClick={() => setStatusDialog(status)}
                  >
                    Set {status}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                No status changes available.
              </p>
            )}
          </Card>
        </div>
      ) : null}

      {tab === "edit" ? (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card title="Edit expert profile">
              <form onSubmit={handleSave} className="space-y-4">
                <Input
                  label="Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  error={errors.name}
                  placeholder="Jordan Lee"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  error={errors.email}
                  placeholder="expert@example.com"
                  required
                />
                <Input
                  label="Supported countries"
                  value={form.supportedCountries}
                  onChange={(e) =>
                    setForm({ ...form, supportedCountries: e.target.value })
                  }
                  hint="Comma-separated ISO codes. Empty = all countries."
                  placeholder="IN, GB, US"
                />
                <Input
                  label="Years of experience"
                  inputMode="numeric"
                  value={form.yearsOfXp}
                  onChange={(e) =>
                    setForm({ ...form, yearsOfXp: e.target.value })
                  }
                  error={errors.yearsOfXp}
                  hint='Enter a number (e.g. 12). Saved as "12 years".'
                  placeholder="12"
                  required
                />
                <ExpertiseChipsInput
                  value={form.expertise}
                  onChange={(expertise) => setForm({ ...form, expertise })}
                  error={errors.expertise}
                  placeholder="Ancient coins"
                  hint='Add multiple chips. Saved as a comma-separated string, e.g. "Ancient coins, British India".'
                  required
                />
                <ProfileImageField
                  value={form.profilePicture}
                  onChange={(profilePicture) =>
                    setForm({ ...form, profilePicture })
                  }
                  hint="Upload a new image or leave the current URL unchanged. URL is read-only."
                />
                <Textarea
                  label="One-line description"
                  value={form.oneLineDescription}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      oneLineDescription: clampOneLineDescription(
                        e.target.value,
                      ),
                    })
                  }
                  error={errors.oneLineDescription}
                  hint={`${form.oneLineDescription.length}/${ONE_LINE_DESCRIPTION_MAX} characters`}
                  placeholder="Ancient coin specialist with deep grading experience"
                  maxLength={ONE_LINE_DESCRIPTION_MAX}
                  rows={3}
                />
                <Button type="submit" loading={saving}>
                  Save profile
                </Button>
              </form>
            </Card>

            <Card title="Forgot / reset password">
              <p className="mb-4 text-sm text-text-muted">
                Separate from profile save. Enter the current password, then set
                a new one. Saving profile keeps the existing password unchanged.
              </p>
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <PasswordInput
                  label="Current password"
                  autoComplete="current-password"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      oldPassword: e.target.value,
                    })
                  }
                  error={passwordErrors.oldPassword}
                  placeholder="Enter current password"
                  required
                />
                <PasswordInput
                  label="New password"
                  autoComplete="new-password"
                  value={passwordForm.password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      password: e.target.value,
                    })
                  }
                  error={passwordErrors.password}
                  placeholder="Enter a new password"
                  required
                />
                <PasswordInput
                  label="Confirm new password"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  error={passwordErrors.confirmPassword}
                  placeholder="Re-enter new password"
                  required
                />
                <Button type="submit" loading={passwordSaving}>
                  Update password
                </Button>
              </form>
            </Card>
          </div>
          <Card title="Field notes">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-text-muted">Availability</dt>
                <dd className="font-medium">
                  {expert.isAvailableForRequests
                    ? "Available (expert toggles in their app)"
                    : "Unavailable"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Internal expert</dt>
                <dd className="font-medium">
                  {expert.isInternal ? "Yes — env-managed" : "No"}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">Countries</dt>
                <dd className="font-medium">
                  {expert.supportedCountries.length > 0
                    ? expert.supportedCountries.join(", ")
                    : "All countries"}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-text-muted">
              Profile save does not change password. Use Forgot / reset password
              to set a new one. Status uses{" "}
              <code className="font-mono">PATCH /admin/experts/:id/status</code>
              .
            </p>
          </Card>
        </div>
      ) : null}

      {tab === "allocation" ? (
        <Card title="Allocation audit for this expert">
          <ExpertAllocationLookup
            expertId={expert._id}
            expertName={expert.name}
          />
        </Card>
      ) : null}

      <ConfirmDialog
        open={statusDialog !== null}
        title={`Change status to ${statusDialog}?`}
        description={`This will set the expert's account status to "${statusDialog}".`}
        confirmLabel={`Set ${statusDialog}`}
        variant={statusDialog === "blocked" ? "danger" : "primary"}
        loading={statusLoading}
        onConfirm={confirmStatusChange}
        onCancel={() => setStatusDialog(null)}
      />
    </>
  );
}
