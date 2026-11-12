import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Archive, ArrowLeft, ArrowUpRight, Check, ChevronRight, Clapperboard, Compass, Cpu,
  Download, FileImage, Folder, Gamepad2, HardDrive, Image, Layers3, Menu, Monitor,
  Plus, Search, Settings2, Shield, Sparkles, Swords, Upload, X
} from 'lucide-react';
import type { CreatorProject, GameTemplate, ProjectAsset, WorkspaceId } from './core/types';
import { createProject } from './core/project';
import { addAsset, deleteAsset, listAssets, listProjects, removeProject, saveProject } from './core/storage';
import { exportProject, importProject } from './core/projectFile';

const modules: { id: WorkspaceId; title: string; group: string; icon: typeof Box; status: 'ready' | 'planned'; description: string }[] = [
  { id: 'overview', title: 'Project Overview', group: 'PROJECT', icon: Compass, status: 'ready', description: 'Project identity, settings and production status.' },
  { id: 'characters', title: 'Character Studio', group: 'CREATE', icon: Shield, status: 'planned', description: 'Build characters, parts, rigs, attributes and combat roles.' },
  { id: 'sprites', title: 'Sprite Workshop', group: 'CREATE', icon: Image, status: 'planned', description: 'Draw, import, organize and edit pixel-art assets.' },
  { id: 'animation', title: 'Animation Timeline', group: 'CREATE', icon: Clapperboard, status: 'planned', description: 'Create frame animations, keyframes and animation events.' },
  { id: 'combat', title: 'Combat Designer', group: 'GAME SYSTEMS', icon: Swords, status: 'planned', description: 'Configure attacks, hitboxes, hurtboxes, abilities and rules.' },
  { id: 'stages', title: 'Stage & Tilemap', group: 'GAME SYSTEMS', icon: Layers3, status: 'planned', description: 'Build stages, terrain, layers, collision and camera zones.' },
  { id: 'world', title: 'World Builder', group: 'GAME SYSTEMS', icon: Compass, status: 'planned', description: 'Connect regions, rooms, encounters and exploration paths.' },
  { id: 'rpg', title: 'RPG Systems', group: 'GAME SYSTEMS', icon: Sparkles, status: 'planned', description: 'Create inventory, quests, dialogue, progression and NPC logic.' },
  { id: 'assets', title: 'Asset Library', group: 'PIPELINE', icon: Archive, status: 'ready', description: 'Import and manage files belonging to this project.' },
  { id: 'runtime', title: 'Live Runtime', group: 'PIPELINE', icon: Gamepad2, status: 'planned', description: 'Run and inspect the game using its selected runtime kernel.' },
  { id: 'export', title: 'Build & Export', group: 'PIPELINE', icon: Download, status: 'planned', description: 'Package the project for Android and desktop targets.' },
];

const templateLabels: Record<GameTemplate, string> = {
  'action-rpg': 'Action RPG', fighting: 'Fighting Game', platformer: 'Platformer',
  'top-down': 'Top-down Adventure', custom: 'Custom Project'
};

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(timestamp);
}

