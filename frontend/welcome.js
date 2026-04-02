import {
  chooseTemplatesRoot,
  closeCurrentWindow,
  dismissWelcome,
  getMainShortcut,
  getTemplatesRoot,
  getTheme,
  getUiLocale,
  saveMainShortcut,
  setTheme,
} from './lib/api.js';

const shortcutInput = document.getElementById('shortcutInput');
const shortcutStatus = document.getElementById('shortcutStatus');
const templatesFolderInput = document.getElementById('templatesFolderInput');

const UI_STRINGS = {
  en: {
    pageTitle: 'Talarias Welcome',
    headerTitle: 'Talarias (Template Launcher)',
    templatesTitle: 'Templates folder',
    templatesHint1: 'Choose the folder where your templates will live.',
    chooseFolder: 'Choose Folder',
    templatesHint2: 'Each first-level subfolder inside that folder will appear in the dropdown at the bottom of the editor.',
    templatesHint3: 'Only one level is shown in that dropdown. If one of those folders contains another subfolder, that second level will not appear there.',
    howTitle: 'How it works',
    howList: [
      'Put your <code>.md</code> or <code>.txt</code> templates inside the selected folder.',
      'Start typing to search. Use <kbd>Arrow keys</kbd> to navigate and <kbd>Enter</kbd> to open a template.',
      'You can edit the text before copying.',
      'Press <kbd>Escape</kbd> to go back to the search input.'
    ],
    powerTitle: 'Power features',
    powerList: [
      '<span class="term">Alias</span> Assign a short keyword to any template for faster search.',
      '<span class="term">Shortcut</span> Bind a keyboard shortcut to copy a template directly to clipboard without opening the app.',
      '<span class="term">Folder filter</span> Use the dropdown at the bottom of the editor to load templates from a specific first-level subfolder.'
    ],
    globalShortcutTitle: 'Global shortcut to bring the app to front',
    shortcutHint: 'Press a key combination to change it, or leave it as is.',
    themeLabel: 'Theme:',
    dark: 'Dark',
    light: 'Light',
    dismissLabel: "Don't show again",
    close: 'Got it',
    needsModifier: 'Needs a modifier (Ctrl, Alt, Shift)',
    saved: 'Saved'
  },
  ja: {
    pageTitle: 'Talarias へようこそ',
    headerTitle: 'Talarias (Template Launcher)',
    templatesTitle: 'テンプレートフォルダ',
    templatesHint1: 'テンプレートを保存するフォルダを選択してください。',
    chooseFolder: 'フォルダを選択',
    templatesHint2: 'そのフォルダ直下の第一階層サブフォルダが、エディタ下部のドロップダウンに表示されます。',
    templatesHint3: 'ドロップダウンに表示されるのは一階層目だけです。さらに下の二階層目のサブフォルダは表示されません。',
    howTitle: '使い方',
    howList: [
      '選択したフォルダに <code>.md</code> または <code>.txt</code> のテンプレートを入れてください。',
      '入力を始めると検索できます。<kbd>Arrow keys</kbd> で移動し、<kbd>Enter</kbd> でテンプレートを開きます。',
      'コピーする前にテキストを編集できます。',
      '<kbd>Escape</kbd> を押すと検索入力に戻ります。'
    ],
    powerTitle: '便利な機能',
    powerList: [
      '<span class="term">エイリアス</span> よく使うテンプレートに短い検索キーワードを割り当てられます。',
      '<span class="term">ショートカット</span> アプリを開かずにテンプレートを直接コピーするキーボードショートカットを設定できます。',
      '<span class="term">フォルダフィルター</span> エディタ下部のドロップダウンから第一階層のサブフォルダを切り替えられます。'
    ],
    globalShortcutTitle: 'アプリを前面に表示するグローバルショートカット',
    shortcutHint: 'キーの組み合わせを押して変更できます。今のままでも使えます。',
    themeLabel: 'テーマ:',
    dark: 'ダーク',
    light: 'ライト',
    dismissLabel: '次回から表示しない',
    close: 'OK',
    needsModifier: '修飾キーが必要です (Ctrl / Alt / Shift)',
    saved: '保存しました'
  }
};

