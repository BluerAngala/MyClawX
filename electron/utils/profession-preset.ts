/**
 * Profession Preset Service
 * Load and manage profession presets
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Profession, UserProfessionConfig } from '../../src/types/profession';
import { getSetting, setSetting } from './store';

const PROFESSIONS_DIR = join(process.resourcesPath, 'professions');

/**
 * Load a profession definition from JSON file
 */
export async function loadProfession(id: string): Promise<Profession | null> {
  try {
    const filePath = join(PROFESSIONS_DIR, `${id}.json`);
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content) as Profession;
  } catch {
    return null;
  }
}

/**
 * Load all available professions
 */
export async function loadAllProfessions(): Promise<Profession[]> {
  const professions: Profession[] = [];
  
  try {
    const contentCreator = await loadProfession('content-creator');
    if (contentCreator) {
      professions.push(contentCreator);
    }
  } catch {
    // Ignore errors
  }
  
  return professions;
}

/**
 * Get user's current profession config
 */
export async function getUserProfessionConfig(): Promise<UserProfessionConfig | null> {
  return await getSetting('professionConfig') as UserProfessionConfig | null;
}

/**
 * Save user's profession config
 */
export async function saveUserProfessionConfig(config: UserProfessionConfig): Promise<void> {
  await setSetting('professionConfig', config);
  await setSetting('activeProfession', config.professionId);
}

/**
 * Apply a profession scene
 * This sets up the profession config but doesn't auto-install skills
 */
export async function applyProfessionScene(
  professionId: string,
  sceneId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const profession = await loadProfession(professionId);
    if (!profession) {
      return { success: false, error: 'Profession not found' };
    }

    const scene = profession.scenes.find(s => s.id === sceneId);
    if (!scene) {
      return { success: false, error: 'Scene not found' };
    }

    const config: UserProfessionConfig = {
      professionId,
      sceneId,
      appliedAt: new Date().toISOString(),
    };

    await saveUserProfessionConfig(config);

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Clear profession config
 */
export async function clearProfessionConfig(): Promise<void> {
  await setSetting('professionConfig', null);
  await setSetting('activeProfession', null);
}
