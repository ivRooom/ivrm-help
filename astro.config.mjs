import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const DEFAULT_SITE_URL = 'https://ivrooom.github.io';
const DEFAULT_BASE_PATH = '/ivrm-help';

const normalizeBasePath = (value) => {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '/') return '/';
  return `/${trimmed.replace(/^\/+|\/+$/g, '')}`;
};

const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/g, '');
const base = normalizeBasePath(process.env.BASE_PATH || DEFAULT_BASE_PATH);
const withBase = (pathname) => {
  const normalizedPath = pathname.replace(/^\/+/, '');
  return base === '/' ? `/${normalizedPath}` : `${base}/${normalizedPath}`;
};

export default defineConfig({
  site: siteUrl,
  base,
  integrations: [
    starlight({
      title: 'IVRM Help Center',
      description: 'ivRooomコミュニティの参加方法、ルール、マニュアル、トラブルシューティング',
      favicon: withBase('favicon.svg'),
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      defaultLocale: 'root',
      locales: {
        root: {
          label: '日本語',
          lang: 'ja',
        },
        en: {
          label: 'English',
          lang: 'en',
        },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ivRooom' },
        { icon: 'discord', label: 'Discord', href: 'https://discord.gg/RqUEyS3FdB' },
      ],
      customCss: [
        './src/styles/custom.css',
        './src/styles/home-search.css',
        './src/styles/help-experience.css',
      ],
      components: {
        Footer: './src/components/CustomFooter.astro',
      },
      pagefind: true,
      head: [
        {
          tag: 'meta',
          attrs: {
            name: 'color-scheme',
            content: 'dark light',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#111421',
            media: '(prefers-color-scheme: dark)',
          },
        },
        {
          tag: 'meta',
          attrs: {
            name: 'theme-color',
            content: '#ffffff',
            media: '(prefers-color-scheme: light)',
          },
        },
        {
          tag: 'link',
          attrs: {
            rel: 'sitemap',
            href: withBase('sitemap.xml'),
            type: 'application/xml',
          },
        },
      ],
      lastUpdated: true,
      editLink: {
        baseUrl: 'https://github.com/ivRooom/ivrm-help/edit/main/',
      },
      sidebar: [
        {
          label: 'はじめに',
          translations: { en: 'Getting Started' },
          items: [
            { slug: 'getting-started/community' },
            { slug: 'getting-started/discord' },
            { slug: 'getting-started/display-and-language' },
          ],
        },
        {
          label: 'Minecraft',
          items: [
            { slug: 'minecraft' },
            { slug: 'minecraft/how-to-join' },
            { slug: 'minecraft/rules' },
            { slug: 'minecraft/game-modes' },
            { slug: 'minecraft/troubleshooting' },
          ],
        },
        {
          label: 'Discord',
          items: [
            { slug: 'discord/channels' },
            { slug: 'discord/roles' },
          ],
        },
        {
          label: 'サポート',
          translations: { en: 'Support' },
          items: [
            { slug: 'support/assistant' },
            { slug: 'support/faq' },
            { slug: 'support/report-a-problem' },
          ],
        },
      ],
    }),
  ],
});
