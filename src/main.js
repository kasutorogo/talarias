const { app, BrowserWindow, globalShortcut, ipcMain, clipboard, Menu, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const pkg = require('../package.json');

let mainWindow = null;
let aboutWindow = null;
let bindings = {};
let aliases = {};

const APP_NAME = pkg.build?.productName || pkg.productName || 'Talarias';
const APP_VERSION = pkg.version || '0.1.0';
const UI_LOCALE = pkg.talariasLocale || 'en';
let SHORTCUT_SHOW = 'Alt+Shift+Z';
const BUNDLED_TEMPLATES_DIR = path.join(__dirname, '..', 'templates');
const WIN_WIDTH = 580;
const INPUT_HEIGHT = 80;
const RESULT_ITEM_HEIGHT = 50;
const MAX_VISIBLE_RESULTS = 7;
const EDITOR_HEIGHT = 480;

const SYSTEM_SHORTCUTS = [
  SHORTCUT_SHOW,
  'CommandOrControl+C', 'CommandOrControl+V', 'CommandOrControl+X',
  'CommandOrControl+A', 'CommandOrControl+Z', 'CommandOrControl+Q',
  'CommandOrControl+W', 'CommandOrControl+Tab', 'CommandOrControl+S',
  'Alt+Tab', 'Alt+F4'
];

const UI_STRINGS = {
  en: {
    welcomeWindowTitle: `${APP_NAME} Welcome`,
    aboutWindowTitle: `About ${APP_NAME}`,
    aboutMenuLabel: `About ${APP_NAME}`,
    chooseTemplatesFolderTitle: `Choose ${APP_NAME} Templates Folder`,
    folderNotFound: 'Folder not found',
    reservedSystemShortcut: 'Reserved system shortcut',
    usedByHammerspoon: 'Used by Hammerspoon',
    alreadyBoundTo: (title) => `Already bound to: ${title}`,
    invalidShortcutFormat: 'Invalid shortcut format',
    empty: 'Empty',
    cannotRegisterShortcut: 'Cannot register this shortcut'
  },
  ja: {
    welcomeWindowTitle: `${APP_NAME} へようこそ`,
    aboutWindowTitle: `${APP_NAME} について`,
    aboutMenuLabel: `${APP_NAME} について`,
    chooseTemplatesFolderTitle: `${APP_NAME} のテンプレートフォルダを選択`,
    folderNotFound: 'フォルダが見つかりません',
    reservedSystemShortcut: 'このショートカットはシステムで予約されています',
    usedByHammerspoon: 'このショートカットはHammerspoonで使用中です',
    alreadyBoundTo: (title) => `すでに割り当て済みです: ${title}`,
    invalidShortcutFormat: 'ショートカットの形式が無効です',
    empty: '空です',
    cannotRegisterShortcut: 'このショートカットは登録できません'
  }
};

function t(key, ...args) {
  const value = UI_STRINGS[UI_LOCALE]?.[key] ?? UI_STRINGS.en[key];
  return typeof value === 'function' ? value(...args) : value;
}

function parseHammerspoonHotkeys() {
  const initPath = path.join(require('os').homedir(), '.hammerspoon', 'init.lua');
  const results = [];
  try {
    if (!fs.existsSync(initPath)) return results;
    const lua = fs.readFileSync(initPath, 'utf8');
    const modMap = { cmd: 'Command', alt: 'Alt', shift: 'Shift', ctrl: 'Control' };

    const re = /hs\.hotkey\.bind\(\s*\{([^}]*)\}\s*,\s*"([^"]+)"/g;
    let m;
    while ((m = re.exec(lua)) !== null) {
      const mods = [];
      for (const [hsName, elName] of Object.entries(modMap)) {
        if (m[1].includes(`"${hsName}"`)) mods.push(elName);
      }
      let key = m[2].length === 1 ? m[2].toUpperCase() : m[2];
      if (/^f\d+$/i.test(key)) key = key.toUpperCase();
      if (mods.length > 0) results.push(mods.join('+') + '+' + key);
    }

    const varModRe = /local\s+(\w+)\s*=\s*\{([^}]*)\}/g;
    const varKeyRe = /local\s+(\w+)\s*=\s*"([^"]+)"/g;
    const varMods = {}, varKeys = {};
    let vm;
    while ((vm = varModRe.exec(lua)) !== null) varMods[vm[1]] = vm[2];
    while ((vm = varKeyRe.exec(lua)) !== null) varKeys[vm[1]] = vm[2];

    const reVar = /hs\.hotkey\.bind\(\s*(\w+)\s*,\s*(\w+)\s*,/g;
    while ((m = reVar.exec(lua)) !== null) {
      if (!varMods[m[1]] || !varKeys[m[2]]) continue;
      const mods = [];
      for (const [hsName, elName] of Object.entries(modMap)) {
        if (varMods[m[1]].includes(`"${hsName}"`)) mods.push(elName);
      }
      let key = varKeys[m[2]].length === 1 ? varKeys[m[2]].toUpperCase() : varKeys[m[2]];
      if (/^f\d+$/i.test(key)) key = key.toUpperCase();
      if (mods.length > 0) results.push(mods.join('+') + '+' + key);
    }
  } catch (err) {
    console.error('Error parsing Hammerspoon:', err.message);
  }
  return results;
}

