module.exports = {
  title: 'React 技术揭秘',
  description: 'React源码解析',
  base: '/just-react/',
  dest: 'dist',
  serviceWorker: false,
  themeConfig: {
    repo: 'BetaSu/just-react',
    editLinks: true,
    docsDir: 'docs',
    editLinkText: '在 GitHub 上编辑此页',
    lastUpdated: '上次更新',
    nav: [
      {
        text: '配套代码',
        link: 'https://github.com/BetaSu/react-on-the-way'
      }
    ],
    sidebar: [
      {
        title: '设计思想',
        collapsable: false,
        children: [
          
        ]
      }
    ]
  }
}