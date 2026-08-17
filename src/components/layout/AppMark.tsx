"use client";

/** Square brand mark used on login and in the sidebar. */
export function AppMark({
  icon,
  color,
  size = "md",
}: {
  icon: string;
  color: string;
  size?: "sm" | "md" | "lg";
}) {
  const box =
    size === "lg"
      ? "h-14 w-14 rounded-2xl text-2xl"
      : size === "sm"
        ? "h-8 w-8 rounded-lg text-xs"
        : "h-11 w-11 rounded-xl text-lg";
  return (
    <div
      className={`flex shrink-0 items-center justify-center font-bold text-white shadow-sm ${box}`}
      style={{ backgroundColor: color }}
    >
      {icon}
    </div>
  );
}
