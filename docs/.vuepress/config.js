              module.exports = {
  title: 'React 技术揭秘',
  description: 'React源码解析',
  base: '/just-react/',
  dest: 'dist',
  serviceWorker: false,
  configureWebpack: {
    resolve: {
      alias: {
        
      }
    }
  },
  themeConfig: {
    repo: 'BetaSu/just-react',
    editLinks: true,
    docsDir: 'docs',
    editLinkText: '为该章节纠错',
    lastUpdated: '上次更新',
    nav: [
      {
        text: '配套代码',
        link: 'https://github.com/BetaSu/react-on-the-way'
      }
    ],
    sidebar: [
      ['/', '前言'],
      {
        title: '第一章 前置知识',
        collapsable: false,
        children: [
          ['/preparation/idea', 'React理念'],
          ['/preparation/oldConstructure', '老的React架构'],
          ['/preparation/newConstructure', '新的React架构'],
          ['/preparation/file', '源码的文件结构']
        ]
      }
    ]
  }
}