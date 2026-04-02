import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

let allTemplates = [];
let cachedAliases = {};

export async function loadTemplates(folder) {
  const result = await invoke('load_templates', { folder: folder || null });
  if (result.ok) {
    allTemplates = result.templates;
  }
  cachedAliases = await invoke('get_aliases');
  return result;
}

export async function refreshAliases() {
  cachedAliases = await invoke('get_aliases');
}

export function searchTemplates(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return [];

  const tokens = q.split(/\s+/);

  return allTemplates
    .map((item) => {
      let score = 0;
      const alias = (cachedAliases[item.id] || '').toLowerCase();
      const hay =
        ((item.searchText ||
          [item.title, item.category, item.relativePath, item.body].join(' ').toLowerCase()) +
          ' ' +
          alias).trim();

      if (alias && alias === q) return { ...item, score: 100 };
      if (alias && alias.startsWith(q)) return { ...item, score: 50 };

      for (const tok of tokens) {
        if (!hay.includes(tok)) return null;
        score += 1;
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
}

export const copyText = (text) => invoke('copy_text', { text });
export const resizeWindow = ({ resultCount, editorOpen }) =>
  invoke('resize_window', { resultCount, editorOpen });
export const validateShortcut = (shortcut, templateId) =>
  invoke('validate_shortcut', { shortcut, currentTemplateId: templateId || null });
export const saveBinding = (shortcut, templateData) =>
  invoke('save_binding', { shortcut, templateData });
export const removeBinding = (templateId) => invoke('remove_binding', { templateId });
export const getBindings = () => invoke('get_bindings');
export const saveAlias = (templateId, alias) => invoke('save_alias', { templateId, alias });
export const getAliases = () => invoke('get_aliases');
export const listFolders = () => invoke('list_folders');
export const getUiLocale = () => invoke('get_ui_locale');
export const getTemplatesRoot = () => invoke('get_templates_root');
export const setTemplatesRoot = (folder) => invoke('set_templates_root', { folder });
export const chooseTemplatesRoot = () => invoke('choose_templates_root');
export const getSelectedFolder = () => invoke('get_selected_folder');
export const setSelectedFolder = (folder) => invoke('set_selected_folder', { folder });
export const getTheme = () => invoke('get_theme');
export const setTheme = (theme) => invoke('set_theme', { theme });
export const dismissWelcome = () => invoke('dismiss_welcome');
export const saveMainShortcut = (shortcut) => invoke('save_main_shortcut', { shortcut });
export const getMainShortcut = () => invoke('get_main_shortcut');
export const closeCurrentWindow = () => invoke('close_current_window');
export const getAboutMetadata = () => invoke('get_about_metadata');
export const showAboutWindow = () => invoke('show_about_window_command');
export const getPlatform = () => invoke('get_platform');

export const onLauncherOpened = (callback) => listen('launcher-opened', () => callback());
export const onBindingCopied = (callback) => listen('binding-copied', (event) => callback(event.payload));
