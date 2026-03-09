import { useState, useCallback } from 'react';
import { Copy, Check, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface MessageActionsProps {
  role: 'user' | 'assistant';
  text: string;
  isLastMessage: boolean;
  isStreaming: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onRegenerate?: () => void;
}

export function MessageActions({
  role,
  text,
  isLastMessage,
  isStreaming,
  onEdit,
  onDelete,
  onRegenerate,
}: MessageActionsProps) {
  const { t } = useTranslation('chat');
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  const isUser = role === 'user';

  return (
    <div
      className={cn(
        'flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {isUser ? (
        <>
          {onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={onEdit}
                  disabled={isStreaming}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t('messageActions.edit')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={onDelete}
                  disabled={isStreaming}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t('messageActions.delete')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </>
      ) : (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{copied ? t('messageActions.copied') : t('messageActions.copy')}</p>
            </TooltipContent>
          </Tooltip>

          {onRegenerate && isLastMessage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={onRegenerate}
                  disabled={isStreaming}
                >
                  <RefreshCw className={cn('h-3.5 w-3.5', isStreaming && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t('messageActions.regenerate')}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onDelete && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={onDelete}
                  disabled={isStreaming}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{t('messageActions.delete')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </>
      )}
    </div>
  );
}
