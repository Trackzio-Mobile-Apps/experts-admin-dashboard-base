import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  EXPERT_AVATAR_ACCEPT,
  EXPERT_AVATAR_MAX_BYTES,
  uploadExpertProfileImage,
  validateExpertAvatarFile,
} from "@/lib/firebase-storage";
import { useRef, useState } from "react";

type ProfileImageFieldProps = {
  value: string;
  onChange: (url: string) => void;
  error?: string;
  hint?: string;
};

export function ProfileImageField({
  value,
  onChange,
  error,
  hint,
}: ProfileImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const firebaseReady = isFirebaseConfigured();

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const validationError = validateExpertAvatarFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    if (!firebaseReady) {
      setUploadError(
        "Firebase is not configured. Add FIREBASE_* env vars.",
      );
      return;
    }

    setUploadError(null);
    setUploading(true);
    try {
      const url = await uploadExpertProfileImage(file);
      onChange(url);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload image",
      );
    } finally {
      setUploading(false);
    }
  };

  const displayError = uploadError ?? error;
  const maxMb = EXPERT_AVATAR_MAX_BYTES / (1024 * 1024);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-input-bg">
          {value.trim() ? (
            <img
              src={value.trim()}
              alt="Expert profile preview"
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[10px] text-text-muted">
              No photo
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept={EXPERT_AVATAR_ACCEPT}
            className="hidden"
            onChange={handleFileChange}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={uploading}
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Uploading…" : "Upload image"}
            </Button>
            {value.trim() ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={uploading}
                onClick={() => {
                  setUploadError(null);
                  onChange("");
                }}
              >
                Remove
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-text-muted">
            JPG, PNG, WEBP, or GIF up to {maxMb} MB. Uploads to Firebase Storage,
            then the HTTPS URL is sent to the API.
          </p>
        </div>
      </div>

      <Input
        label="Profile picture URL"
        type="url"
        value={value}
        readOnly
        error={displayError}
        hint={
          hint ??
          (firebaseReady
            ? "Filled automatically after upload. Not editable."
            : "Firebase env vars missing — upload is unavailable until configured.")
        }
        placeholder="https://…firebasestorage.googleapis.com/…"
        className="cursor-default text-text-muted"
      />
    </div>
  );
}
