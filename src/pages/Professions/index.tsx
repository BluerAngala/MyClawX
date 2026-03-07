import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, ArrowLeft, Check, Sparkles, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProfessionsStore } from '@/stores/professions';
import type { Profession, ProfessionScene } from '@/types/profession';

interface ProfessionsPageProps {
  onComplete?: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

type Step = 'select-profession' | 'select-scene' | 'confirm';

export default function ProfessionsPage({ onComplete, onSkip, showSkip = true }: ProfessionsPageProps) {
  const { t: _t } = useTranslation('professions');
  const [step, setStep] = useState<Step>('select-profession');
  const [selectedProfession, setSelectedProfession] = useState<Profession | null>(null);
  const [selectedScene, setSelectedScene] = useState<ProfessionScene | null>(null);

  const {
    professions,
    loading,
    fetchProfessions,
    applyScene,
  } = useProfessionsStore();

  useEffect(() => {
    void fetchProfessions();
  }, [fetchProfessions]);

  const handleSelectProfession = (profession: Profession) => {
    setSelectedProfession(profession);
    setStep('select-scene');
  };

  const handleSelectScene = (scene: ProfessionScene) => {
    setSelectedScene(scene);
    setStep('confirm');
  };

  const handleApply = async () => {
    if (!selectedProfession || !selectedScene) return;

    const result = await applyScene(selectedProfession.id, selectedScene.id);
    if (result.success) {
      onComplete?.();
    }
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

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return '入门';
      case 'intermediate':
        return '中级';
      case 'advanced':
        return '高级';
      default:
        return difficulty;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold">
            {step === 'select-profession' && '选择您的职业场景'}
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
          <div className={`h-2 w-24 rounded-full ${step === 'select-profession' ? 'bg-primary' : 'bg-primary/30'}`} />
          <div className={`h-2 w-24 rounded-full ${step === 'select-scene' ? 'bg-primary' : step === 'confirm' ? 'bg-primary/30' : 'bg-muted'}`} />
          <div className={`h-2 w-24 rounded-full ${step === 'confirm' ? 'bg-primary' : 'bg-muted'}`} />
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
              <p className="text-sm text-muted-foreground">
                暂未检测到任何职业预设配置。
              </p>
              <p className="text-xs text-muted-foreground">
                请确认应用安装包中包含 <code>resources/professions/*.json</code>，或稍后通过更新版本获取。
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Step 1: Select Profession */}
            {step === 'select-profession' && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {professions.map((profession) => (
                  <Card
                    key={profession.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                    onClick={() => handleSelectProfession(profession)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <span className="text-4xl">{profession.icon}</span>
                        <Badge className={getDifficultyColor(profession.difficulty)}>
                          {getDifficultyLabel(profession.difficulty)}
                        </Badge>
                      </div>
                      <CardTitle className="mt-2">{profession.nameZh}</CardTitle>
                      <CardDescription>{profession.descriptionZh}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{profession.estimatedSetupTime}分钟设置</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Zap className="h-4 w-4" />
                          <span>{profession.scenes.length}个场景</span>
                        </div>
                      </div>
                      <Button className="mt-4 w-full" variant="secondary">
                        选择
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 2: Select Scene */}
            {step === 'select-scene' && selectedProfession && (
              <div className="space-y-4">
                <Button variant="ghost" onClick={handleBack} className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回职业选择
                </Button>

                <div className="grid gap-4">
                  {selectedProfession.scenes.map((scene) => (
                    <Card
                      key={scene.id}
                      className="cursor-pointer transition-all hover:shadow-lg hover:border-primary/50"
                      onClick={() => handleSelectScene(scene)}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <span className="text-3xl">{scene.icon}</span>
                          <div className="flex-1">
                            <CardTitle>{scene.nameZh}</CardTitle>
                            <CardDescription className="mt-1">
                              {scene.descriptionZh}
                            </CardDescription>
                          </div>
                          <Button variant="secondary">
                            选择此场景
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="mb-2 text-sm font-medium">使用场景：</p>
                            <ul className="space-y-1">
                              {scene.useCasesZh.map((useCase, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                  <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
                                  {useCase}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {scene.skills.map((skill) => (
                              <Badge key={skill.slug} variant={skill.required ? 'default' : 'outline'}>
                                {skill.required ? '必需' : '可选'}: {skill.slug}
                              </Badge>
                            ))}
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
              <div className="space-y-4">
                <Button variant="ghost" onClick={handleBack} className="mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  返回场景选择
                </Button>

                <Card>
                  <CardHeader>
                    <CardTitle>配置预览</CardTitle>
                    <CardDescription>应用后将配置以下 AI 工作流</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Profession Info */}
                    <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
                      <span className="text-4xl">{selectedProfession.icon}</span>
                      <div>
                        <h3 className="font-semibold">{selectedProfession.nameZh}</h3>
                        <p className="text-sm text-muted-foreground">{selectedProfession.descriptionZh}</p>
                      </div>
                    </div>

                    {/* Scene Info */}
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{selectedScene.icon}</span>
                        <h4 className="font-semibold">{selectedScene.nameZh}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{selectedScene.descriptionZh}</p>

                      {/* Skills */}
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-medium">包含技能：</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedScene.skills.map((skill) => (
                            <Badge key={skill.slug} variant={skill.required ? 'default' : 'outline'}>
                              {skill.description || skill.slug}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Prompt Templates */}
                      <div>
                        <p className="mb-2 text-sm font-medium">提示词模板：</p>
                        <div className="space-y-2">
                          {selectedScene.promptTemplates.map((template) => (
                            <div key={template.id} className="rounded bg-muted p-2 text-sm">
                              <span className="font-medium">{template.nameZh}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {template.category}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleBack} className="flex-1">
                        返回修改
                      </Button>
                      <Button onClick={handleApply} className="flex-1" disabled={loading}>
                        {loading ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            应用中...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            一键应用
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
