
export const PROJECT_SCHEMA_VERSION = 1;

export type GameTemplate =
  | 'action-rpg'
  | 'fighting'
  | 'platformer'
  | 'top-down'
  | 'custom';

export type WorkspaceId =
  | 'overview'
  | 'characters'
  | 'sprites'
  | 'animation'
  | 'combat'
  | 'stages'
  | 'world'
  | 'rpg'
  | 'assets'
  | 'runtime'
  | 'export';

export type CharacterRole =
  | 'fighter'
  | 'assassin'
  | 'tank'
  | 'support'
  | 'ranger'
  | 'custom';

export interface CharacterStats {
  health: number;
  attack: number;
  defense: number;
  speed: number;
}

export interface CharacterPart {
  id: string;
  name: string;
  assetId: string | null;
  visible: boolean;
  order: number;
}

export interface CreatorCharacter {
  id: string;
  projectId: string;
  name: string;
  title: string;
  description: string;
  aspect: string;
  role: CharacterRole;
  stats: CharacterStats;
  parts: CharacterPart[];
  createdAt: number;
  updatedAt: number;
}

export interface CreatorProject {
  id: string;
  schemaVersion: number;
  name: string;
  description: string;
  template: GameTemplate;
  orientation: 'landscape' | 'portrait';
  resolution: { width: number; height: number };
  createdAt: number;
  updatedAt: number;
  activeWorkspace: WorkspaceId;
  settings: {
    pixelArt: boolean;
    targetPlatforms: Array<'android' | 'pc'>;
    defaultAspectRatio: '16:9' | '4:3' | 'custom';
  };

  // Optional to preserve compatibility with existing projects.
  characters?: CreatorCharacter[];
}

export interface ProjectAsset {
  id: string;
  projectId: string;
  name: string;
  type: string;
  mimeType: string;
  size: number;
  addedAt: number;
  blob: Blob;
}

export interface ProjectSummary {
  id: string;
  name: string;
  template: GameTemplate;
  updatedAt: number;
}
