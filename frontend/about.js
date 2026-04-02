import { getAboutMetadata } from './lib/api.js';

const strings = {
  en: {
    title: (appName) => `About ${appName}`,
    version: (appVersion) => `Version ${appVersion}`,
    subtitle: 'Template workflow launcher'
  },
  ja: {
    title: (appName) => `${appName} について`,
    version: (appVersion) => `バージョン ${appVersion}`,
    subtitle: 'テンプレート作業用ランチャー'
  }
};

(async () => {
  const { name, version, locale } = await getAboutMetadata();
  const t = strings[locale] || strings.en;

  document.title = t.title(name);
  document.getElementById('appName').textContent = name;
  document.getElementById('appVersion').textContent = t.version(version);
  document.getElementById('appSubtitle').textContent = t.subtitle;
})();
