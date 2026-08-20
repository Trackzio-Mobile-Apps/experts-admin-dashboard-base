import {
  parseExpertiseChips,
  serializeExpertiseChips,
} from "@/lib/expert-form";
import { useState, type KeyboardEvent } from "react";

type ExpertiseChipsInputProps = {
  label?: string;
  value: string;
  onChange: (next: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  required?: boolean;
};

export function ExpertiseChipsInput({
  label = "Expertise",
  value,
  onChange,
  error,
  hint,
  placeholder = "Type and press Enter",
  required,
}: ExpertiseChipsInputProps) {
  const [draft, setDraft] = useState("");
  const chips = parseExpertiseChips(value);

  const commitDraft = () => {
    const nextChip = draft.trim().replace(/,$/, "").trim();
    if (!nextChip) {
      setDraft("");
      return;
    }
    if (
      chips.some((chip) => chip.toLowerCase() === nextChip.toLowerCase())
    ) {
      setDraft("");
      return;
    }
    onChange(serializeExpertiseChips([...chips, nextChip]));
    setDraft("");
  };

  const removeChip = (chip: string) => {
    onChange(
      serializeExpertiseChips(chips.filter((item) => item !== chip)),
    );
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commitDraft();
      return;
    }
    if (e.key === "Backspace" && !draft && chips.length > 0) {
      e.preventDefault();
      removeChip(chips[chips.length - 1]);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label className="text-sm font-medium text-text">
          {label}
          {required ? <span className="sr-only"> (required)</span> : null}
        </label>
      ) : null}
      <div
        className={`flex min-h-10 flex-wrap items-center gap-2 rounded-lg border bg-input-bg px-2 py-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 ${
          error ? "border-danger" : "border-input-border"
        }`}
      >
        {chips.map((chip) => (
          <span
            key={chip}
            className="inline-flex max-w-full items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary"
          >
            <span className="truncate">{chip}</span>
            <button
              type="button"
              onClick={() => removeChip(chip)}
              className="rounded-full p-0.5 text-primary/70 hover:bg-primary/10 hover:text-primary"
              aria-label={`Remove ${chip}`}
            >
              <svg
                viewBox="0 0 16 16"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                aria-hidden
              >
                <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={chips.length === 0 ? placeholder : "Add another…"}
          className="min-w-[8rem] flex-1 border-0 bg-transparent py-1 text-sm text-text outline-none placeholder:text-text-muted"
          aria-invalid={error ? true : undefined}
        />
      </div>
      {error || hint ? (
        <p
          className={`min-h-[1.125rem] text-xs ${
            error ? "text-danger" : "text-text-muted"
          }`}
          role={error ? "alert" : undefined}
        >
          {error ?? hint}
        </p>
      ) : null}
    </div>
  );
}
