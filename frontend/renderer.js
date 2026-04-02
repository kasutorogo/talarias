import {
  chooseTemplatesRoot,
  copyText,
  getAliases,
  getBindings,
  getSelectedFolder,
  getTemplatesRoot,
  getTheme,
  getUiLocale,
  listFolders,
  loadTemplates,
  onBindingCopied,
  onLauncherOpened,
  refreshAliases,
  removeBinding,
  resizeWindow,
  searchTemplates,
  saveAlias,
  saveBinding,
  setSelectedFolder,
  setTheme,
  validateShortcut,
} from './lib/api.js';
import { getCurrentWindow } from '@tauri-apps/api/window';

const state = {
  templates: [],
  filtered: [],
  selectedIndex: -1,
  editorOpen: false,
  currentItem: null,
  allBindings: {},
  currentFolder: null
};

const searchInput = document.getElementById('searchInput');
const resultsEl = document.getElementById('results');
const editorPanel = document.getElementById('editorPanel');
const previewEditor = document.getElementById('previewEditor');
const copyBtn = document.getElementById('copyBtn');
const statusEl = document.getElementById('status');
const shortcutInput = document.getElementById('shortcutInput');
const shortcutStatus = document.getElementById('shortcutStatus');
const aliasInput = document.getElementById('aliasInput');
const folderSelect = document.getElementById('folderSelect');
const rootFolderBtn = document.getElementById('rootFolderBtn');
const themeToggle = document.getElementById('themeToggle');
const appShell = document.querySelector('.app-shell');
const appWindow = getCurrentWindow();
let uiLocale = 'en';

const UI_STRINGS = {
  en: {
    title: 'Talarias',
    searchPlaceholder: 'Search templates...',
    aliasPlaceholder: 'Alias',
    aliasTitle: 'Custom search keyword',
    shortcutPlaceholder: 'Shortcut',
    shortcutTitle: 'Press a key combination',
    copy: 'Copy',
    allFolders: 'All folders',
    templatesFolder: 'Templates folder',
    chooseFolder: 'Choose Folder',
    changeFolder: 'Change Folder',
    templatesFolderStatus: (path) => `Templates folder: ${path}`,
    loaded: (folder) => `Loaded: ${folder || 'All folders'}`,
    copied: 'Copied',
    copiedTitle: (title) => `Copied: ${title}`,
    bound: 'Bound',
    saved: 'Saved',
    removed: 'Removed',
    needsModifier: 'Needs a modifier'
  },
  ja: {
    title: 'Talarias',
    searchPlaceholder: 'テンプレートを検索...',
    aliasPlaceholder: 'エイリアス',
    aliasTitle: '検索用キーワード',
    shortcutPlaceholder: 'ショートカット',
    shortcutTitle: 'キーの組み合わせを押してください',
    copy: 'コピー',
    allFolders: 'すべてのフォルダ',
    templatesFolder: 'テンプレートフォルダ',
    chooseFolder: 'フォルダを選択',
    changeFolder: 'フォルダを変更',
    templatesFolderStatus: (path) => `テンプレートフォルダ: ${path}`,
    loaded: (folder) => `読み込み済み: ${folder || 'すべてのフォルダ'}`,
    copied: 'コピーしました',
    copiedTitle: (title) => `コピーしました: ${title}`,
    bound: '設定済み',
    saved: '保存しました',
    removed: '削除しました',
    needsModifier: '修飾キーが必要です'
  }
};

function t(key, ...args) {
  const value = UI_STRINGS[uiLocale]?.[key] ?? UI_STRINGS.en[key];
  return typeof value === 'function' ? value(...args) : value;
}

function applyUiText() {
  document.title = t('title');
  searchInput.placeholder = t('searchPlaceholder');
  aliasInput.placeholder = t('aliasPlaceholder');
  aliasInput.title = t('aliasTitle');
  shortcutInput.placeholder = t('shortcutPlaceholder');
  shortcutInput.title = t('shortcutTitle');
  copyBtn.textContent = t('copy');
}

function setStatus(msg) {
  statusEl.textContent = msg;
  clearTimeout(setStatus.t);
  setStatus.t = setTimeout(() => { statusEl.textContent = ''; }, 2500);
}

