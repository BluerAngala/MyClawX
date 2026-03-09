/**
 * Sidebar Component
 * Navigation sidebar with menu items.
 * No longer fixed - sits inside the flex layout below the title bar.
 */
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  MessageSquare,
  Radio,
  Puzzle,
  Clock,
  Settings,
  ChevronLeft,
  ChevronRight,
  Terminal,
  ExternalLink,
  Trash2,
  Briefcase,
  Loader2,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settings';
import { useChatStore } from '@/stores/chat';
import { useGatewayStore } from '@/stores/gateway';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: string;
  collapsed?: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon, label, badge, collapsed, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground',
          collapsed && 'justify-center px-2'
        )
      }
    >
      {icon}
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          {badge && (
            <Badge variant="secondary" className="ml-auto">
              {badge}
            </Badge>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useSettingsStore((state) => state.setSidebarCollapsed);
  const devModeUnlocked = useSettingsStore((state) => state.devModeUnlocked);

  const gatewayStatus = useGatewayStore((s) => s.status);
  const startGateway = useGatewayStore((s) => s.start);
  const restartGateway = useGatewayStore((s) => s.restart);

  const sessions = useChatStore((s) => s.sessions);
  const currentSessionKey = useChatStore((s) => s.currentSessionKey);
  const sessionLabels = useChatStore((s) => s.sessionLabels);
  const sessionLastActivity = useChatStore((s) => s.sessionLastActivity);
  const switchSession = useChatStore((s) => s.switchSession);
  const newSession = useChatStore((s) => s.newSession);
  const deleteSession = useChatStore((s) => s.deleteSession);

  const navigate = useNavigate();
  const isOnChat = useLocation().pathname === '/';

  const mainSessions = sessions.filter((s) => s.key.endsWith(':main'));
  const otherSessions = sessions.filter((s) => !s.key.endsWith(':main'));


  const openDevConsole = async () => {
    try {
      toast.info('正在打开 OpenClaw 控制台...');
      
      // 检查网关状态
      const gatewayStatus = useGatewayStore.getState().status;
      console.log('Current gateway status:', gatewayStatus);
      
      if (gatewayStatus.state !== 'running') {
        console.warn('Gateway is not running, attempting to start it...');
        toast.info('正在启动网关，请稍候...');
        // 尝试启动网关
        await startGateway();
        // 等待一小段时间让网关启动
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      // Get current session key to pass to Control UI
      const currentSession = useChatStore.getState().currentSessionKey;
      console.log('Current session for Control UI:', currentSession);
      
      const result = await window.electron.ipcRenderer.invoke('gateway:getControlUiUrl', currentSession) as {
        success: boolean;
        url?: string;
        error?: string;
      };
      
      console.log('Gateway Control UI URL result:', result);
      
      if (result.success && result.url) {
        console.log('Opening Dev Console URL:', result.url);
        await window.electron.openExternal(result.url);
        console.log('Dev Console opened successfully');
        toast.success('OpenClaw 控制台已打开');
      } else {
          console.error('Failed to get Dev Console URL:', result.error);
          toast.error('打开控制台失败：' + (result.error || '未知错误'));
          throw new Error(result.error || 'Unknown error getting Control UI URL');
        }
    } catch (err) {
      console.error('Error opening Dev Console:', err);
      const errorMsg = String(err);
      if (!errorMsg.includes('控制台不可用')) {
        toast.error('打开控制台失败：' + errorMsg);
      }
      throw err;
    }
  };

  const { t } = useTranslation(['common', 'chat']);
  const [sessionToDelete, setSessionToDelete] = useState<{ key: string; label: string } | null>(null);

  const getSessionLabel = (key: string, displayName?: string, label?: string) => {
    if (sessionLabels[key]) return sessionLabels[key];
    if (label) return label;
    if (key.includes(':session-')) return t('chat:newSession');
    return displayName ?? key;
  };

const navItems = [
    { to: '/dashboard', icon: <Home className="h-5 w-5" />, label: t('sidebar.dashboard') },
  ];

  const navItemsAfterChat = [
    { to: '/professions', icon: <Briefcase className="h-5 w-5" />, label: t('sidebar.professions') },
    { to: '/skills', icon: <Puzzle className="h-5 w-5" />, label: t('sidebar.skills') },
    { to: '/channels', icon: <Radio className="h-5 w-5" />, label: t('sidebar.channels') },
    { to: '/cron', icon: <Clock className="h-5 w-5" />, label: t('sidebar.cronTasks') },
    { to: '/settings', icon: <Settings className="h-5 w-5" />, label: t('sidebar.settings') },
  ];

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r bg-background transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
{/* Navigation */}
      <nav className="flex-1 overflow-hidden flex flex-col p-2 gap-1">
        {navItems.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={sidebarCollapsed}
          />
        ))}

        {/* Chat nav item: acts as "New Chat" button, never highlighted as active */}
        <button
          onClick={() => {
            const { messages } = useChatStore.getState();
            if (messages.length > 0) newSession();
            navigate('/');
          }}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
            'hover:bg-accent hover:text-accent-foreground text-muted-foreground',
            sidebarCollapsed && 'justify-center px-2',
          )}
        >
          <MessageSquare className="h-5 w-5 shrink-0" />
          {!sidebarCollapsed && <span className="flex-1 text-left">{t('sidebar.newChat')}</span>}
        </button>

        {navItemsAfterChat.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            collapsed={sidebarCollapsed}
          />
        ))}

        {/* Session list — below Settings, only when expanded */}
        {!sidebarCollapsed && sessions.length > 0 && (
          <div className="mt-1 overflow-y-auto max-h-72 space-y-0.5">
            {[...mainSessions, ...[...otherSessions].sort((a, b) =>
              (sessionLastActivity[b.key] ?? 0) - (sessionLastActivity[a.key] ?? 0)
            )].map((s) => (
              <div key={s.key} className="group relative flex items-center">
                <button
                  onClick={() => { switchSession(s.key); navigate('/'); }}
                  className={cn(
                    'w-full text-left rounded-md px-3 py-1.5 text-sm truncate transition-colors',
                    !s.key.endsWith(':main') && 'pr-7',
                    'hover:bg-accent hover:text-accent-foreground',
                    isOnChat && currentSessionKey === s.key
                      ? 'bg-accent/60 text-accent-foreground font-medium'
                      : 'text-muted-foreground',
                  )}
                >
                  {getSessionLabel(s.key, s.displayName, s.label)}
                </button>
                {!s.key.endsWith(':main') && (
                  <button
                    aria-label="Delete session"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete({
                        key: s.key,
                        label: getSessionLabel(s.key, s.displayName, s.label),
                      });
                    }}
                    className={cn(
                      'absolute right-1 flex items-center justify-center rounded p-0.5 transition-opacity',
                      'opacity-0 group-hover:opacity-100',
                      'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
                    )}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 space-y-1">
        {/* Gateway Status Indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  if (gatewayStatus.state === 'running') {
                    // Already running, maybe show a toast or just do nothing
                  } else if (gatewayStatus.state === 'error' || gatewayStatus.state === 'stopped') {
                    startGateway();
                  }
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                  'hover:bg-accent hover:text-accent-foreground',
                  sidebarCollapsed && 'justify-center px-2'
                )}
              >
                <div className="relative">
                  {gatewayStatus.state === 'running' ? (
                    <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                  ) : gatewayStatus.state === 'starting' || gatewayStatus.state === 'reconnecting' ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-500" />
                  ) : gatewayStatus.state === 'error' ? (
                    <div className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  ) : (
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                  )}
                </div>

                {!sidebarCollapsed && (
                  <div className="flex flex-1 items-center justify-between overflow-hidden">
                    <span className="truncate text-muted-foreground">
                      {gatewayStatus.state === 'running'
                        ? t('gateway.running')
                        : gatewayStatus.state === 'starting' || gatewayStatus.state === 'reconnecting'
                        ? t('gateway.starting')
                        : gatewayStatus.state === 'error'
                        ? t('gateway.error')
                        : t('gateway.stopped')}
                    </span>
                    {gatewayStatus.state !== 'running' && (
                      <Zap className="h-3 w-3 text-primary animate-pulse shrink-0 ml-1" />
                    )}
                  </div>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={10}>
              <div className="text-xs space-y-1">
                <p className="font-bold">
                  {gatewayStatus.state === 'running'
                    ? t('gateway.connected')
                    : gatewayStatus.state === 'starting' || gatewayStatus.state === 'reconnecting'
                    ? t('gateway.initializing')
                    : t('gateway.notRunning')}
                </p>
                {gatewayStatus.state === 'running' && (
                  <p className="text-muted-foreground">Port: {gatewayStatus.port}</p>
                )}
                {(gatewayStatus.state === 'error' || gatewayStatus.state === 'stopped') && (
                  <p className="text-primary font-medium">{t('gateway.clickToStart')}</p>
                )}
                {gatewayStatus.state === 'running' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      restartGateway();
                    }}
                    className="text-[10px] text-destructive hover:underline block mt-1"
                  >
                    {t('gateway.forceRestart')}
                  </button>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {devModeUnlocked && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 px-3"
            onClick={openDevConsole}
          >
            <Terminal className="h-4 w-4 mr-2" />
            {!sidebarCollapsed && (
              <span className="text-xs truncate">{t('sidebar.devConsole')}</span>
            )}
            {!sidebarCollapsed && <ExternalLink className="h-3 w-3 ml-auto opacity-50" />}
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="w-full h-8"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <ConfirmDialog
        open={!!sessionToDelete}
        title={t('common.confirm')}
        message={sessionToDelete ? t('sidebar.deleteSessionConfirm', { label: sessionToDelete.label }) : ''}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        variant="destructive"
        onConfirm={async () => {
          if (!sessionToDelete) return;
          await deleteSession(sessionToDelete.key);
          if (currentSessionKey === sessionToDelete.key) navigate('/');
          setSessionToDelete(null);
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </aside>
  );
}
