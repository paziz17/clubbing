import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-lg border border-line bg-bg-soft px-4 text-sm text-ink placeholder:text-ink-dim",
        "focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex w-full min-h-[100px] rounded-lg border border-line bg-bg-soft px-4 py-3 text-sm text-ink placeholder:text-ink-dim",
      "focus:outline-none focus:border-gold/60 focus:ring-1 focus:ring-gold/30",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
