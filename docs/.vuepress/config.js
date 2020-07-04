module.exports = {
	"title": "React 技术揭秘",
	"description": "React源码解析",
	"dest": "dist",
	"serviceWorker": false,
	"configureWebpack": {
		"resolve": {
			"alias": {}
		}
	},
	"themeConfig": {
		"repo": "BetaSu/just-react",
		"repoLabel": "点亮⭐不迷路",
		"editLinks": true,
		"docsDir": "docs",
		"editLinkText": "为该章节纠错",
		"lastUpdated": "上次更新",
		"nav": [
			{
				"text": "🙋‍♂️ 一起学习",
				"link": "/me"
			}
		],
		"sidebar": [
			[
				"/",
				"前言"
			],
			{
				"title": "第一章 前置知识",
				"collapsable": true,
				"children": [
					[
						"/preparation/idea",
						"React理念"
					],
					[
						"/preparation/oldConstructure",
						"老的React架构"
					],
					[
						"/preparation/newConstructure",
						"新的React架构"
					],
					[
						"/preparation/file",
						"源码的文件结构"
					],
					[
						"/preparation/source",
						"调试源码"
					],
					[
						"/preparation/jsx",
						"深入理解JSX"
					],
					[
						"/preparation/summary",
						"总结"
					]
				]
			},
			{
				"title": "第二章 render阶段",
				"collapsable": true,
				"children": [
					[
						"/process/fiber",
						"Fiber架构"
					],
					[
						"/process/doubleBuffer",
						"双缓存机制"
					],
					[
						"/process/reconciler",
						"流程概览"
					],
					[
						"/process/beginWork",
						"beginWork"
					],
					[
						"/process/completeWork",
						"completeWork"
					]
				]
			},
			{
				"title": "第三章 commit阶段",
				"collapsable": true,
				"children": [
					[
						"/renderer/prepare",
						"流程概览"
					],
					[
						"/renderer/beforeMutation",
						"before mutation阶段"
					],
					[
						"/renderer/mutation",
						"mutation阶段"
					],
					[
						"/renderer/layout",
						"layout阶段"
					]
				]
			},
			{
				"title": "第四章 Diff算法",
				"collapsable": true,
				"children": [
					[
						"/diff/prepare",
						"概览"
					],
					[
						"/diff/one",
						"单节点Diff"
					],
					[
						"/diff/multi",
						"多节点Diff"
					]
				]
			},
			{
				"title": "第五章 状态更新",
				"collapsable": true,
				"children": [
					[
						"/state/prepare",
						"流程概览"
					],
					[
						"/state/update",
						"Update"
					]
				]
			}
		]
	},
	"base": ""
}