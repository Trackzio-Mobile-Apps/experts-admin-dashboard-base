import { useAdminKey } from "@/components/layout/AdminAuthGuard";
import { ExpertiseChipsInput } from "@/components/experts/ExpertiseChipsInput";
import { ProfileImageField } from "@/components/experts/ProfileImageField";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { createExpert } from "@/lib/admin-api";
import {
  ONE_LINE_DESCRIPTION_MAX,
  buildCreateExpertBody,
  clampOneLineDescription,
  validateExpertProfileForm,
  type ExpertProfileFormValues,
} from "@/lib/expert-form";
import { useApiHandler } from "@/lib/useApiHandler";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const EMPTY_FORM: ExpertProfileFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  supportedCountries: "",
  profilePicture: "",
  oneLineDescription: "",
  yearsOfXp: "",
  expertise: "",
};

export default function NewExpertPage() {
  const adminKey = useAdminKey();
  const navigate = useNavigate();
  const handleApiError = useApiHandler();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState<ExpertProfileFormValues>(EMPTY_FORM);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validateExpertProfileForm(form, {
      requirePassword: true,
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const expert = await createExpert(adminKey, buildCreateExpertBody(form));
      showToast("Expert created", "success");
      navigate(`/experts/${expert._id}`);
    } catch (err) {
      handleApiError(err, (msg) => showToast(msg, "error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Create expert"
        description="Add a new expert account to the platform."
        action={
          <Link to="/experts">
            <Button variant="secondary">Back to list</Button>
          </Link>
        }
      />

      <Card title="Expert details">
        <form onSubmit={handleSubmit} className="mx-auto max-w-xl space-y-4">
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
          <PasswordInput
            label="Password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            placeholder="Enter a secure password"
            required
          />
          <PasswordInput
            label="Confirm password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) =>
              setForm({ ...form, confirmPassword: e.target.value })
            }
            error={errors.confirmPassword}
            placeholder="Re-enter password"
            required
          />
          <Input
            label="Supported countries"
            value={form.supportedCountries}
            onChange={(e) =>
              setForm({ ...form, supportedCountries: e.target.value })
            }
            hint="Comma-separated ISO codes (e.g. IN, GB). Leave empty for all countries."
            placeholder="IN, GB"
          />
          <Input
            label="Years of experience"
            inputMode="numeric"
            value={form.yearsOfXp}
            onChange={(e) => setForm({ ...form, yearsOfXp: e.target.value })}
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
          />
          <Textarea
            label="One-line description"
            value={form.oneLineDescription}
            onChange={(e) =>
              setForm({
                ...form,
                oneLineDescription: clampOneLineDescription(e.target.value),
              })
            }
            error={errors.oneLineDescription}
            hint={`${form.oneLineDescription.length}/${ONE_LINE_DESCRIPTION_MAX} characters`}
            placeholder="Ancient coin specialist with deep grading experience"
            maxLength={ONE_LINE_DESCRIPTION_MAX}
            rows={2}
          />

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Link to="/experts">
              <Button variant="secondary" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={loading} className="w-full sm:w-auto">
              Create expert
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
