import { useState, useCallback, useRef, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface MessageEditInputProps {
  initialText: string;
  onSave: (newText: string) => void;
  onCancel: () => void;
  isStreaming?: boolean;
}

export function MessageEditInput({
  initialText,
  onSave,
  onCancel,
  isStreaming = false,
}: MessageEditInputProps) {
  const { t } = useTranslation('chat');
  const [text, setText] = useState(initialText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(initialText.length, initialText.length);
      adjustHeight();
    }
  }, [adjustHeight, initialText]);

  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    adjustHeight();
  }, [adjustHeight]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim() && !isStreaming) {
        onSave(text.trim());
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [text, isStreaming, onSave, onCancel]);

  const handleSave = useCallback(() => {
    if (text.trim() && !isStreaming) {
      onSave(text.trim());
    }
  }, [text, isStreaming, onSave]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={isStreaming}
        className={cn(
          'w-full min-h-[60px] max-h-[300px] p-3 rounded-xl border border-primary/50 bg-background',
          'text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30',
          'placeholder:text-muted-foreground',
          isStreaming && 'opacity-50 cursor-not-allowed',
        )}
        placeholder={t('messageEdit.placeholder')}
        rows={3}
      />
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isStreaming}
          className="h-8 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          {t('messageEdit.cancel')}
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!text.trim() || isStreaming}
          className="h-8 px-3"
        >
          <Check className="h-4 w-4 mr-1" />
          {t('messageEdit.save')}
        </Button>
      </div>
    </div>
  );
}
