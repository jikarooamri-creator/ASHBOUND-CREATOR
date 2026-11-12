import JSZip from 'jszip';
import type { CreatorProject, ProjectAsset } from './types';
import { validateProject } from './project';

export async function exportProject(project: CreatorProject, assets: ProjectAsset[]): Promise<Blob> {
  const zip = new JSZip();
  zip.file('project.json', JSON.stringify(project, null, 2));
  const folder = zip.folder('assets')!;
  for (const asset of assets) folder.file(`${asset.id}_${asset.name}`, asset.blob);
  zip.file('README.txt', [
    'ASHBOUND CREATOR project package',
    `Project: ${project.name}`,
    `Schema: ${project.schemaVersion}`,
    '',
    'This package contains project metadata and imported assets.',
    'Some editor data may be added by later Creator versions.'
  ].join('\\n'));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

export async function importProject(file: File): Promise<{ project: CreatorProject; assets: ProjectAsset[] }> {
  const zip = await JSZip.loadAsync(file);
  const manifest = zip.file('project.json');
  if (!manifest) throw new Error('This archive does not contain project.json.');
  const project = validateProject(JSON.parse(await manifest.async('text')));
  const assets: ProjectAsset[] = [];
  const entries = Object.values(zip.files).filter((entry) => !entry.dir && entry.name.startsWith('assets/'));
  for (const entry of entries) {
    const blob = await entry.async('blob');
    const rawName = entry.name.split('/').pop() ?? 'asset';
    const split = rawName.indexOf('_');
    const id = split > 0 ? rawName.slice(0, split) : `asset_${crypto.randomUUID()}`;
    const name = split > 0 ? rawName.slice(split + 1) : rawName;
    assets.push({
      id, projectId: project.id, name, type: name.split('.').pop()?.toLowerCase() ?? 'file',
      mimeType: blob.type || 'application/octet-stream', size: blob.size, addedAt: Date.now(), blob
    });
  }
  return { project, assets };
}