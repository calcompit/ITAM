import { useState } from "react";
import { cn } from "@/lib/utils";

interface ClickableTextProps {
  text: string;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export function ClickableText({ text, className, title, onClick }: ClickableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div 
      className={cn(
        "cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors",
        copied && "bg-green-500/20 text-green-600",
        className
      )}
      onClick={handleClick}
      title={title || `Click to copy: ${text}`}
    >
      {text}
    </div>
  );
}
