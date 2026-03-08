/**
 * Coze Skills Store
 * Manages Coze bot and workflow integration as skills
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CozeSkillConfig, CozeSkillParameter } from '@/types/coze';

interface CozeSkillsState {
  skills: CozeSkillConfig[];
  loading: boolean;
  error: string | null;

  // Actions
  addSkill: (skill: Omit<CozeSkillConfig, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateSkill: (id: string, updates: Partial<CozeSkillConfig>) => void;
  deleteSkill: (id: string) => void;
  toggleSkill: (id: string) => void;
  getSkill: (id: string) => CozeSkillConfig | undefined;
  setSkills: (skills: CozeSkillConfig[]) => void;
  addParameter: (skillId: string, param: CozeSkillParameter) => void;
  updateParameter: (skillId: string, paramKey: string, updates: Partial<CozeSkillParameter>) => void;
  removeParameter: (skillId: string, paramKey: string) => void;
}

const generateId = () => `coze_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useCozeSkillsStore = create<CozeSkillsState>()(
  persist(
    (set, get) => ({
      skills: [],
      loading: false,
      error: null,

      addSkill: (skillData) => {
        const id = generateId();
        const now = Date.now();
        const skill: CozeSkillConfig = {
          ...skillData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ skills: [...state.skills, skill] }));
        return id;
      },

      updateSkill: (id, updates) => {
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === id
              ? { ...skill, ...updates, updatedAt: Date.now() }
              : skill
          ),
        }));
      },

      deleteSkill: (id) => {
        set((state) => ({
          skills: state.skills.filter((skill) => skill.id !== id),
        }));
      },

      toggleSkill: (id) => {
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === id
              ? { ...skill, enabled: !skill.enabled, updatedAt: Date.now() }
              : skill
          ),
        }));
      },

      getSkill: (id) => {
        return get().skills.find((skill) => skill.id === id);
      },

      setSkills: (skills) => {
        set({ skills });
      },

      addParameter: (skillId, param) => {
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === skillId
              ? {
                  ...skill,
                  parameters: [...(skill.parameters || []), param],
                  updatedAt: Date.now(),
                }
              : skill
          ),
        }));
      },

      updateParameter: (skillId, paramKey, updates) => {
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === skillId
              ? {
                  ...skill,
                  parameters: skill.parameters?.map((p) =>
                    p.key === paramKey ? { ...p, ...updates } : p
                  ),
                  updatedAt: Date.now(),
                }
              : skill
          ),
        }));
      },

      removeParameter: (skillId, paramKey) => {
        set((state) => ({
          skills: state.skills.map((skill) =>
            skill.id === skillId
              ? {
                  ...skill,
                  parameters: skill.parameters?.filter((p) => p.key !== paramKey),
                  updatedAt: Date.now(),
                }
              : skill
          ),
        }));
      },
    }),
    {
      name: 'coze-skills-storage',
    }
  )
);
