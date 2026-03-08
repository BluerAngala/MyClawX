/**
 * Chat Page
 * Native React implementation communicating with OpenClaw Gateway
 * via gateway:rpc IPC. Session selector, thinking toggle, and refresh
 * are in the toolbar; messages render with markdown + streaming.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Bot, Loader2, MessageSquare, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useChatStore, type RawMessage } from '@/stores/chat';
import { useGatewayStore } from '@/stores/gateway';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatToolbar } from './ChatToolbar';
import { extractImages, extractText, extractThinking, extractToolUse } from './message-utils';
import { useTranslation } from 'react-i18next';
import { useProfessionsStore } from '@/stores/professions';
import type { UserProfessionConfig, Profession, ProfessionScene, PromptTemplate } from '@/types/profession';

export function Chat() {
  const { t } = useTranslation('chat');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const gatewayStatus = useGatewayStore((s) => s.status);
  const isGatewayRunning = gatewayStatus.state === 'running';

  const messages = useChatStore((s) => s.messages);
  const loading = useChatStore((s) => s.loading);
  const sending = useChatStore((s) => s.sending);
  const error = useChatStore((s) => s.error);
  const showThinking = useChatStore((s) => s.showThinking);
  const streamingMessage = useChatStore((s) => s.streamingMessage);
  const streamingTools = useChatStore((s) => s.streamingTools);
  const pendingFinal = useChatStore((s) => s.pendingFinal);
  const loadHistory = useChatStore((s) => s.loadHistory);
  const loadSessions = useChatStore((s) => s.loadSessions);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const abortRun = useChatStore((s) => s.abortRun);
  const clearError = useChatStore((s) => s.clearError);
  const restartGateway = useGatewayStore((s) => s.restart);
  const startGateway = useGatewayStore((s) => s.start);

  const cleanupEmptySession = useChatStore((s) => s.cleanupEmptySession);

  const { userConfig, fetchUserConfig, professions, fetchProfessions } = useProfessionsStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingTimestamp, setStreamingTimestamp] = useState<number>(0);

  // Load data when gateway is running.
  // When the store already holds messages for this session (i.e. the user
  // is navigating *back* to Chat), use quiet mode so the existing messages
  // stay visible while fresh data loads in the background.  This avoids
  // an unnecessary messages → spinner → messages flicker.
  useEffect(() => {
    if (!isGatewayRunning) return;
    let cancelled = false;
    const hasExistingMessages = useChatStore.getState().messages.length > 0;
    (async () => {
      await loadSessions();
      if (cancelled) return;
      await loadHistory(hasExistingMessages);
      
      // Load profession config
      await fetchUserConfig();
      await fetchProfessions();
    })();
    return () => {
      cancelled = true;
      // If the user navigates away without sending any messages, remove the
      // empty session so it doesn't linger as a ghost entry in the sidebar.
      cleanupEmptySession();
    };
  }, [isGatewayRunning, loadHistory, loadSessions, cleanupEmptySession, fetchUserConfig, fetchProfessions]);

  // Auto-scroll on new messages, streaming, or activity changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage, sending, pendingFinal]);

  // Update timestamp when sending starts
  useEffect(() => {
    if (sending && streamingTimestamp === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStreamingTimestamp(Date.now() / 1000);
    } else if (!sending && streamingTimestamp !== 0) {
      setStreamingTimestamp(0);
    }
  }, [sending, streamingTimestamp]);

  // Gateway not running
  if (!isGatewayRunning) {
    const isStarting = gatewayStatus.state === 'starting' || gatewayStatus.state === 'reconnecting';
    const isError = gatewayStatus.state === 'error';

    return (
      <div className="flex h-[calc(100vh-8rem)] flex-col items-center justify-center text-center p-8">
        <div className="relative mb-6">
          {isStarting ? (
            <div className="relative">
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary/60" />
              </div>
            </div>
          ) : isError ? (
            <div className="bg-destructive/10 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
          ) : (
            <div className="bg-yellow-500/10 p-4 rounded-full">
              <AlertCircle className="h-12 w-12 text-yellow-500" />
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold mb-3">
          {isStarting ? tCommon('gateway.starting') : isError ? tCommon('gateway.error') : tCommon('gateway.notRunning')}
        </h2>

        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          {isError ? (gatewayStatus.error || t('chat:gatewayRequired')) : t('chat:gatewayRequired')}
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          {isError || gatewayStatus.state === 'stopped' ? (
            <button
              onClick={() => startGateway()}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
              {tCommon('actions.retry') || 'Retry'}
            </button>
          ) : isStarting ? (
            <button
              disabled
              className="w-full bg-muted text-muted-foreground px-6 py-2.5 rounded-lg font-medium cursor-not-allowed opacity-70"
            >
              {tCommon('status.connecting') || 'Connecting...'}
            </button>
          ) : null}

          {(isError || !isStarting) && (
            <button
              onClick={() => restartGateway()}
              className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-6 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {tCommon('actions.restart') || 'Force Restart Gateway'}
            </button>
          )}
        </div>

        {isStarting && (
          <p className="mt-6 text-xs text-muted-foreground animate-pulse">
            {tCommon('status.loading')}
          </p>
        )}
      </div>
    );
  }

  const streamMsg = streamingMessage && typeof streamingMessage === 'object'
    ? streamingMessage as unknown as { role?: string; content?: unknown; timestamp?: number }
    : null;
  const streamText = streamMsg ? extractText(streamMsg) : (typeof streamingMessage === 'string' ? streamingMessage : '');
  const hasStreamText = streamText.trim().length > 0;
  const streamThinking = streamMsg ? extractThinking(streamMsg) : null;
  const hasStreamThinking = showThinking && !!streamThinking && streamThinking.trim().length > 0;
  const streamTools = streamMsg ? extractToolUse(streamMsg) : [];
  const hasStreamTools = streamTools.length > 0;
  const streamImages = streamMsg ? extractImages(streamMsg) : [];
  const hasStreamImages = streamImages.length > 0;
  const hasStreamToolStatus = streamingTools.length > 0;
  const shouldRenderStreaming = sending && (hasStreamText || hasStreamThinking || hasStreamTools || hasStreamImages || hasStreamToolStatus);
  const hasAnyStreamContent = hasStreamText || hasStreamThinking || hasStreamTools || hasStreamImages || hasStreamToolStatus;

  return (
    <div className="flex flex-col -m-6" style={{ height: 'calc(100vh - 2.5rem)' }}>
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-end px-4 py-2">
        <ChatToolbar />
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading && !sending ? (
            <div className="flex h-full items-center justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : messages.length === 0 && !sending ? (
            <WelcomeScreen 
              userConfig={userConfig} 
              professions={professions} 
              onSendMessage={sendMessage}
              navigate={navigate}
            />
          ) : (
            <>
              {messages.map((msg, idx) => (
                <ChatMessage
                  key={msg.id || `msg-${idx}`}
                  message={msg}
                  showThinking={showThinking}
                />
              ))}

              {/* Streaming message */}
              {shouldRenderStreaming && (
                <ChatMessage
                  message={(streamMsg
                    ? {
                        ...(streamMsg as Record<string, unknown>),
                        role: (typeof streamMsg.role === 'string' ? streamMsg.role : 'assistant') as RawMessage['role'],
                        content: streamMsg.content ?? streamText,
                        timestamp: streamMsg.timestamp ?? streamingTimestamp,
                      }
                    : {
                        role: 'assistant',
                        content: streamText,
                        timestamp: streamingTimestamp,
                      }) as RawMessage}
                  showThinking={showThinking}
                  isStreaming
                  streamingTools={streamingTools}
                />
              )}

              {/* Activity indicator: waiting for next AI turn after tool execution */}
              {sending && pendingFinal && !shouldRenderStreaming && (
                <ActivityIndicator phase="tool_processing" />
              )}

              {/* Typing indicator when sending but no stream content yet */}
              {sending && !pendingFinal && !hasAnyStreamContent && (
                <TypingIndicator />
              )}
            </>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error bar */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
            <button
              onClick={clearError}
              className="text-xs text-destructive/60 hover:text-destructive underline"
            >
              {tCommon('actions.dismiss')}
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <ChatInput
        onSend={sendMessage}
        onStop={abortRun}
        disabled={!isGatewayRunning}
        sending={sending}
      />
    </div>
  );
}

