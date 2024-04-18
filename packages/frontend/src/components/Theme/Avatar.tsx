/* eslint-disable @next/next/no-img-element */

import { User } from "@/lib/users";

function simpleHash(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

// Function to generate color based on the hash
function getColorFromHash(hash: number) {
  const seed = Math.abs(hash);
  const h = seed % 360; // Hue
  const s = 50 + (seed % 50); // Saturation (50-100%)
  const l = 40 + (seed % 20); // Lightness (40-60%)
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function Avatar({
  user,
  placeholderClassName,
  variant = "normal",
  onClick,
}: {
  user?: User | null;
  placeholderClassName?: string;
  variant?: "normal" | "small" | "border";
  onClick?: () => void;
}) {
  const size =
    variant === "small"
      ? "w-8 h-8"
      : variant === "normal"
      ? "w-12 h-12"
      : "w-[6rem] h-[6rem] ring-8 ring-[#151515]" +
        (user?.banner_url ? " -translate-y-1/2" : "");

  return user && user?.avatar_url ? (
    <img
      src={user?.avatar_url}
      alt={user?.username}
      className={classes("rounded-full", size, onClick && "cursor-pointer")}
      onClick={onClick}
    />
  ) : (
    <Placeholder
      userId={user?.id}
      className={classes(size, placeholderClassName)}
      onClick={onClick}
    />
  );
}

function Placeholder({
  userId,
  className,
  onClick,
}: Styleable & {
  userId?: ID;
  onClick?: () => void;
}) {
  if (!userId) return null;

  const hash = simpleHash(userId);
  const color1 = getColorFromHash(hash);
  const color2 = getColorFromHash(hash + hash / 2);
  const color3 = getColorFromHash(hash + hash / 3);
  const color4 = getColorFromHash(hash + hash / 4);

  return (
    <div
      className={classes(
        "rounded-full w-12 h-12 bg-white/10 shrink-0",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
      }}
      onClick={onClick}
    >
      <div
        className="w-full h-full rounded-full relative mix-blend-hard-light"
        style={{
          background: `linear-gradient(45deg, ${color3}, ${color4})`,
        }}
      />
    </div>
  );
}
