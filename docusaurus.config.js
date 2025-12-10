// @ts-check

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'AI-Native Textbook: Physical AI & Humanoid Robotics',
  tagline: 'Comprehensive textbook on Physical AI and Humanoid Robotics',
  favicon: 'img/favicon.ico',

  url: 'https://ha70270217.github.io',
  baseUrl: '/textbook-website/',
  organizationName: 'Ha70270217',
  projectName: 'textbook-website',

  onBrokenLinks: 'throw',
  markdown: { hooks: { onBrokenMarkdownLinks: 'warn' } },


  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ur'],
    localeConfigs: {
      en: { label: 'English', direction: 'ltr' },
      ur: { label: 'اردو', direction: 'rtl' },
    },
  },

  
  presets: [
    [
      'classic',
      ({
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          routeBasePath: '/',         // homepage = docs
          editLocalizedFiles: true,
          editUrl: 'https://github.com/ha70270217/textbook-website/edit/main/',
          sidebarCollapsible: true,
        },
        blog: false,
        theme: { customCss: require.resolve('./src/css/custom.css') },
      }),
    ],
  ],


  plugins: [
    [
      '@docusaurus/plugin-pwa',
      {
        debug: true,
        offlineModeActivationStrategies: ['appInstalled', 'standalone', 'queryString'],
        pwaHead: [
          { tagName: 'link', rel: 'icon', href: '/img/icon-192x192.png' },
          { tagName: 'link', rel: 'manifest', href: '/manifest.json' },
          { tagName: 'meta', name: 'theme-color', content: '#2e8555' },
        ],
      },
    ],
  ],


  themeConfig: ({
    navbar: {
      title: 'Textbook',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'textbook',
          docId: 'index',   // FIXED
          position: 'left',
          label: 'Chapters',
        },
        { href: 'https://github.com/ha70270217/textbook-website', label: 'GitHub', position: 'right' },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Chapters',
          items: [
            { label: 'Introduction to Physical AI', to: '/chapter-1' },
            { label: 'Basics of Humanoid Robotics', to: '/chapter-2' },
            { label: 'ROS 2 Fundamentals', to: '/chapter-3' },
            { label: 'Digital Twin Simulation', to: '/chapter-4' },
            { label: 'Vision-Language-Action Systems', to: '/chapter-5' },
            { label: 'Capstone: AI-Robot Pipeline', to: '/chapter-6' },
          ],
        },
        {
          title: 'More',
          items: [
            { label: 'GitHub', href: 'https://github.com/Ha70270217/textbook-website' },
          ],
        },
      ],
      copyright: `© ${new Date().getFullYear()} Textbook Project`,
    },

    prism: {
      theme: require('prism-react-renderer').themes.github,
      darkTheme: require('prism-react-renderer').themes.dracula,
    },
  }),
};

module.exports = config;
