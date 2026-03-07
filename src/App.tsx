/**
 * Root Application Component
 * Handles routing and global providers
 */
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Component, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Toaster, toast } from 'sonner';
import i18n from './i18n';
import { MainLayout } from './components/layout/MainLayout';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Channels } from './pages/Channels';
import { Skills } from './pages/Skills';
import { Cron } from './pages/Cron';
import { Settings } from './pages/Settings';
import ProfessionsPage from './pages/Professions';
import { Setup } from './pages/Setup';
import { useSettingsStore } from './stores/settings';
import { useGatewayStore } from './stores/gateway';
import { useSkillsStore } from './stores/skills';
import { useCronStore } from './stores/cron';


/**
 * Error Boundary to catch and display React rendering errors
 */
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('React Error Boundary caught error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px',
          color: '#f87171',
          background: '#0f172a',
          minHeight: '100vh',
          fontFamily: 'monospace'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Something went wrong</h1>
          <pre style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            background: '#1e293b',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '14px'
          }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload(); }}
            style={{
              marginTop: '16px',
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const initSettings = useSettingsStore((state) => state.init);
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const setupComplete = useSettingsStore((state) => state.setupComplete);
  const initGateway = useGatewayStore((state) => state.init);

  useEffect(() => {
    initSettings();
  }, [initSettings]);

  // Sync i18n language with persisted settings on mount
  useEffect(() => {
    if (language && language !== i18n.language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  // Initialize Gateway connection on mount
  useEffect(() => {
    initGateway();
  }, [initGateway]);

  // Redirect to setup wizard if not complete
  useEffect(() => {
    if (!setupComplete && !location.pathname.startsWith('/setup')) {
      navigate('/setup');
    }
  }, [setupComplete, location.pathname, navigate]);

  // Listen for navigation events from main process
  useEffect(() => {
    const handleNavigate = (...args: unknown[]) => {
      const path = args[0];
      if (typeof path === 'string') {
        navigate(path);
      }
    };

    const unsubscribe = window.electron.ipcRenderer.on('navigate', handleNavigate);

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [navigate]);

  // Auto-setup hooks for profession scenes:
  // - 安装并启用场景所需技能
  // - 创建示例定时任务
  useEffect(() => {
    const offSkill = window.electron.ipcRenderer.on('profession:auto-skill', async (payload) => {
      try {
        if (!payload || typeof payload !== 'object') return;
        const slug = (payload as { slug?: string }).slug;
        if (!slug) return;

        const skillsState = useSkillsStore.getState();
        const existing =
          skillsState.skills.find((s) => s.slug === slug) ||
          skillsState.skills.find((s) => s.id === slug);

        // 已存在且已启用则直接跳过
        if (existing && existing.enabled) {
          return;
        }

        // 已存在但未启用：只启用
        if (existing && !existing.enabled) {
          await skillsState.enableSkill(existing.id);
          toast.success(`已为当前场景启用技能：${existing.name || slug}`);
          return;
        }

        // 不存在：尝试通过 ClawHub 安装后再启用
        await skillsState.installSkill(slug);

        // 安装完成后，从最新状态中查找并启用
        const afterInstall = useSkillsStore.getState();
        const installed =
          afterInstall.skills.find((s) => s.slug === slug) ||
          afterInstall.skills.find((s) => s.id === slug);

        if (installed) {
          await afterInstall.enableSkill(installed.id);
          toast.success(`已为当前场景安装并启用技能：${installed.name || slug}`);
        }
      } catch (err) {
        console.error('Failed to auto-install/enable scene skill:', err);
        toast.error('自动安装场景所需技能失败，请在“技能”页面手动检查。');
      }
    });

    const offCron = window.electron.ipcRenderer.on('profession:auto-cron', async (payload) => {
      try {
        if (!payload || typeof payload !== 'object') return;
        const { name, message, schedule } = payload as {
          name?: string;
          message?: string;
          schedule?: string;
        };
        if (!name || !message || !schedule) return;

        const cronState = useCronStore.getState();

        // 避免重复创建同名任务（按名称粗略去重）
        const exists = cronState.jobs.some((job) => job.name === name);
        if (exists) {
          return;
        }

        await cronState.createJob({
          name,
          message,
          schedule,
          enabled: true,
        });

        toast.success(`已为当前场景创建示例定时任务：${name}`);
      } catch (err) {
        console.error('Failed to auto-create cron job for scene:', err);
        toast.error('自动创建场景示例定时任务失败，请在“定时任务”页面手动检查。');
      }
    });

    return () => {
      if (typeof offSkill === 'function') {
        offSkill();
      }
      if (typeof offCron === 'function') {
        offCron();
      }
    };
  }, []);

  // Apply theme
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={300}>
        <Routes>
          {/* Setup wizard (shown on first launch) */}
          <Route path="/setup/*" element={<Setup />} />

          {/* Main application routes */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Chat />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/channels" element={<Channels />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/cron" element={<Cron />} />
            <Route path="/professions" element={<ProfessionsPage showSkip={false} />} />
            <Route path="/settings/*" element={<Settings />} />
          </Route>
        </Routes>

        {/* Global toast notifications */}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          style={{ zIndex: 99999 }}
        />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
