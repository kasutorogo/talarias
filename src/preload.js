const { contextBridge, ipcRenderer } = require('electron');

let allTemplates = [];
let cachedAliases = {};

contextBridge.exposeInMainWorld('templateLauncher', {
  loadTemplates: async (folder) => {
    const result = await ipcRenderer.invoke('load-templates', folder || null);
    if (result.ok) allTemplates = result.templates;
    cachedAliases = await ipcRenderer.invoke('get-aliases');
    return result;
  },

  refreshAliases: async () => {
    cachedAliases = await ipcRenderer.invoke('get-aliases');
  },

  searchTemplates: (query) => {
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];

    const tokens = q.split(/\s+/);

    return allTemplates
      .map(item => {
        let score = 0;
        const alias = (cachedAliases[item.id] || '').toLowerCase();
        const hay = (item.searchText || [item.title, item.category, item.relativePath, item.body].join(' ').toLowerCase())
          + ' ' + alias;

        if (alias && alias === q) return { ...item, score: 100 };
        if (alias && alias.startsWith(q)) return { ...item, score: 50 };

        for (const tok of tokens) {
          if (!hay.includes(tok)) return null;
          score++;
          if (item.title.toLowerCase().includes(tok)) score += 3;
          if (item.category.toLowerCase().includes(tok)) score += 2;
          if (alias.includes(tok)) score += 5;
        }

        const nums = q.match(/\d+/g);
        if (nums) {
          for (const n of nums) {
            if (item.title.includes(n)) score += 4;
          }
        }

        return { ...item, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
  },

  copyText: (text) => ipcRenderer.invoke('copy-text', text),
  resizeWindow: (opts) => ipcRenderer.invoke('resize-window', opts),
  validateShortcut: (shortcut, templateId) => ipcRenderer.invoke('validate-shortcut', shortcut, templateId),
  saveBinding: (shortcut, templateData) => ipcRenderer.invoke('save-binding', shortcut, templateData),
  removeBinding: (templateId) => ipcRenderer.invoke('remove-binding', templateId),
  getBindings: () => ipcRenderer.invoke('get-bindings'),
  saveAlias: (templateId, alias) => ipcRenderer.invoke('save-alias', templateId, alias),
  getAliases: () => ipcRenderer.invoke('get-aliases'),
  listFolders: () => ipcRenderer.invoke('list-folders'),
  getUiLocale: () => ipcRenderer.invoke('get-ui-locale'),
  getTemplatesRoot: () => ipcRenderer.invoke('get-templates-root'),
  setTemplatesRoot: (folder) => ipcRenderer.invoke('set-templates-root', folder),
  chooseTemplatesRoot: () => ipcRenderer.invoke('choose-templates-root'),
  getSelectedFolder: () => ipcRenderer.invoke('get-selected-folder'),
  setSelectedFolder: (folder) => ipcRenderer.invoke('set-selected-folder', folder),
  getTheme: () => ipcRenderer.invoke('get-theme'),
  setTheme: (theme) => ipcRenderer.invoke('set-theme', theme),

  onLauncherOpened: (callback) => ipcRenderer.on('launcher-opened', () => callback()),
  onBindingCopied: (callback) => ipcRenderer.on('binding-copied', (_event, title) => callback(title))
});
