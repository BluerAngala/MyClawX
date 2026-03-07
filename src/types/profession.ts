export interface Profession {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  color: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupTime: number;
  scenes: ProfessionScene[];
  commonSkills: string[];
}

export interface ProfessionScene {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  descriptionZh: string;
  icon: string;
  useCasesZh: string[];
  skills: SceneSkill[];
  promptTemplates: PromptTemplate[];
}

export interface SceneSkill {
  slug: string;
  required: boolean;
  description?: string;
}

export interface PromptTemplate {
  id: string;
  name: string;
  nameZh: string;
  category: string;
  content: string;
}

export interface UserProfessionConfig {
  professionId: string;
  sceneId: string;
  appliedAt: string;
}
