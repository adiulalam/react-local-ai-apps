import { useState, useRef, useEffect } from "react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface ChatInputProps {
  onSend: (message: string) => void;
  onInterrupt?: () => void;
  isRunning?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({
  onSend,
  onInterrupt,
  isRunning,
  disabled,
  placeholder = "Type a message...",
}: ChatInputProps) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isRunning && !disabled) {
      onSend(input.trim());
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="items-centers relative flex w-full">
      <Textarea
        ref={textareaRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="bg-muted/50 max-h-50 min-h-13 w-full resize-none overflow-hidden rounded-2xl pt-4 pr-12 pb-4 pl-4 focus-visible:ring-1"
        rows={1}
      />
      <div className="absolute right-2 bottom-2">
        {isRunning ? (
          <Button
            size="icon"
            variant="default"
            className="h-8 w-8 rounded-full"
            onClick={onInterrupt}
          >
            <Square className="h-4 w-4 fill-current" />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="default"
            className="h-8 w-8 rounded-full"
            onClick={handleSend}
            disabled={!input.trim() || disabled}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