export default function App() {
  const [projects, setProjects] = useState<CreatorProject[]>([]);
  const [active, setActive] = useState<CreatorProject | null>(null);
  const [assets, setAssets] = useState<ProjectAsset[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceId>('overview');
  const [showCreate, setShowCreate] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const importRef = useRef<HTMLInputElement>(null);
  const assetRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listProjects().then(setProjects).catch((e) => setNotice(e.message)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 3500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredProjects = useMemo(
    () => projects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())),
    [projects, query]
  );

  async function openProject(project: CreatorProject) {
    setActive(project);
    setWorkspace(project.activeWorkspace ?? 'overview');
    setAssets(await listAssets(project.id));
  }

  async function createNew(name: string, description: string, template: GameTemplate, width: number, height: number) {
    const project = createProject({ name, description, template, width, height });
    await saveProject(project);
    setProjects((old) => [project, ...old]);
    setShowCreate(false);
    await openProject(project);
    setNotice('Project created and saved on this device.');
  }

  async function persist(next: CreatorProject) {
    await saveProject(next);
    setActive(next);
    setProjects((old) => old.map((p) => p.id === next.id ? next : p));
  }

  async function addFiles(files: FileList | null) {
    if (!active || !files?.length) return;
    const incoming: ProjectAsset[] = Array.from(files).map((file) => ({
      id: `asset_${crypto.randomUUID()}`, projectId: active.id, name: file.name,
      type: file.name.split('.').pop()?.toLowerCase() ?? 'file', mimeType: file.type,
      size: file.size, addedAt: Date.now(), blob: file
    }));
    for (const asset of incoming) await addAsset(asset);
    setAssets((old) => [...old, ...incoming]);
    setNotice(`${incoming.length} asset${incoming.length === 1 ? '' : 's'} imported.`);
  }

  async function exportActive() {
    if (!active) return;
    const blob = await exportProject(active, assets);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${active.name.replace(/[^a-z0-9-_]+/gi, '-')}.ashproj`; a.click();
    URL.revokeObjectURL(url);
    setNotice('Project package exported.');
  }

  async function importArchive(file?: File) {
    if (!file) return;
    try {
      const result = await importProject(file);
      await saveProject(result.project);
      for (const asset of result.assets) await addAsset(asset);
      const all = await listProjects();
      setProjects(all);
      await openProject(result.project);
      setNotice('Project imported successfully.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not import this project.');
    } finally {
      if (importRef.current) importRef.current.value = '';
    }
  }

  async function deleteCurrent() {
    if (!active || !window.confirm(`Delete "${active.name}" and its imported assets from this device?`)) return;
    await removeProject(active.id);
    setProjects((old) => old.filter((p) => p.id !== active.id));
    setActive(null); setAssets([]); setWorkspace('overview');
    setNotice('Project deleted from this device.');
  }

  async function removeOneAsset(id: string) {
    await deleteAsset(id);
    setAssets((old) => old.filter((a) => a.id !== id));
  }

  const currentModule = modules.find((m) => m.id === workspace) ?? modules[0];

  if (loading) return <div className="boot"><div className="brand-mark">A</div><span>INITIALIZING CREATOR CORE</span></div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => { setActive(null); setWorkspace('overview'); }} aria-label="Go to project library">
          <span className="brand-mark">A</span><span className="brand-name">ASHBOUND <b>CREATOR</b><small>GAME DEVELOPMENT ENVIRONMENT</small></span>
        </button>
        <div className="topbar-center"><span className="status-dot" /> CREATOR CORE <span className="version">v0.1.0</span></div>
        <div className="topbar-actions">
          {active && <><span className="save-state"><Check size={13}/> LOCAL SAVE</span><button className="icon-btn" title="Export project" onClick={exportActive}><Download size={17}/></button></>}
          <button className="icon-btn" title="Import project package" onClick={() => importRef.current?.click()}><Upload size={17}/></button>
          <input ref={importRef} type="file" accept=".ashproj,.zip" hidden onChange={(e) => importArchive(e.target.files?.[0])}/>
          <button className="avatar">AC</button>
        </div>
      </header>

      {!active ? (
        <main className="library-screen">
          <div className="library-heading">
            <div><div className="eyebrow">YOUR DEVELOPMENT SPACE</div><h1>Build something <em>unbound.</em></h1><p>One environment. Multiple game worlds. Your tools, your rules.</p></div>
            <button className="primary-btn" onClick={() => setShowCreate(true)}><Plus size={17}/> NEW PROJECT</button>
          </div>
          <div className="library-toolbar">
            <div className="section-label">PROJECT LIBRARY <span>{projects.length.toString().padStart(2, '0')}</span></div>
            <label className="search-box"><Search size={15}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a project..."/></label>
          </div>
          {projects.length === 0 ? (
            <div className="empty-state"><div className="empty-icon"><Folder size={26}/></div><h2>Your workspace is empty</h2><p>Create your first game project to initialize its workspace.</p><button className="primary-btn" onClick={() => setShowCreate(true)}><Plus size={16}/> CREATE FIRST PROJECT</button></div>
          ) : (
            <div className="project-grid">
              {filteredProjects.map((project, index) => (
                <article className="project-card" key={project.id}>
                  <div className={`project-art art-${index % 4}`}><div className="art-grid"/><span className="art-code">PROJECT / {String(index + 1).padStart(2, '0')}</span><span className="art-symbol">{project.template === 'fighting' ? '⚔' : project.template === 'action-rpg' ? '◈' : '✧'}</span><span className="art-type">{templateLabels[project.template].toUpperCase()}</span></div>
                  <div className="project-card-body"><div className="project-title-row"><h3>{project.name}</h3><button className="icon-btn small" onClick={() => openProject(project)}><ArrowUpRight size={16}/></button></div><p>{project.description || 'No project description yet.'}</p><div className="project-meta"><span>{project.resolution.width} × {project.resolution.height}</span><span>UPDATED {formatDate(project.updatedAt)}</span></div><button className="open-project" onClick={() => openProject(project)}>OPEN WORKSPACE <ChevronRight size={15}/></button></div>
                </article>
              ))}
            </div>
          )}
          <div className="library-footer"><span><span className="status-dot"/> ALL PROJECTS STORED LOCALLY</span><span>ASHBOUND CREATOR / CORE SYSTEM</span></div>
        </main>
      ) : (
        <div className="workspace-layout">
          <aside className={`sidebar ${showMobileNav ? 'sidebar-open' : ''}`}>
            <div className="sidebar-project"><button className="back-link" onClick={() => setActive(null)}><ArrowLeft size={14}/> PROJECT LIBRARY</button><div className="sidebar-project-name">{active.name}</div><span className="project-kind">{templateLabels[active.template].toUpperCase()}</span></div>
            {['PROJECT', 'CREATE', 'GAME SYSTEMS', 'PIPELINE'].map((group) => (
              <div className="nav-group" key={group}><div className="nav-caption">{group}</div>
                {modules.filter((m) => m.group === group).map((item) => {
                  const Icon = item.icon;
                  return <button key={item.id} className={`nav-item ${workspace === item.id ? 'active' : ''}`} onClick={() => { setWorkspace(item.id); setShowMobileNav(false); }}>
                    <Icon size={16}/><span>{item.title}</span>{item.status === 'planned' && <span className="nav-soon"/>}
                  </button>;
                })}
              </div>
            ))}
            <div className="sidebar-bottom"><div className="engine-card"><Cpu size={16}/><div><b>RUNTIME BRIDGE</b><span>Not connected yet</span></div><span className="offline-dot"/></div><button className="settings-link" onClick={() => setNotice('Project settings will be added in the next core milestone.')}><Settings2 size={15}/> Project settings</button></div>
          </aside>
          <main className="work-area">
            <div className="work-topline"><button className="mobile-menu icon-btn" onClick={() => setShowMobileNav(!showMobileNav)}><Menu size={18}/></button><div className="breadcrumbs">PROJECTS <ChevronRight size={12}/> {active.name.toUpperCase()} <ChevronRight size={12}/> <b>{currentModule.title.toUpperCase()}</b></div><div className="work-top-actions"><span className="save-state"><Check size={13}/> SAVED</span><button className="icon-btn" onClick={exportActive} title="Export project"><Download size={16}/></button></div></div>
            {workspace === 'overview' ? (
              <div className="overview-page">
                <div className="page-heading"><div><div className="eyebrow">PROJECT CONTROL CENTER</div><h1>{active.name}</h1><p>{active.description || 'Your game project starts here. Configure its foundations and open a creation module.'}</p></div><div className="heading-actions"><button className="secondary-btn" onClick={exportActive}><Download size={15}/> EXPORT PACKAGE</button></div></div>
                <div className="overview-stats"><div><span>PROJECT TYPE</span><b>{templateLabels[active.template]}</b></div><div><span>BASE RESOLUTION</span><b>{active.resolution.width} × {active.resolution.height}</b></div><div><span>ORIENTATION</span><b>{active.orientation.toUpperCase()}</b></div><div><span>IMPORTED ASSETS</span><b>{assets.length.toString().padStart(2, '0')}</b></div></div>
                <div className="content-columns"><section className="module-section"><div className="section-heading"><div><div className="eyebrow">PRODUCTION TOOLKIT</div><h2>Creation modules</h2></div><span className="muted-count">02 ACTIVE / 09 PLANNED</span></div><div className="module-grid">
                  {modules.filter((m) => m.id !== 'overview').map((item) => { const Icon = item.icon; return <button className={`module-card ${item.status === 'planned' ? 'module-locked' : ''}`} key={item.id} onClick={() => setWorkspace(item.id)}><div className="module-icon"><Icon size={19}/></div><div className="module-copy"><b>{item.title}</b><span>{item.description}</span></div><div className="module-arrow">{item.status === 'ready' ? <ArrowUpRight size={16}/> : <span>PLANNED</span>}</div></button>; })}
                </div></section><aside className="right-rail"><div className="rail-card"><div className="eyebrow">PROJECT STRUCTURE</div><h3>Foundation status</h3><div className="progress-line"><span style={{width:'18%'}}/></div><div className="progress-caption"><b>CORE INITIALIZED</b><span>18%</span></div><p>Project data, local persistence and asset registry are active. Editor modules are introduced incrementally.</p></div><div className="rail-card"><div className="eyebrow">NEXT MILESTONE</div><h3>Character Studio</h3><p>First full editor: character definition, visual layers, sprite import, and animation data.</p><button className="text-action" onClick={() => setWorkspace('characters')}>VIEW MODULE <ArrowUpRight size={14}/></button></div><button className="danger-link" onClick={deleteCurrent}>DELETE THIS PROJECT</button></aside></div>
              </div>
            ) : workspace === 'assets' ? (
              <div className="module-page"><div className="page-heading"><div><div className="eyebrow">PROJECT RESOURCES</div><h1>Asset Library</h1><p>Import and keep the source files used by this project in one place.</p></div><button className="primary-btn" onClick={() => assetRef.current?.click()}><Plus size={16}/> IMPORT ASSETS</button><input ref={assetRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)}/></div><div className="asset-toolbar"><span>{assets.length} FILES IN THIS PROJECT</span><span>LOCAL STORAGE</span></div>{assets.length ? <div className="asset-list">{assets.map((asset) => <div className="asset-row" key={asset.id}><div className="asset-file-icon"><FileImage size={18}/></div><div className="asset-info"><b>{asset.name}</b><span>{asset.mimeType || asset.type} · {(asset.size / 1024).toFixed(1)} KB</span></div><button className="icon-btn" onClick={() => removeOneAsset(asset.id)} title="Remove asset"><X size={16}/></button></div>)}</div> : <div className="empty-state compact"><div className="empty-icon"><HardDrive size={24}/></div><h2>No imported assets</h2><p>Add sprites, images, audio or reference files to this project's local asset library.</p><button className="secondary-btn" onClick={() => assetRef.current?.click()}><Upload size={15}/> CHOOSE FILES</button></div>}</div>
            ) : (
              <div className="module-page planned-page"><div className="eyebrow">{currentModule.group} / MODULE</div><div className="planned-icon"><currentModule.icon size={30}/></div><h1>{currentModule.title}</h1><p>{currentModule.description}</p><div className="planned-status"><span className="status-dot"/> MODULE SLOT INITIALIZED <span className="divider-dot"/> IMPLEMENTATION PENDING</div><div className="planned-note"><b>Why this module exists</b><span>This workspace is registered in the Creator project architecture. Its editor will be implemented as a real tool, not a decorative mockup. The next development milestone begins with Character Studio and the shared asset pipeline.</span></div><button className="secondary-btn" onClick={() => setWorkspace('overview')}><ArrowLeft size={15}/> BACK TO PROJECT OVERVIEW</button></div>
            )}
          </main>
        </div>
      )}

      {showCreate && <CreateProjectModal onClose={() => setShowCreate(false)} onCreate={createNew}/>}
      {notice && <div className="toast"><Check size={15}/>{notice}<button onClick={() => setNotice('')}><X size={14}/></button></div>}
      <div className="portrait-hint"><Monitor size={17}/> FOR THE FULL WORKSPACE, ROTATE YOUR DEVICE TO LANDSCAPE</div>
    </div>
  );
}

function CreateProjectModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (name: string, description: string, template: GameTemplate, width: number, height: number) => Promise<void>;
}) {
  const [name, setName] = useState('Untitled Game');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<GameTemplate>('action-rpg');
  const [resolution, setResolution] = useState('640x360');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const [w, h] = resolution.split('x').map(Number);
    setBusy(true);
    try { await onCreate(name, description, template, w, h); } finally { setBusy(false); }
  }
  return <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><form className="create-modal" onSubmit={submit}><div className="modal-head"><div><div className="eyebrow">NEW WORKSPACE</div><h2>Create game project</h2></div><button type="button" className="icon-btn" onClick={onClose}><X size={18}/></button></div><label>PROJECT NAME<input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={48}/></label><label>DESCRIPTION <span className="optional">OPTIONAL</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What are you building?"/></label><label>STARTING TEMPLATE<select value={template} onChange={(e) => setTemplate(e.target.value as GameTemplate)}>{Object.entries(templateLabels).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label><label>BASE RESOLUTION<select value={resolution} onChange={(e) => setResolution(e.target.value)}><option value="640x360">640 × 360 · 16:9 Landscape</option><option value="854x480">854 × 480 · 16:9 Landscape</option><option value="800x600">800 × 600 · 4:3</option><option value="360x640">360 × 640 · Portrait</option></select></label><div className="modal-foot"><button type="button" className="secondary-btn" onClick={onClose}>CANCEL</button><button className="primary-btn" disabled={busy || !name.trim()}><Plus size={16}/>{busy ? 'CREATING...' : 'CREATE PROJECT'}</button></div></form></div>;
}