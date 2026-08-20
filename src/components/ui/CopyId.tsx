import { useToast } from "@/components/ui/Toast";
import { useState } from "react";

type CopyIdProps = {
  value: string;
  label?: string;
  className?: string;
};

export function CopyId({ value, label = "Mongo ID", className = "" }: CopyIdProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      showToast(`${label} copied`, "success");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      showToast(`Could not copy ${label.toLowerCase()}`, "error");
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={`Copy ${label}`}
      className={`group inline-flex max-w-full items-center gap-1.5 rounded-md border border-transparent px-1.5 py-0.5 text-left font-mono text-xs text-text-muted transition-colors hover:border-border hover:bg-input-bg hover:text-text ${className}`}
    >
      <span className="truncate">{value}</span>
      <span className="shrink-0 text-[10px] font-sans font-semibold uppercase tracking-wide text-primary opacity-70 group-hover:opacity-100">
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
