import type { CreatorProject, GameTemplate } from './types';
import { PROJECT_SCHEMA_VERSION } from './types';

export function createProject(input: {
  name: string;
  description: string;
  template: GameTemplate;
  width: number;
  height: number;
}): CreatorProject {
  const now = Date.now();
  return {
    id: `ash_${crypto.randomUUID()}`,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    name: input.name.trim(),
    description: input.description.trim(),
    template: input.template,
    orientation: input.width >= input.height ? 'landscape' : 'portrait',
    resolution: { width: input.width, height: input.height },
    createdAt: now,
    updatedAt: now,
    activeWorkspace: 'overview',
    settings: {
      pixelArt: true,
      targetPlatforms: ['android', 'pc'],
      defaultAspectRatio: input.width / input.height > 1.7 ? '16:9' : 'custom',
    },
  };
}

export function validateProject(value: unknown): CreatorProject {
  if (!value || typeof value !== 'object') throw new Error('Invalid project file.');
  const p = value as Partial<CreatorProject>;
  if (typeof p.id !== 'string' || typeof p.name !== 'string') throw new Error('Project identity is missing.');
  if (!p.resolution || typeof p.resolution.width !== 'number' || typeof p.resolution.height !== 'number') {
    throw new Error('Project resolution is invalid.');
  }
  if (!p.template || !p.settings) throw new Error('Project metadata is incomplete.');
  return {
    ...p,
    schemaVersion: PROJECT_SCHEMA_VERSION,
    description: p.description ?? '',
    orientation: p.orientation ?? (p.resolution.width >= p.resolution.height ? 'landscape' : 'portrait'),
    createdAt: p.createdAt ?? Date.now(),
    updatedAt: Date.now(),
    activeWorkspace: p.activeWorkspace ?? 'overview',
  } as CreatorProject;
}