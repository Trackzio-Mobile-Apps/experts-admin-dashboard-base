import type { CreateExpertBody, UpdateExpertBody } from "@/types/admin-api";

/**
 * Form helpers for create/update expert. Keep payload shaping here so pages
 * stay UI-only and the backend never receives empty optional strings.
 */

export const ONE_LINE_DESCRIPTION_MAX = 200;

/** Backend rejects empty/null optional profile strings — omit them instead. */
export function optionalProfileString(
  value: string | null | undefined,
): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export type ExpertProfileFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  supportedCountries: string;
  profilePicture: string;
  oneLineDescription: string;
  yearsOfXp: string;
  expertise: string;
};

export function parseSupportedCountries(raw: string): string[] {
  return raw
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

/** Split expertise chips from a stored comma-separated string. */
export function parseExpertiseChips(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/** Join expertise chips for API payload, e.g. "a, b". */
export function serializeExpertiseChips(chips: string[]): string {
  return chips
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Normalize years input for the API.
 * Typing `12` becomes `12 years`; `12 years` / `12 year` stay normalized.
 */
export function normalizeYearsOfXp(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(years?)?$/i);
  if (!match) return "";

  return `${match[1]} years`;
}

/** Show a bare number in the form when stored value is like "12 years". */
export function yearsOfXpInputValue(
  stored: string | null | undefined,
): string {
  if (!stored) return "";
  const match = stored.trim().match(/^(\d+(?:\.\d+)?)\s*years?$/i);
  return match ? match[1] : stored.trim();
}

/** Clamp description to the API-facing max length. */
export function clampOneLineDescription(value: string): string {
  return value.slice(0, ONE_LINE_DESCRIPTION_MAX);
}

export function validateExpertProfileForm(
  form: ExpertProfileFormValues,
  options: { requirePassword: boolean },
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = "Name is required";
  if (!form.email.trim()) errors.email = "Email is required";
  if (!normalizeYearsOfXp(form.yearsOfXp)) {
    errors.yearsOfXp = "Enter years of experience as a number (e.g. 12)";
  }
  if (parseExpertiseChips(form.expertise).length === 0) {
    errors.expertise = "Expertise is required";
  }
  if (form.oneLineDescription.length > ONE_LINE_DESCRIPTION_MAX) {
    errors.oneLineDescription = `Description must be ${ONE_LINE_DESCRIPTION_MAX} characters or fewer`;
  }

  if (options.requirePassword) {
    const password = form.password;
    const confirmPassword = form.confirmPassword;
    const passwordProvided = Boolean(password.trim());
    const confirmProvided = Boolean(confirmPassword.trim());

    if (!passwordProvided) errors.password = "Password is required";
    if (!confirmProvided) {
      errors.confirmPassword = "Confirm password is required";
    }
    if (
      passwordProvided &&
      confirmProvided &&
      password !== confirmPassword
    ) {
      errors.confirmPassword = "Passwords do not match";
    }
  }

  return errors;
}

export type PasswordChangeFormValues = {
  oldPassword: string;
  password: string;
  confirmPassword: string;
};

export function validatePasswordChangeForm(
  form: PasswordChangeFormValues,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.oldPassword.trim()) {
    errors.oldPassword = "Current password is required";
  }
  if (!form.password.trim()) errors.password = "New password is required";
  if (!form.confirmPassword.trim()) {
    errors.confirmPassword = "Confirm password is required";
  }
  if (
    form.password.trim() &&
    form.confirmPassword.trim() &&
    form.password !== form.confirmPassword
  ) {
    errors.confirmPassword = "Passwords do not match";
  }
  if (
    form.oldPassword.trim() &&
    form.password.trim() &&
    form.oldPassword === form.password
  ) {
    errors.password = "New password must be different from current password";
  }
  return errors;
}

export function buildCreateExpertBody(
  form: ExpertProfileFormValues,
): CreateExpertBody {
  const body: CreateExpertBody = {
    name: form.name.trim(),
    email: form.email.trim(),
    password: form.password,
    supportedCountries: parseSupportedCountries(form.supportedCountries),
    yearsOfXp: normalizeYearsOfXp(form.yearsOfXp),
    expertise: serializeExpertiseChips(parseExpertiseChips(form.expertise)),
  };

  const profilePicture = optionalProfileString(form.profilePicture);
  if (profilePicture) body.profilePicture = profilePicture;

  const oneLineDescription = optionalProfileString(
    clampOneLineDescription(form.oneLineDescription),
  );
  if (oneLineDescription) body.oneLineDescription = oneLineDescription;

  return body;
}

/** Profile update only — never changes password (keeps existing password). */
export function buildUpdateExpertBody(
  form: ExpertProfileFormValues,
): UpdateExpertBody {
  const body: UpdateExpertBody = {
    name: form.name.trim(),
    email: form.email.trim(),
    supportedCountries: parseSupportedCountries(form.supportedCountries),
    yearsOfXp: normalizeYearsOfXp(form.yearsOfXp),
    expertise: serializeExpertiseChips(parseExpertiseChips(form.expertise)),
  };

  const profilePicture = optionalProfileString(form.profilePicture);
  if (profilePicture) body.profilePicture = profilePicture;

  const oneLineDescription = optionalProfileString(
    clampOneLineDescription(form.oneLineDescription),
  );
  if (oneLineDescription) body.oneLineDescription = oneLineDescription;

  return body;
}

/** Admin password reset / change — backend accepts new password only. */
export function buildPasswordChangeBody(
  form: PasswordChangeFormValues,
): Pick<UpdateExpertBody, "password"> {
  return { password: form.password };
}

/** Internal experts cannot be suspended or blocked (backend returns 409). */
export function canSetExpertStatus(
  isInternal: boolean,
  nextStatus: "active" | "suspended" | "blocked",
): boolean {
  if (!isInternal) return true;
  return nextStatus === "active";
}
