import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, Check, Sparkles, Clock, Zap, Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useProfessionsStore } from '@/stores/professions';
import { useChatStore } from '@/stores/chat';
import type { Profession, ProfessionScene } from '@/types/profession';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProfessionsPageProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

type Step = 'select-profession' | 'select-scene' | 'confirm';

export default function ProfessionsPage({
  onComplete,
  onSkip,
  showSkip = true,
}: ProfessionsPageProps) {
  const { t: _t } = useTranslation('professions');
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('select-profession');
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);
  const [selectedScene, setSelectedScene] = useState<ProfessionScene | null>(null);
  const [selectedSkillSlugs, setSelectedSkillSlugs] = useState<string[]>([]);

  const { professions, userConfig, loading, fetchProfessions, fetchUserConfig, applyScene } =
    useProfessionsStore();
  const { newSession } = useChatStore();

  useEffect(() => {
    void fetchProfessions();
    void fetchUserConfig();
  }, [fetchProfessions, fetchUserConfig]);

  const handleSelectProfession = (profession: Profession) => {
    // 只允许律师职业，其他职业提示开发中
    if (profession.id !== 'lawyer') {
      toast.info('该职业场景正在开发中，请有志之士一起努力！', {
        description: '目前仅开放律师职业场景，其他场景即将上线',
        icon: <Construction className="h-4 w-4" />,
        duration: 4000,
      });
      return;
    }
    setSelectedProfession(profession);
    setStep('select-scene');
  };

  const handleSelectScene = (scene: ProfessionScene) => {
    setSelectedScene(scene);
    setSelectedSkillSlugs(scene.skills.map((s) => s.slug));
    setStep('confirm');
  };

  const handleApply = async () => {
    if (!selectedProfession || !selectedScene) return;

    const result = await applyScene(selectedProfession.id, selectedScene.id, selectedSkillSlugs);
    if (result.success) {
      if (onComplete) {
        onComplete();
      } else {
        navigate('/');
      }
    }
  };

  const handleQuickUse = async (scene: ProfessionScene) => {
    if (!selectedProfession) return;

    const skillSlugs = scene.skills.map((s) => s.slug);
    const result = await applyScene(selectedProfession.id, scene.id, skillSlugs);
    if (result.success) {
      toast.success(`已启用场景：${scene.nameZh}`);
      newSession();
      navigate('/');
    }
  };

  const toggleSkill = (slug: string) => {
    const skill = selectedScene?.skills.find((s) => s.slug === slug);
    if (skill?.required) return; // Cannot toggle required skills

    setSelectedSkillSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handleBack = () => {
    if (step === 'select-scene') {
      setStep('select-profession');
      setSelectedProfession(null);
    } else if (step === 'confirm') {
      setStep('select-scene');
      setSelectedScene(null);
    }
  };

  const getTagLabel = (tag?: string) => {
    switch (tag) {
      case 'popular':
        return '热门';
      case 'new':
        return '新上线';
      default:
        return '';
    }
  };

  const getTagColor = (tag?: string) => {
    switch (tag) {
      case 'popular':
        return 'bg-orange-100 text-orange-700';
      case 'new':
        return 'bg-blue-100 text-blue-700';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">
            {step === 'select-profession' && '选择您的职业/场景'}
            {step === 'select-scene' && `${selectedProfession?.nameZh} - 选择场景`}
            {step === 'confirm' && '确认配置'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'select-profession' && '让我们为您配置最适合的 AI 工作流'}
            {step === 'select-scene' && '选择适合您的工作场景'}
            {step === 'confirm' && '确认应用以下配置'}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8 flex justify-center gap-2">
          <div
            className={`h-2 w-24 rounded-full ${step === 'select-profession' ? 'bg-primary' : 'bg-primary/30'}`}
          />
          <div
            className={`h-2 w-24 rounded-full ${step === 'select-scene' ? 'bg-primary' : step === 'confirm' ? 'bg-primary/30' : 'bg-muted'}`}
          />
          <div
            className={`h-2 w-24 rounded-full ${step === 'confirm' ? 'bg-primary' : 'bg-muted'}`}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-muted-foreground">加载中...</p>
            </div>
          </div>
        ) : professions.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">暂未检测到任何职业预设配置。</p>
              <p className="text-xs text-muted-foreground">
                请确认应用安装包中包含 <code>resources/professions/*.json</code>
                ，或稍后通过更新版本获取。
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Select Profession */}
            {step === 'select-profession' && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {professions.map((profession) => {
                  const isLawyer = profession.id === 'lawyer';
                  return (
                    <Card
                      key={profession.id}
                      className={cn(
                        'group relative flex flex-col overflow-hidden border-none bg-card/50 backdrop-blur-sm transition-all',
                        isLawyer
                          ? 'hover:bg-card hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
                          : 'opacity-60 grayscale cursor-not-allowed'
                      )}
                      onClick={() => handleSelectProfession(profession)}
                    >
                      <div
                        className={`absolute inset-0 opacity-5 bg-gradient-to-br from-${profession.color}-500 to-transparent transition-opacity ${isLawyer ? 'group-hover:opacity-10' : ''}`}
                      />
                      <CardHeader className="pb-3 relative z-10">
                        <div className="flex items-start justify-between">
                          <div
                            className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-${profession.color}-500/10 text-4xl transition-transform ${isLawyer ? 'group-hover:scale-110 group-hover:rotate-3' : ''}`}
                          >
                            {profession.icon}
                          </div>
                          {profession.tag && isLawyer && (
                            <Badge
                              className={`${getTagColor(profession.tag)} border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest`}
                            >
                              {getTagLabel(profession.tag)}
                            </Badge>
                          )}
                          {!isLawyer && (
                            <Badge className="bg-gray-100 text-gray-600 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                              <Construction className="mr-1 h-3 w-3" />
                              开发中
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="mt-4 text-xl font-bold tracking-tight">
                          {profession.nameZh}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm leading-relaxed">
                          {profession.descriptionZh}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto relative z-10">
                        <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground/70">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{profession.estimatedSetupTime} min</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Zap className="h-3.5 w-3.5 text-yellow-500" />
                            <span>{profession.scenes.length} scenes</span>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                          <Button
                            className={cn(
                              'flex-1 transition-all',
                              isLawyer
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectProfession(profession);
                            }}
                            disabled={!isLawyer}
                          >
                            {isLawyer ? (
                              <>
                                {userConfig?.professionId === profession.id
                                  ? '继续选择场景'
                                  : '开始配置'}
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                              </>
                            ) : (
                              <>
                                <Construction className="mr-2 h-4 w-4" />
                                开发中
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Step 2: Select Scene */}
            {step === 'select-scene' && selectedProfession && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mb-2 hover:bg-transparent hover:text-primary"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回职业选择
                </Button>

                <div className="grid gap-6">
                  {selectedProfession.scenes.map((scene) => (
                    <Card
                      key={scene.id}
                      className="group cursor-pointer border-none bg-card/50 backdrop-blur-sm transition-all hover:bg-card hover:shadow-xl"
                      onClick={() => handleSelectScene(scene)}
                    >
                      <CardContent className="p-6">
                        <div className="grid gap-6 lg:grid-cols-3">
                          <div className="lg:col-span-2 space-y-4">
                            <div className="flex gap-4">
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-3xl transition-transform group-hover:scale-105">
                                {scene.icon}
                              </div>
                              <div className="flex-1 space-y-2">
                                <CardTitle className="text-lg font-bold">{scene.nameZh}</CardTitle>
                                <CardDescription className="text-sm leading-relaxed">
                                  {scene.descriptionZh}
                                </CardDescription>
                                <div className="flex flex-wrap gap-2">
                                  {scene.skills.slice(0, 3).map((skill) => (
                                    <Badge
                                      key={skill.slug}
                                      variant="outline"
                                      className="text-[10px] opacity-70"
                                    >
                                      {skill.slug}
                                    </Badge>
                                  ))}
                                  {scene.skills.length > 3 && (
                                    <Badge variant="outline" className="text-[10px] opacity-70">
                                      +{scene.skills.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                                <Sparkles className="h-3 w-3 text-primary" />
                                典型使用场景
                              </p>
                              <ul className="space-y-2">
                                {scene.useCasesZh.map((useCase, index) => (
                                  <li
                                    key={index}
                                    className="flex items-start gap-3 text-sm text-muted-foreground/90"
                                  >
                                    <div className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/50" />
                                    {useCase}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-3">
                              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                                <Zap className="h-3 w-3 text-yellow-500" />
                                包含 AI 能力
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {scene.promptTemplates.map((template) => (
                                  <Badge
                                    key={template.id}
                                    variant="secondary"
                                    className="bg-primary/5 text-primary border-none"
                                  >
                                    {template.nameZh}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-4">
                              <Button
                                variant="secondary"
                                className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectScene(scene);
                                }}
                              >
                                配置此场景
                              </Button>
                              <Button
                                variant="secondary"
                                className="w-full group-hover:bg-primary group-hover:text-primary-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleQuickUse(scene);
                                }}
                              >
                                立刻使用
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Confirm */}
            {step === 'confirm' && selectedProfession && selectedScene && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  className="mb-2 hover:bg-transparent hover:text-primary"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回场景选择
                </Button>

                <Card className="overflow-hidden border-none bg-card/50 backdrop-blur-sm shadow-2xl">
                  <div
                    className={`h-2 w-full bg-gradient-to-r from-${selectedProfession.color}-500 to-primary`}
                  />
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold">配置预览</CardTitle>
                    <CardDescription>应用后将为您自动配置以下 AI 技能与工作流</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Profession Summary */}
                    <div className="flex items-center gap-6 rounded-2xl bg-muted/30 p-6">
                      <div
                        className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-${selectedProfession.color}-500/10 text-5xl shadow-inner`}
                      >
                        {selectedProfession.icon}
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold">{selectedProfession.nameZh}</h3>
                        <p className="text-sm text-muted-foreground/80 leading-relaxed">
                          {selectedProfession.descriptionZh}
                        </p>
                      </div>
                    </div>

                    {/* Scene Detail Card */}
                    <div className="rounded-2xl border border-primary/10 bg-gradient-to-b from-card to-muted/10 p-8 shadow-sm">
                      <div className="flex items-center gap-5 mb-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-3xl">
                          {selectedScene.icon}
                        </div>
                        <div>
                          <h4 className="text-xl font-bold">{selectedScene.nameZh}</h4>
                          <p className="text-sm text-muted-foreground">
                            {selectedScene.descriptionZh}
                          </p>
                        </div>
                      </div>

                      {/* Skills Customization */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                            <Zap className="h-3 w-3 text-yellow-500" />
                            自动化技能配置
                          </p>
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary border-none text-[10px] font-bold"
                          >
                            {selectedSkillSlugs.length} 技能已激活
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedScene.skills.map((skill) => {
                            const isSelected = selectedSkillSlugs.includes(skill.slug);
                            return (
                              <Badge
                                key={skill.slug}
                                variant={
                                  isSelected
                                    ? skill.required
                                      ? 'default'
                                      : 'secondary'
                                    : 'outline'
                                }
                                className={`cursor-pointer px-4 py-2 text-xs transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                  skill.required
                                    ? 'cursor-not-allowed shadow-md'
                                    : isSelected
                                      ? 'bg-primary/20 text-primary border-primary/20 hover:bg-primary/30'
                                      : 'opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'
                                }`}
                                onClick={() => toggleSkill(skill.slug)}
                              >
                                {skill.required && <Check className="mr-1.5 h-3.5 w-3.5" />}
                                {skill.description || skill.slug}
                                {skill.required && (
                                  <span className="ml-1.5 text-[10px] opacity-60 font-bold">
                                    (必需)
                                  </span>
                                )}
                              </Badge>
                            );
                          })}
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground/60 italic">
                          <Sparkles className="h-3 w-3" />
                          <span>点击可选技能标签可自由启用或禁用</span>
                        </div>
                      </div>

                      {/* Prompt Templates */}
                      <div className="space-y-4">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          预设提示词模板
                        </p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {selectedScene.promptTemplates.map((template) => (
                            <div
                              key={template.id}
                              className="group flex items-center justify-between rounded-xl border border-transparent bg-muted/40 p-4 transition-all hover:border-primary/20 hover:bg-muted/60"
                            >
                              <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                                  <Sparkles className="h-4 w-4 text-primary" />
                                </div>
                                <span className="text-sm font-semibold">{template.nameZh}</span>
                              </div>
                              <Badge
                                variant="outline"
                                className="text-[9px] font-bold uppercase tracking-tighter opacity-50 group-hover:opacity-100 transition-opacity"
                              >
                                {template.category}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="flex-1 h-12 text-muted-foreground hover:bg-muted/50"
                      >
                        返回修改
                      </Button>
                      <Button
                        onClick={handleApply}
                        className="flex-[2] h-12 text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="mr-3 h-5 w-5 animate-spin rounded-full border-3 border-current border-t-transparent" />
                            正在为您配置...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-5 w-5" />
                            立即应用并开启
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Skip Option */}
        {showSkip && step === 'select-profession' && (
          <div className="mt-8 text-center">
            <Button variant="ghost" onClick={onSkip}>
              跳过，稍后配置
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
