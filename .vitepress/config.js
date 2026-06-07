export default {
  // ============================================================
  // Site Config
  // ============================================================
  base: '/agentskills/',
  lang: 'zh-TW',
  title: 'Agent Skills 實戰課程',
  description: '繁體中文 Agent Skills 完整教學 — 從零學會撰寫、測試、發布 AI Agent 技能',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'zh_TW' }],
    ['meta', { name: 'og:site_name', content: 'Leo Laboratory' }],
    ['meta', { name: 'keywords', content: 'Agent Skills, SKILL.md, Claude Code, AI Agent, AI 技能, 教學, 繁體中文' }],
    ['meta', { name: 'author', content: 'Leo Laboratory' }]
  ],

  // ============================================================
  // Theme Config — Leo Laboratory Branding
  // ============================================================
  themeConfig: {
    // 頂部品牌標示（無 logo 圖時用純文字）
    siteTitle: 'Leo Laboratory',

    // 頂部導覽列
    nav: [
      { text: '首頁', link: '/' },
      {
        text: '📖 秘笈',
        items: [
          { text: 'S1: Agent Skills 是什麼？', link: '/秘笈/01-what-are-agent-skills' },
          { text: 'S2: SKILL.md 格式', link: '/秘笈/02-skills-md-format' },
          { text: 'S3: Description 優化', link: '/秘笈/03-description-optimization' },
          { text: 'S4: 7 個 Instruction 套路', link: '/秘笈/04-instruction-patterns' },
          { text: 'S5: 從零到發布實戰', link: '/秘笈/05-zero-to-publish' },
          { text: 'S6: 生態系速覽', link: '/秘笈/06-ecosystem-tour' }
        ]
      },
      {
        text: '📚 課程',
        items: [
          { text: '基礎概念 (Ch1-3)', link: '/課程/01-01-what-are-agent-skills' },
          { text: '動手實作 (Ch4-6)', link: '/課程/02-01-quickstart' },
          { text: '撰寫心法 (Ch7-10)', link: '/課程/03-01-best-practices' },
          { text: '測試驗證 (Ch11-12)', link: '/課程/04-01-eval-system-design' },
          { text: '生態整合 (Ch13-15)', link: '/課程/05-01-client-landscape' },
          { text: '發布貢獻 (Ch16-17)', link: '/課程/06-01-distribution' }
        ]
      },
      { text: '🗺️ 學習路線', link: '/study-guide' },
      { text: '🛠️ 推薦資源', link: '/資源/tools' },
      { text: '↗ Leo Lab', link: 'https://leo-laboratory.com' }
    ],

    // 側邊欄（單一篇時顯示上一篇/下一篇）
    sidebar: {
      '/秘笈/': [
        {
          text: '📖 秘笈快速入門',
          collapsed: false,
          items: [
            { text: 'S1: Agent Skills 是什麼？', link: '/秘笈/01-what-are-agent-skills' },
            { text: 'S2: SKILL.md 格式 3 分鐘', link: '/秘笈/02-skills-md-format' },
            { text: 'S3: Description 觸發優化', link: '/秘笈/03-description-optimization' },
            { text: 'S4: 7 個高效率套路', link: '/秘笈/04-instruction-patterns' },
            { text: 'S5: 從零到發布實戰', link: '/秘笈/05-zero-to-publish' },
            { text: 'S6: 生態系速覽', link: '/秘笈/06-ecosystem-tour' }
          ]
        }
      ],
      '/課程/': [
        {
          text: '📚 課程完整學習',
          items: [
            {
              text: '基礎概念',
              collapsed: false,
              items: [
                { text: 'Ch1: Agent Skills 是什麼？', link: '/課程/01-01-what-are-agent-skills' },
                { text: 'Ch2: 三層漸進式揭露', link: '/課程/01-02-progressive-disclosure' },
                { text: 'Ch3: Skills vs Tools vs MCP', link: '/課程/01-03-why-skills' }
              ]
            },
            {
              text: '動手實作',
              collapsed: true,
              items: [
                { text: 'Ch4: 從零建置第一個 Skill', link: '/課程/02-01-quickstart' },
                { text: 'Ch5: SKILL.md 完整參考', link: '/課程/02-02-skills-md-reference' },
                { text: 'Ch6: 跨平台測試', link: '/課程/02-03-multi-client-testing' }
              ]
            },
            {
              text: '撰寫心法',
              collapsed: true,
              items: [
                { text: 'Ch7: 最佳實務', link: '/課程/03-01-best-practices' },
                { text: 'Ch8: Description 優化', link: '/課程/03-02-description-optimization' },
                { text: 'Ch9: 使用 Scripts', link: '/課程/03-03-using-scripts' },
                { text: 'Ch10: 大型 Skill 架構', link: '/課程/03-04-large-skill-architecture' }
              ]
            },
            {
              text: '測試驗證',
              collapsed: true,
              items: [
                { text: 'Ch11: Eval 系統設計', link: '/課程/04-01-eval-system-design' },
                { text: 'Ch12: 評估與迭代', link: '/課程/04-02-grading-and-iteration' }
              ]
            },
            {
              text: '生態整合',
              collapsed: true,
              items: [
                { text: 'Ch13: 平台生態總覽', link: '/課程/05-01-client-landscape' },
                { text: 'Ch14: API 與 MCP 整合', link: '/課程/05-02-api-integration' },
                { text: 'Ch15: Skills+MCP+Subagents', link: '/課程/05-03-skills-mcp-subagents' }
              ]
            },
            {
              text: '發布貢獻',
              collapsed: true,
              items: [
                { text: 'Ch16: 發布與分享', link: '/課程/06-01-distribution' },
                { text: 'Ch17: 社群與貢獻', link: '/課程/06-02-contributing' }
              ]
            }
          ]
        }
      ],
      '/資源/': [
        {
          text: '🛠️ 推薦資源',
          items: [
            { text: '推薦工具', link: '/資源/tools' }
          ]
        }
      ]
    },

    // 社群連結
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ],

    // 頁尾
    footer: {
      message: '免費公開教學資源 · 繁體中文 Agent Skills 課程',
      copyright: 'Copyright © 2026 Leo Laboratory'
    },

    // 上一篇 / 下一篇
    docFooter: {
      prev: '← 上一篇',
      next: '下一篇 →'
    },

    // 最後更新
    lastUpdated: {
      text: '最後更新',
      formatOptions: { dateStyle: 'medium' }
    },

    // 大綱
    outline: {
      level: [2, 3],
      label: '本頁導覽'
    },

    // 搜尋
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜尋', buttonAriaLabel: '搜尋' },
          modal: {
            noResultsText: '找不到相關結果',
            resetButtonTitle: '清除搜尋',
            footer: {
              selectText: '選擇',
              navigateText: '切換'
            }
          }
        }
      }
    },

    // 外部連結圖示
    externalLinkIcon: true
  },

  // ============================================================
  // Build Config
  // ============================================================
  markdown: {
    lineNumbers: true
  },

  // Clean URLs (Vercel 支援)
  cleanUrls: true,

  // 忽略死連結
  ignoreDeadLinks: true
}
