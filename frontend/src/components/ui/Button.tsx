import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ButtonHTMLAttributes, AnchorHTMLAttributes } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary: "bg-navy-800 text-paper hover:bg-navy-900",
  secondary: "border border-navy-800 text-navy-800 hover:bg-navy-800 hover:text-paper",
  ghost: "text-navy-800 hover:bg-navy-800/[0.06]",
  accent: "bg-marigold text-navy-950 hover:bg-marigold-dark",
  danger: "text-rose hover:bg-rose/10",
};

const sizes = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-5 py-3",
};

interface CommonProps {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  className?: string;
}

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}

type LinkButtonProps = CommonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function LinkButton({
  variant = "primary",
  size = "md",
  className,
  href,
  ...props
}: LinkButtonProps) {
  return (
    <Link href={href} className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}