let uiLocale = 'en';

function t(key) {
  return UI_STRINGS[uiLocale]?.[key] ?? UI_STRINGS.en[key];
}

function updateThemeBtns(theme) {
  document.getElementById('themeDark').classList.toggle('active', theme === 'dark');
  document.getElementById('themeLight').classList.toggle('active', theme === 'light');
}

function updateTemplatesFolder(info) {
  templatesFolderInput.value = info?.path || '';
  templatesFolderInput.title = info?.path || '';
}

function applyText() {
  document.title = t('pageTitle');
  document.getElementById('headerTitle').textContent = t('headerTitle');
  document.getElementById('templatesTitle').textContent = t('templatesTitle');
  document.getElementById('templatesHint1').textContent = t('templatesHint1');
  document.getElementById('chooseFolderBtn').textContent = t('chooseFolder');
  document.getElementById('templatesHint2').textContent = t('templatesHint2');
  document.getElementById('templatesHint3').textContent = t('templatesHint3');
  document.getElementById('howTitle').textContent = t('howTitle');
  document.getElementById('howList').innerHTML = t('howList').map((item) => `<li>${item}</li>`).join('');
  document.getElementById('powerTitle').textContent = t('powerTitle');
  document.getElementById('powerList').innerHTML = t('powerList').map((item) => `<li>${item}</li>`).join('');
  document.getElementById('globalShortcutTitle').textContent = t('globalShortcutTitle');
  document.getElementById('shortcutHint').textContent = t('shortcutHint');
  document.getElementById('themeLabel').textContent = t('themeLabel');
  document.getElementById('themeDark').textContent = t('dark');
  document.getElementById('themeLight').textContent = t('light');
  document.getElementById('dismissLabel').textContent = t('dismissLabel');
  document.getElementById('closeBtn').textContent = t('close');
}

(async () => {
  uiLocale = await getUiLocale();
  applyText();

  const theme = await getTheme();
  document.body.classList.toggle('light', theme === 'light');
  updateThemeBtns(theme);

  const shortcut = await getMainShortcut();
  shortcutInput.value = shortcut || 'Alt+Shift+Z';

  updateTemplatesFolder(await getTemplatesRoot());
})();

document.getElementById('chooseFolderBtn').addEventListener('click', async () => {
  const result = await chooseTemplatesRoot();
  if (result && !result.canceled && !result.error) {
    updateTemplatesFolder(result);
  }
});

document.getElementById('themeDark').addEventListener('click', async () => {
  document.body.classList.remove('light');
  updateThemeBtns('dark');
  await setTheme('dark');
});

document.getElementById('themeLight').addEventListener('click', async () => {
  document.body.classList.add('light');
  updateThemeBtns('light');
  await setTheme('light');
});

shortcutInput.addEventListener('keydown', async (event) => {
  event.preventDefault();
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(event.key)) return;

  const parts = [];
  if (event.ctrlKey || event.metaKey) parts.push('CommandOrControl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');

  if (!parts.length) {
    shortcutInput.value = event.key;
    shortcutInput.className = 'invalid';
    shortcutStatus.textContent = t('needsModifier');
    shortcutStatus.className = 'status invalid';
    return;
  }

  let keyName = event.key;
  if (keyName.length === 1) {
    keyName = keyName.toUpperCase();
  } else {
    const map = { ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', ' ': 'Space' };
    keyName = map[keyName] || keyName;
  }

  parts.push(keyName);
  const shortcut = parts.join('+');
  shortcutInput.value = shortcut;

  try {
    await saveMainShortcut(shortcut);
    shortcutInput.className = 'valid';
    shortcutStatus.textContent = t('saved');
    shortcutStatus.className = 'status valid';
  } catch (error) {
    shortcutInput.className = 'invalid';
    shortcutStatus.textContent = error || 'Invalid';
    shortcutStatus.className = 'status invalid';
  }
});

document.getElementById('closeBtn').addEventListener('click', async () => {
  if (document.getElementById('dismissCheck').checked) {
    await dismissWelcome();
  }
  await closeCurrentWindow();
});