function escapeHtml(t) {
  return (t || '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function shortenPath(p) {
  if (!p) return '';
  if (p.length <= 42) return p;
  return `...${p.slice(-39)}`;
}

function updateSize() {
  resizeWindow({
    resultCount: resultsEl.classList.contains('hidden') ? 0 : state.filtered.length,
    editorOpen: state.editorOpen
  });
}

appShell.addEventListener('mousedown', async (event) => {
  if (event.button !== 0) return;
  if (event.target.closest('input, textarea, button, select, option, .result-item')) return;

  try {
    await appWindow.startDragging();
  } catch {
    // Ignore drag failures so regular clicks keep working.
  }
});

function closeEditor() {
  state.editorOpen = false;
  state.currentItem = null;
  editorPanel.classList.add('hidden');
  previewEditor.value = '';
  shortcutInput.value = '';
  shortcutInput.className = '';
  shortcutStatus.textContent = '';
  shortcutStatus.className = '';
  aliasInput.value = '';
}

function findBindingForTemplate(templateId) {
  for (const [key, val] of Object.entries(state.allBindings)) {
    if (val.id === templateId) return key;
  }
  return '';
}

async function openEditor(item) {
  state.editorOpen = true;
  state.currentItem = item;
  previewEditor.value = item.body;
  editorPanel.classList.remove('hidden');

  state.allBindings = await getBindings();
  const existing = findBindingForTemplate(item.id);
  shortcutInput.value = existing;
  if (existing) {
    shortcutInput.className = 'valid';
    shortcutStatus.textContent = t('bound');
    shortcutStatus.className = 'valid';
  } else {
    shortcutInput.className = '';
    shortcutStatus.textContent = '';
    shortcutStatus.className = '';
  }

  const allAliases = await getAliases();
  aliasInput.value = allAliases[item.id] || '';

  previewEditor.focus();
  previewEditor.setSelectionRange(0, 0);
  updateSize();
}

function renderFolderOptions(folders) {
  folderSelect.innerHTML = `<option value="">${escapeHtml(t('allFolders'))}</option>` +
    folders.map(f => `<option value="${escapeHtml(f)}">${escapeHtml(f)}</option>`).join('');
}

async function refreshFolderOptions() {
  const folders = await listFolders();
  renderFolderOptions(folders);
  return folders;
}

async function syncTemplatesRootButton() {
  const info = await getTemplatesRoot();
  rootFolderBtn.title = info?.path ? t('templatesFolderStatus', info.path) : t('templatesFolder');
  rootFolderBtn.textContent = info?.custom ? t('changeFolder') : t('chooseFolder');
}

function showResults() {
  if (!state.filtered.length) {
    resultsEl.classList.add('hidden');
    updateSize();
    return;
  }

  resultsEl.classList.remove('hidden');
  resultsEl.innerHTML = state.filtered.map((item, i) => `
    <div class="result-item ${i === state.selectedIndex ? 'active' : ''}" data-index="${i}">
      <div class="title">${escapeHtml(item.title)}</div>
      <div class="preview-line">${escapeHtml(item.category)} · ${escapeHtml(item.preview)}</div>
    </div>
  `).join('');

  resultsEl.querySelectorAll('.result-item').forEach(node => {
    node.addEventListener('click', () => {
      state.selectedIndex = Number(node.dataset.index);
      confirmSelection();
    });
  });

  const active = resultsEl.querySelector('.result-item.active');
  if (active) active.scrollIntoView({ block: 'nearest' });
  updateSize();
}

function hideResults() {
  resultsEl.classList.add('hidden');
  state.selectedIndex = -1;
}

function runSearch() {
  const q = searchInput.value.trim();
  if (!q) {
    state.filtered = [];
    state.selectedIndex = -1;
    hideResults();
    updateSize();
    return;
  }

  state.filtered = searchTemplates(q);
  state.selectedIndex = state.filtered.length ? 0 : -1;
  showResults();
}

function moveSelection(delta) {
  if (!state.filtered.length) return;
  state.selectedIndex = (state.selectedIndex + delta + state.filtered.length) % state.filtered.length;
  showResults();
}

function confirmSelection() {
  if (state.selectedIndex < 0 || !state.filtered.length) return;
  const item = state.filtered[state.selectedIndex];
  hideResults();
  openEditor(item);
}

async function copyTemplate() {
  const text = previewEditor.value.trim();
  if (!text) return;
  await copyText(text);
  setStatus(t('copied'));
}

// Shortcut capture
shortcutInput.addEventListener('keydown', async (e) => {
  e.preventDefault();
  if (e.key === 'Escape') { searchInput.focus(); return; }

  if (e.key === 'Backspace' || e.key === 'Delete') {
    if (state.currentItem) {
      await removeBinding(state.currentItem.id);
      state.allBindings = await getBindings();
    }
    shortcutInput.value = '';
    shortcutInput.className = '';
    shortcutStatus.textContent = t('removed');
    shortcutStatus.className = '';
    setTimeout(() => { shortcutStatus.textContent = ''; }, 1500);
    return;
  }

  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

  const parts = [];
  if (e.ctrlKey || e.metaKey) parts.push('CommandOrControl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  if (!parts.length) {
    shortcutInput.value = e.key;
    shortcutInput.className = 'invalid';
    shortcutStatus.textContent = t('needsModifier');
    shortcutStatus.className = 'invalid';
    return;
  }

  let keyName = e.key;
  if (keyName.length === 1) keyName = keyName.toUpperCase();
  else {
    const map = { 'ArrowUp': 'Up', 'ArrowDown': 'Down', 'ArrowLeft': 'Left', 'ArrowRight': 'Right', ' ': 'Space' };
    keyName = map[keyName] || keyName;
  }

  parts.push(keyName);
  const shortcut = parts.join('+');
  shortcutInput.value = shortcut;

  if (!state.currentItem) return;

  const result = await validateShortcut(shortcut, state.currentItem.id);
  if (result.valid) {
    shortcutInput.className = 'valid';
    shortcutStatus.textContent = t('saved');
    shortcutStatus.className = 'valid';
    await saveBinding(shortcut, {
      id: state.currentItem.id,
      title: state.currentItem.title,
      category: state.currentItem.category,
      body: state.currentItem.body
    });
    state.allBindings = await getBindings();
  } else {
    shortcutInput.className = 'invalid';
    shortcutStatus.textContent = result.error;
    shortcutStatus.className = 'invalid';
  }
});

shortcutInput.addEventListener('input', () => {
  shortcutInput.value = findBindingForTemplate(state.currentItem?.id) || '';
});

// Alias
let aliasTimer = null;
aliasInput.addEventListener('input', () => {
  clearTimeout(aliasTimer);
  aliasTimer = setTimeout(async () => {
    if (!state.currentItem) return;
    await saveAlias(state.currentItem.id, aliasInput.value.trim());
    await refreshAliases();
  }, 400);
});

aliasInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.preventDefault(); previewEditor.focus(); }
});

