/**
 * Professions State Store
 * Manages profession preset state
 */
import { create } from 'zustand';
import type { Profession, ProfessionScene, UserProfessionConfig } from '../types/profession';

interface ProfessionsState {
  professions: Profession[];
  currentProfession: Profession | null;
  currentScene: ProfessionScene | null;
  userConfig: UserProfessionConfig | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchProfessions: () => Promise<void>;
  selectProfession: (id: string) => Promise<void>;
  selectScene: (professionId: string, sceneId: string) => Promise<void>;
  applyScene: (professionId: string, sceneId: string, skillSlugs?: string[]) => Promise<{ success: boolean; error?: string }>;
  fetchUserConfig: () => Promise<void>;
}

export const useProfessionsStore = create<ProfessionsState>()((set, get) => ({
  professions: [],
  currentProfession: null,
  currentScene: null,
  userConfig: null,
  loading: false,
  error: null,

  fetchProfessions: async () => {
    set({ loading: true, error: null });
    try {
      const result = await window.electron.ipcRenderer.invoke('profession:getAll') as { success: boolean; professions: Profession[]; error?: string };
      if (result.success) {
        set({ professions: result.professions, loading: false });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to fetch professions', loading: false });
    }
  },

  selectProfession: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const result = await window.electron.ipcRenderer.invoke('profession:get', id) as { success: boolean; profession: Profession | null; error?: string };
      if (result.success && result.profession) {
        set({ currentProfession: result.profession, loading: false });
      } else {
        set({ error: result.error, loading: false });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Failed to load profession', loading: false });
    }
  },

  selectScene: async (professionId: string, sceneId: string) => {
    const { currentProfession } = get();
    
    if (!currentProfession || currentProfession.id !== professionId) {
      await get().selectProfession(professionId);
    }
    
    const profession = get().currentProfession;
    if (profession) {
      const scene = profession.scenes.find(s => s.id === sceneId);
      if (scene) {
        set({ currentScene: scene });
      }
    }
  },

  applyScene: async (professionId: string, sceneId: string, skillSlugs?: string[]): Promise<{ success: boolean; error?: string }> => {
    set({ loading: true, error: null });
    try {
      const result = await window.electron.ipcRenderer.invoke('profession:applyScene', professionId, sceneId, skillSlugs) as { success: boolean; error?: string };
      if (result.success) {
        await get().fetchUserConfig();
      }
      set({ loading: false });
      return result;
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to apply scene';
      set({ error, loading: false });
      return { success: false, error };
    }
  },

  fetchUserConfig: async () => {
    try {
      const result = await window.electron.ipcRenderer.invoke('profession:getUserConfig') as { success: boolean; config: UserProfessionConfig | null };
      if (result.success) {
        set({ userConfig: result.config });
      }
    } catch (err) {
      console.error('Failed to fetch user config:', err);
    }
  },
}));
