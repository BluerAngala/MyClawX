/**
 * Coze Skills Manager Component
 * UI for managing Coze bots and workflows as skills
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Bot,
  Workflow,
  Key,
  Settings,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useCozeSkillsStore } from '@/stores/coze-skills';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import type { CozeSkillConfig, CozeSkillType, CozeSkillParameter } from '@/types/coze';

function CozeSkillForm({
  skill,
  onSave,
  onCancel,
}: {
  skill?: CozeSkillConfig;
  onSave: (data: Omit<CozeSkillConfig, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation('skills');
  const [name, setName] = useState(skill?.name || '');
  const [description, setDescription] = useState(skill?.description || '');
  const [type, setType] = useState<CozeSkillType>(skill?.type || 'bot');
  const [botId, setBotId] = useState(skill?.botId || '');
  const [workflowId, setWorkflowId] = useState(skill?.workflowId || '');
  const [apiToken, setApiToken] = useState(skill?.apiToken || '');
  const [apiUrl, setApiUrl] = useState(skill?.apiUrl || '');
  const [icon, setIcon] = useState(skill?.icon || '🤖');
  const [parameters, setParameters] = useState<CozeSkillParameter[]>(skill?.parameters || []);
  const [showParams, setShowParams] = useState(false);

  const handleAddParam = () => {
    setParameters([
      ...parameters,
      { key: '', label: '', type: 'string', required: false },
    ]);
  };

  const handleUpdateParam = (index: number, updates: Partial<CozeSkillParameter>) => {
    const newParams = [...parameters];
    newParams[index] = { ...newParams[index], ...updates };
    setParameters(newParams);
  };

  const handleRemoveParam = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(t('coze.nameRequired'));
      return;
    }
    if (!apiToken.trim()) {
      toast.error(t('coze.tokenRequired'));
      return;
    }
    if (type === 'bot' && !botId.trim()) {
      toast.error(t('coze.botIdRequired'));
      return;
    }
    if (type === 'workflow' && !workflowId.trim()) {
      toast.error(t('coze.workflowIdRequired'));
      return;
    }

    onSave({
      name: name.trim(),
      description: description.trim(),
      type,
      botId: type === 'bot' ? botId.trim() : undefined,
      workflowId: type === 'workflow' ? workflowId.trim() : undefined,
      apiToken: apiToken.trim(),
      apiUrl: apiUrl.trim() || undefined,
      icon,
      enabled: skill?.enabled ?? true,
      parameters: parameters.filter((p) => p.key.trim() && p.label.trim()),
    });
  };

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          {skill ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {skill ? t('coze.editSkill') : t('coze.addSkill')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('coze.name')}</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('coze.namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('coze.icon')}</label>
            <Input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🤖"
              className="w-20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('coze.description')}</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('coze.descriptionPlaceholder')}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('coze.type')}</label>
          <div className="flex gap-2">
            <Button
              variant={type === 'bot' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setType('bot')}
              className="gap-2"
            >
              <Bot className="h-4 w-4" />
              {t('coze.bot')}
            </Button>
            <Button
              variant={type === 'workflow' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setType('workflow')}
              className="gap-2"
            >
              <Workflow className="h-4 w-4" />
              {t('coze.workflow')}
            </Button>
          </div>
        </div>

        {type === 'bot' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('coze.botId')}</label>
            <Input
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              placeholder="747349265604416****"
            />
          </div>
        )}

        {type === 'workflow' && (
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('coze.workflowId')}</label>
            <Input
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              placeholder="73505836754923****"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Key className="h-4 w-4" />
            {t('coze.apiToken')}
          </label>
          <Input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            placeholder="pat_****************"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('coze.apiUrl')}</label>
          <Input
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="https://api.coze.cn (默认)"
          />
        </div>

        <div className="border rounded-md p-3">
          <button
            className="flex items-center gap-2 text-sm font-medium w-full hover:text-primary transition-colors"
            onClick={() => setShowParams(!showParams)}
          >
            {showParams ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            {t('coze.parameters')}
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-5">
              {parameters.length}
            </Badge>
          </button>

          {showParams && (
            <div className="mt-3 space-y-3">
              {parameters.map((param, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted/30 rounded-md">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      value={param.key}
                      onChange={(e) => handleUpdateParam(index, { key: e.target.value })}
                      placeholder={t('coze.paramKey')}
                      className="h-8 text-xs"
                    />
                    <Input
                      value={param.label}
                      onChange={(e) => handleUpdateParam(index, { label: e.target.value })}
                      placeholder={t('coze.paramLabel')}
                      className="h-8 text-xs"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleRemoveParam(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddParam} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                {t('coze.addParameter')}
              </Button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            {t('coze.cancel')}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {t('coze.save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CozeSkillCard({
  skill,
  onEdit,
  onDelete,
  onToggle,
}: {
  skill: CozeSkillConfig;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation('skills');

  return (
    <Card
      className={cn(
        'cursor-pointer hover:border-primary/50 transition-colors',
        skill.enabled && 'border-primary/50 bg-primary/5'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{skill.icon || '🤖'}</span>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {skill.name}
                <Badge variant={skill.type === 'bot' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 h-4">
                  {skill.type === 'bot' ? t('coze.bot') : t('coze.workflow')}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                {skill.type === 'bot' ? `Bot ID: ${skill.botId}` : `Workflow ID: ${skill.workflowId}`}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Switch
              checked={skill.enabled}
              onCheckedChange={onToggle}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {skill.description || t('coze.noDescription')}
        </p>
        {skill.parameters && skill.parameters.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <Settings className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {t('coze.paramCount', { count: skill.parameters.length })}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function CozeSkillsManager() {
  const { t } = useTranslation('skills');
  const { skills, addSkill, updateSkill, deleteSkill, toggleSkill } = useCozeSkillsStore();
  const [showForm, setShowForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<CozeSkillConfig | null>(null);

  const handleSave = (data: Omit<CozeSkillConfig, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSkill) {
      updateSkill(editingSkill.id, data);
      toast.success(t('coze.skillUpdated'));
    } else {
      addSkill(data);
      toast.success(t('coze.skillAdded'));
    }
    setShowForm(false);
    setEditingSkill(null);
  };

  const handleEdit = (skill: CozeSkillConfig) => {
    setEditingSkill(skill);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    deleteSkill(id);
    toast.success(t('coze.skillDeleted'));
  };

  const handleToggle = (id: string) => {
    toggleSkill(id);
  };

  return (
    <div className="space-y-6">
      <Card className="border-info/30 bg-info/5">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-info shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('coze.infoTitle')}</p>
              <p className="text-xs text-muted-foreground">
                {t('coze.infoDesc')}
              </p>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-info"
                onClick={() => window.electron.ipcRenderer.invoke('shell:openExternal', 'https://www.coze.cn')}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                coze.cn
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t('coze.mySkills')}</h3>
        <Button onClick={() => { setEditingSkill(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          {t('coze.addSkill')}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {showForm && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CozeSkillForm
              skill={editingSkill || undefined}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingSkill(null); }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {skills.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('coze.noSkills')}</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {t('coze.noSkillsDesc')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <CozeSkillCard
              key={skill.id}
              skill={skill}
              onEdit={() => handleEdit(skill)}
              onDelete={() => handleDelete(skill.id)}
              onToggle={() => handleToggle(skill.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CozeSkillsManager;