let RESERVED_SHORTCUTS = new Set(SYSTEM_SHORTCUTS);

function getDataPath(name) {
  return path.join(app.getPath('userData'), name);
}

function loadJSON(name) {
  try { return JSON.parse(fs.readFileSync(getDataPath(name), 'utf8')); } catch { return {}; }
}

function saveJSON(name, data) {
  const p = getDataPath(name);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

function getSavedTemplatesRoot() {
  try { return fs.readFileSync(getDataPath('templates-root'), 'utf8').trim(); } catch { return ''; }
}

function saveTemplatesRoot(dir) {
  fs.mkdirSync(path.dirname(getDataPath('templates-root')), { recursive: true });
  fs.writeFileSync(getDataPath('templates-root'), (dir || '').trim(), 'utf8');
}

function getTemplatesRootInfo() {
  const savedPath = getSavedTemplatesRoot();
  const custom = Boolean(savedPath);
  const exists = savedPath ? fs.existsSync(savedPath) : false;

  if (custom && exists) {
    return { path: savedPath, custom: true, fallback: false };
  }

  return {
    path: BUNDLED_TEMPLATES_DIR,
    custom: false,
    fallback: true
  };
}

function getTemplatesRootDir() {
  return getTemplatesRootInfo().path;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WIN_WIDTH,
    height: INPUT_HEIGHT,
    minWidth: 380,
    minHeight: INPUT_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    autoHideMenuBar: true,
    title: APP_NAME,
    icon: path.join(__dirname, '..', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
  mainWindow.webContents.on('did-finish-load', () => { showLauncher(); });
}

function showWelcome() {
  const win = new BrowserWindow({
    width: 720,
    height: 820,
    useContentSize: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    title: t('welcomeWindowTitle'),
    icon: path.join(__dirname, '..', 'icon.png'),
    parent: mainWindow,
    modal: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload-welcome.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'welcome.html'));
  win.once('ready-to-show', () => win.show());
}

function showAboutWindow() {
  if (aboutWindow && !aboutWindow.isDestroyed()) {
    aboutWindow.focus();
    return;
  }

  aboutWindow = new BrowserWindow({
    width: 360,
    height: 250,
    useContentSize: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    autoHideMenuBar: true,
    title: t('aboutWindowTitle'),
    icon: path.join(__dirname, '..', 'icon.png'),
    parent: mainWindow || undefined,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  aboutWindow.loadFile(path.join(__dirname, 'about.html'), {
    query: { name: APP_NAME, version: APP_VERSION, locale: UI_LOCALE }
  });
  aboutWindow.once('ready-to-show', () => aboutWindow.show());
  aboutWindow.on('closed', () => { aboutWindow = null; });
}

function buildAppMenu() {
  if (process.platform !== 'darwin') return;

  const template = [
    {
      label: APP_NAME,
      submenu: [
        { label: t('aboutMenuLabel'), click: () => showAboutWindow() },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function showLauncher() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.setAlwaysOnTop(true);
  mainWindow.focus();
  mainWindow.setAlwaysOnTop(false);
  mainWindow.webContents.send('launcher-opened');
}

function registerAllShortcuts() {
  globalShortcut.unregisterAll();

  const ok = globalShortcut.register(SHORTCUT_SHOW, () => {
    if (!mainWindow) return;
    showLauncher();
  });
  console.log(ok ? `Shortcut: ${SHORTCUT_SHOW}` : `Failed: ${SHORTCUT_SHOW}`);

  for (const [shortcut, binding] of Object.entries(bindings)) {
    const reg = globalShortcut.register(shortcut, () => {
      clipboard.writeText(binding.body || '');
      if (mainWindow) mainWindow.webContents.send('binding-copied', binding.title);
    });
    if (!reg) console.error(`Failed binding: ${shortcut}`);
  }
}

const TEMPLATE_EXTENSIONS = ['.md', '.txt'];

function walkTemplateFiles(dir) {
  const results = [];
  if (!dir || !fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkTemplateFiles(fullPath));
    } else if (entry.isFile() && TEMPLATE_EXTENSIONS.includes(path.extname(entry.name).toLowerCase())) {
      results.push(fullPath);
    }
  }
  return results;
}

function cleanTemplateContent(raw) {
  if (!raw) return '';
  let text = raw.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '');
  text = text.replace(/^# .*\n+/, '');
  const ri = text.search(/^##\s+Relacionado\b/im);
  if (ri !== -1) text = text.slice(0, ri);
  return text.trim();
}

function loadTemplatesFromDir(dir) {
  const files = walkTemplateFiles(dir);
  return files
    .map((filePath, index) => {
      const raw = fs.readFileSync(filePath, 'utf8');
      const ext = path.extname(filePath).toLowerCase();
      const body = ext === '.txt' ? raw.trim() : cleanTemplateContent(raw);
      const title = path.basename(filePath, ext);
      const relativePath = path.relative(dir, filePath);
      const category = path.relative(dir, path.dirname(filePath)).split(path.sep)[0] || '';
      const preview = body.slice(0, 120).replace(/\n/g, ' ');
      return { id: `${index + 1}`, title, body, path: filePath, relativePath, category, preview };
    })
    .filter(t => t.body);
}

function listTemplateFolders() {
  try {
    const entries = fs.readdirSync(getTemplatesRootDir(), { withFileTypes: true });
    return entries.filter(e => e.isDirectory()).map(e => e.name);
  } catch {
    return [];
  }
}

app.whenReady().then(() => {
  app.setName(APP_NAME);
  app.setAboutPanelOptions({
    applicationName: APP_NAME,
    applicationVersion: APP_VERSION,
    version: APP_VERSION,
    iconPath: path.join(__dirname, '..', 'icon.png')
  });

  if (process.platform === 'darwin') {
    app.dock.setIcon(path.join(__dirname, '..', 'icon.png'));
  }
  buildAppMenu();

  const hsHotkeys = parseHammerspoonHotkeys();
  RESERVED_SHORTCUTS = new Set([...SYSTEM_SHORTCUTS, ...hsHotkeys]);
  console.log(`Reserved shortcuts: ${RESERVED_SHORTCUTS.size} (${hsHotkeys.length} from Hammerspoon)`);

  // Load saved main shortcut
  try {
    const saved = fs.readFileSync(getDataPath('main-shortcut'), 'utf8').trim();
    if (saved) SHORTCUT_SHOW = saved;
  } catch {}

  bindings = loadJSON('bindings.json');
  aliases = loadJSON('aliases.json');
  createWindow();
  registerAllShortcuts();

  // Show welcome on first run
  const welcomePath = getDataPath('welcome-dismissed');
  if (!fs.existsSync(welcomePath)) {
    setTimeout(() => showWelcome(), 500);
  }

  ipcMain.handle('load-templates', async (_event, folder) => {
    try {
      const rootDir = getTemplatesRootDir();
      const dir = folder ? path.join(rootDir, folder) : rootDir;
      return { ok: true, templates: loadTemplatesFromDir(dir), rootDir };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  });

  ipcMain.handle('list-folders', async () => listTemplateFolders());
  ipcMain.handle('get-ui-locale', async () => UI_LOCALE);

  ipcMain.handle('get-templates-root', async () => getTemplatesRootInfo());

  ipcMain.handle('set-templates-root', async (_event, folder) => {
    if (!folder) {
      saveTemplatesRoot('');
      return { ok: true, ...getTemplatesRootInfo() };
    }

    const resolved = path.resolve(folder);
    if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
      return { ok: false, error: t('folderNotFound') };
    }

    saveTemplatesRoot(resolved);
    return { ok: true, ...getTemplatesRootInfo() };
  });

  ipcMain.handle('choose-templates-root', async () => {
    const current = getTemplatesRootDir();
    const result = await dialog.showOpenDialog(mainWindow || undefined, {
      title: t('chooseTemplatesFolderTitle'),
      defaultPath: current,
      properties: ['openDirectory', 'createDirectory']
    });

    if (result.canceled || !result.filePaths.length) {
      return { ok: false, canceled: true, ...getTemplatesRootInfo() };
    }

    const chosen = path.resolve(result.filePaths[0]);
    saveTemplatesRoot(chosen);
    return { ok: true, canceled: false, ...getTemplatesRootInfo() };
  });

  ipcMain.handle('get-selected-folder', async () => {
    try { return fs.readFileSync(getDataPath('selected-folder'), 'utf8').trim(); } catch { return ''; }
  });

  ipcMain.handle('set-selected-folder', async (_event, folder) => {
    fs.mkdirSync(path.dirname(getDataPath('selected-folder')), { recursive: true });
    fs.writeFileSync(getDataPath('selected-folder'), (folder || '').trim(), 'utf8');
    return { ok: true };
  });

  ipcMain.handle('copy-text', async (_event, text) => {
    clipboard.writeText(text || '');
    return { ok: true };
  });

  ipcMain.handle('resize-window', async (_event, { resultCount, editorOpen }) => {
    if (!mainWindow) return;
    const bounds = mainWindow.getBounds();
    let h = INPUT_HEIGHT;
    if (resultCount > 0 && !editorOpen) {
      h += Math.min(resultCount, MAX_VISIBLE_RESULTS) * RESULT_ITEM_HEIGHT + 2;
    }
    if (editorOpen) {
      h = EDITOR_HEIGHT;
    }
    mainWindow.setBounds({ x: bounds.x, y: bounds.y, width: WIN_WIDTH, height: h });
  });

  ipcMain.handle('validate-shortcut', async (_event, shortcut, currentTemplateId) => {
    if (!shortcut) return { valid: false, error: '' };

    if (SYSTEM_SHORTCUTS.includes(shortcut)) {
      return { valid: false, error: t('reservedSystemShortcut') };
    }

    const hsHK = parseHammerspoonHotkeys();
    if (hsHK.includes(shortcut)) {
      return { valid: false, error: t('usedByHammerspoon') };
    }

    if (bindings[shortcut] && bindings[shortcut].id !== currentTemplateId) {
      return { valid: false, error: t('alreadyBoundTo', bindings[shortcut].title) };
    }

    try {
      globalShortcut.unregister(shortcut);
      const ok = globalShortcut.register(shortcut, () => {});
      if (ok) {
        globalShortcut.unregister(shortcut);
        registerAllShortcuts();
        return { valid: true };
      }
      registerAllShortcuts();
      return { valid: false, error: t('invalidShortcutFormat') };
    } catch {
      registerAllShortcuts();
      return { valid: false, error: t('invalidShortcutFormat') };
    }
  });

  ipcMain.handle('save-binding', async (_event, shortcut, templateData) => {
    for (const [key, val] of Object.entries(bindings)) {
      if (val.id === templateData.id) delete bindings[key];
    }
    bindings[shortcut] = templateData;
    saveJSON('bindings.json', bindings);
    registerAllShortcuts();
    return { ok: true };
  });

  ipcMain.handle('remove-binding', async (_event, templateId) => {
    for (const [key, val] of Object.entries(bindings)) {
      if (val.id === templateId) delete bindings[key];
    }
    saveJSON('bindings.json', bindings);
    registerAllShortcuts();
    return { ok: true };
  });

  ipcMain.handle('get-bindings', async () => bindings);

  ipcMain.handle('save-alias', async (_event, templateId, alias) => {
    if (alias) { aliases[templateId] = alias; } else { delete aliases[templateId]; }
    saveJSON('aliases.json', aliases);
    return { ok: true };
  });

  ipcMain.handle('get-aliases', async () => aliases);

  ipcMain.handle('get-main-shortcut', async () => {
    try { return fs.readFileSync(getDataPath('main-shortcut'), 'utf8').trim(); } catch { return SHORTCUT_SHOW; }
  });

  ipcMain.handle('save-main-shortcut', async (_event, shortcut) => {
    if (!shortcut) return { ok: false, error: t('empty') };

    // Test if valid
    try {
      const ok = globalShortcut.register(shortcut, () => {});
      if (!ok) return { ok: false, error: t('cannotRegisterShortcut') };
      globalShortcut.unregister(shortcut);
    } catch {
      return { ok: false, error: t('invalidShortcutFormat') };
    }

    SHORTCUT_SHOW = shortcut;
    fs.mkdirSync(path.dirname(getDataPath('main-shortcut')), { recursive: true });
    fs.writeFileSync(getDataPath('main-shortcut'), shortcut, 'utf8');
    registerAllShortcuts();
    return { ok: true };
  });

  ipcMain.handle('dismiss-welcome', async () => {
    fs.mkdirSync(path.dirname(getDataPath('welcome-dismissed')), { recursive: true });
    fs.writeFileSync(getDataPath('welcome-dismissed'), '1', 'utf8');
    return { ok: true };
  });

  ipcMain.handle('get-theme', async () => {
    try { return fs.readFileSync(getDataPath('theme'), 'utf8').trim(); } catch { return 'dark'; }
  });

  ipcMain.handle('set-theme', async (_event, theme) => {
    fs.mkdirSync(path.dirname(getDataPath('theme')), { recursive: true });
    fs.writeFileSync(getDataPath('theme'), theme, 'utf8');
    return { ok: true };
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      registerAllShortcuts();
    }
  });
});

app.on('will-quit', () => { globalShortcut.unregisterAll(); });
