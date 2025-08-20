import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyableTextProps {
  text: string;
  className?: string;
  title?: string;
}

export function CopyableText({ text, className, title }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 min-w-0">
        <div className="bg-muted/50 px-2 py-1 rounded text-xs font-mono overflow-x-auto whitespace-nowrap scrollbar-none">
          {text}
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        className="h-6 w-6 p-0 flex-shrink-0"
        title={title || "Copy"}
      >
        {copied ? (
          <Check className="h-3 w-3 text-green-500" />
        ) : (
          <Copy className="h-3 w-3" />
        )}
      </Button>
    </div>
  );
}
