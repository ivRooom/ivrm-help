import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://help.ivrm.jp',
  integrations: [
    starlight({
      title: 'IVRM Help Center',
      description: 'ivRooomコミュニティの参加方法、ルール、マニュアル、トラブルシューティング',
      favicon: '/favicon.svg',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/ivRooom' },
        { icon: 'discord', label: 'Discord', href: 'https://ivrm.jp' },
      ],
      customCss: ['./src/styles/custom.css'],
      lastUpdated: true,
      editLink: {
        baseUrl: 'https://github.com/ivRooom/ivrm-help/edit/main/',
      },
      sidebar: [
        {
          label: 'はじめに',
          items: [
            { label: 'Help Centerについて', slug: 'getting-started/community' },
            { label: 'Discordへの参加', slug: 'getting-started/discord' },
          ],
        },
        {
          label: 'Minecraft',
          items: [
            { label: 'Minecraftガイド', slug: 'minecraft' },
            { label: '生活鯖への入り方', slug: 'minecraft/how-to-join' },
            { label: 'コミュニティルール', slug: 'minecraft/rules' },
            { label: 'ゲームモード', slug: 'minecraft/game-modes' },
            { label: 'トラブルシューティング', slug: 'minecraft/troubleshooting' },
          ],
        },
        {
          label: 'Discord',
          items: [
            { label: 'チャンネルガイド', slug: 'discord/channels' },
            { label: 'ロールについて', slug: 'discord/roles' },
          ],
        },
        {
          label: 'サポート',
          items: [
            { label: 'よくある質問', slug: 'support/faq' },
            { label: '問題を報告する', slug: 'support/report-a-problem' },
          ],
        },
      ],
    }),
  ],
});