async function loadFolder(folder, { showStatus = true } = {}) {
  state.currentFolder = folder || null;
  const result = await loadTemplates(state.currentFolder);
  if (result && result.ok) {
    state.templates = result.templates.map(t => ({
      ...t,
      searchText: [t.title, t.category, t.relativePath, t.body].join(' ').toLowerCase()
    }));
  }
  if (showStatus) {
    setStatus(t('loaded', folder));
  }
  if (searchInput.value.trim()) runSearch();
}

// Folder dropdown
folderSelect.addEventListener('change', async () => {
  const val = folderSelect.value;
  await setSelectedFolder(val);
  await loadFolder(val);
});

rootFolderBtn.addEventListener('click', async () => {
  closeEditor();
  const result = await chooseTemplatesRoot();
  if (!result || result.canceled || result.error) return;

  await setSelectedFolder('');
  await refreshFolderOptions();
  folderSelect.value = '';
  await syncTemplatesRootButton();
  await loadFolder('', { showStatus: false });
  setStatus(t('templatesFolderStatus', shortenPath(result.path)));
  searchInput.focus();
});

// Search
searchInput.addEventListener('input', () => {
  closeEditor();
  runSearch();
});

searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); }
  else if (e.key === 'Enter') { e.preventDefault(); confirmSelection(); }
  else if (e.key === 'Escape') {
    hideResults();
    closeEditor();
    searchInput.value = '';
    updateSize();
  }
});

previewEditor.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    closeEditor();
    searchInput.focus();
    searchInput.select();
    updateSize();
  }
});

copyBtn.addEventListener('click', copyTemplate);

(async () => {
  await onLauncherOpened(async () => {
    closeEditor();
    hideResults();
    searchInput.value = '';
    searchInput.focus();
    updateSize();
  });
})();

(async () => {
  await onBindingCopied((title) => {
    setStatus(t('copiedTitle', title));
  });
})();

// Theme
let currentTheme = 'dark';

function applyTheme(theme) {
  currentTheme = theme;
  document.body.classList.toggle('light', theme === 'light');
  themeToggle.innerHTML = theme === 'light' ? '&#9728;' : '&#9790;';
}

themeToggle.addEventListener('click', async () => {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(currentTheme);
  await setTheme(currentTheme);
});

// Init
(async function init() {
  uiLocale = await getUiLocale();
  applyUiText();
  applyTheme(await getTheme());

  const folders = await refreshFolderOptions();
  await syncTemplatesRootButton();

  const savedFolder = await getSelectedFolder();
  const initialFolder = folders.includes(savedFolder) ? savedFolder : '';
  if (savedFolder && !initialFolder) {
    await setSelectedFolder('');
  }
  folderSelect.value = initialFolder;
  await loadFolder(initialFolder, { showStatus: false });

  state.allBindings = await getBindings();
  searchInput.focus();
  updateSize();
})();