// ── Welcome Screen ──────────────────────────────────────────────

interface WelcomeScreenProps {
  userConfig: UserProfessionConfig | null;
  professions: Profession[];
  onSendMessage: (message: string) => void;
  navigate: ReturnType<typeof useNavigate>;
}

function WelcomeScreen({ userConfig, professions, onSendMessage, navigate }: WelcomeScreenProps) {
  const { t } = useTranslation('chat');
  
  const currentProfession = professions.find(p => p.id === userConfig?.professionId);
  const currentScene = currentProfession?.scenes.find((s: ProfessionScene) => s.id === userConfig?.sceneId);
  const templates = currentScene?.promptTemplates || [];

  return (
    <div className="flex flex-col items-center justify-center text-center py-10">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mb-6 shadow-lg">
        <Bot className="h-8 w-8 text-white" />
      </div>
      
      {currentScene ? (
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="text-3xl">{currentScene.icon}</span>
            <h2 className="text-2xl font-bold tracking-tight">{currentScene.nameZh}</h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary transition-colors ml-1"
              onClick={() => navigate('/professions')}
              title="切换场景"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground max-w-md mx-auto text-sm leading-relaxed">
            {currentScene.descriptionZh}
          </p>
        </div>
      ) : (
        <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h2 className="text-3xl font-bold mb-3 tracking-tight">{t('welcome.title')}</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('welcome.subtitle')}
          </p>
          <Button 
            variant="outline" 
            className="rounded-full px-6 border-primary/20 hover:bg-primary/5 hover:border-primary/40 text-primary transition-all group"
            onClick={() => navigate('/professions')}
          >
            <Sparkles className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
            选择专业场景，开启高效工作
          </Button>
        </div>
      )}

      {templates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          {templates.map((template: PromptTemplate) => (
            <Card 
              key={template.id} 
              className="text-left cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
              onClick={() => {
                // Remove placeholders like {{topic}} for easier use, or just send as is
                const cleanContent = template.content.replace(/\{\{.*?\}\}/g, '');
                onSendMessage(cleanContent);
              }}
            >
              <CardContent className="p-4 flex flex-col h-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <h3 className="font-bold text-sm">{template.nameZh}</h3>
                  </div>
                  <Badge variant="outline" className="text-[9px] opacity-50 uppercase tracking-tighter">
                    {template.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed flex-1">
                  {template.content.replace(/\{\{.*?\}\}/g, '___')}
                </p>
                <div className="mt-3 flex items-center justify-end text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  立即使用 <ArrowRight className="ml-1 h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-lg w-full">
          {[
            { icon: MessageSquare, title: t('welcome.askQuestions'), desc: t('welcome.askQuestionsDesc') },
            { icon: Sparkles, title: t('welcome.creativeTasks'), desc: t('welcome.creativeTasksDesc') },
          ].map((item, i) => (
            <Card key={i} className="text-left">
              <CardContent className="p-4">
                <item.icon className="h-6 w-6 text-primary mb-2" />
                <h3 className="font-medium">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {currentScene && (
        <Button 
          variant="ghost" 
          size="sm" 
          className="mt-8 text-muted-foreground hover:text-primary transition-colors"
          onClick={() => navigate('/professions')}
        >
          切换职业场景
        </Button>
      )}
    </div>
  );
}

// ── Typing Indicator ────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="bg-muted rounded-2xl px-4 py-3">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ── Activity Indicator (shown between tool cycles) ─────────────

function ActivityIndicator({ phase }: { phase: 'tool_processing' }) {
  void phase;
  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
        <Sparkles className="h-4 w-4" />
      </div>
      <div className="bg-muted rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span>Processing tool results…</span>
        </div>
      </div>
    </div>
  );
}

export default Chat;
