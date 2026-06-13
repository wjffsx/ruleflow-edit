import i18next from 'i18next'

const resources = {
  zh: {
    translation: {
      // Navbar
      'nav.brand': 'RuleFlow Editor',
      'nav.search': '搜索 (Ctrl+K)',
      'nav.theme': '切换主题',
      // Toolbar
      'toolbar.file': '文件',
      'toolbar.edit': '编辑',
      'toolbar.run': '运行',
      'toolbar.view': '视图',
      'toolbar.layout': '布局',
      'toolbar.new': '新建',
      'toolbar.open': '打开',
      'toolbar.save': '保存',
      'toolbar.undo': '撤销',
      'toolbar.redo': '重做',
      'toolbar.start': '运行',
      'toolbar.stop': '停止',
      'toolbar.reset': '重置',
      'toolbar.fullscreen': '全屏',
      'toolbar.outline': '大纲',
      'toolbar.minimap': '小地图',
      'toolbar.autolayout': '自动布局',
      // Sidebar
      'sidebar.search': '搜索组件...',
      'sidebar.favorites': '常用',
      'sidebar.marketplace': '组件市场',
      'sidebar.noResults': '未找到匹配组件',
      // Panel
      'panel.properties': '属性',
      'panel.debug': '调试',
      'panel.outline': '大纲',
      'panel.basicConfig': '基础配置',
      'panel.componentConfig': '组件配置',
      'panel.connections': '连接关系',
      'panel.addRelation': '+ 添加关系',
      'panel.mode.fixed': '固定',
      'panel.mode.floating': '浮动',
      'panel.mode.inline': '内联',
      // Status
      'status.editing': '编辑中',
      'status.running': '运行中',
      'status.deployed': '已部署',
      'status.disabled': '已禁用',
      'status.zoom': '缩放',
      'status.nodes': '节点',
      'status.connections': '连接',
      'status.unsaved': '未保存',
      // Canvas
      'canvas.empty.title': '开始创建规则链',
      'canvas.empty.desc': '从左侧面板拖拽组件到画布，或双击组件添加',
      // Nodes
      'node.priority': 'P',
      'node.enabled': '启用',
      'node.debugMode': '调试模式',
      // Debug
      'debug.controls': '运行控制',
      'debug.nodeStates': '节点状态',
      'debug.breakpoints': '断点',
      'debug.log': '执行日志',
      'debug.success': '成功',
      'debug.failure': '失败',
      'debug.processing': '处理中',
      'debug.run': '运行',
      'debug.pause': '暂停',
      'debug.resume': '继续',
      'debug.stop': '停止',
      'debug.step': '单步执行',
      // Relation types
      'relation.True': 'True',
      'relation.False': 'False',
      'relation.Success': 'Success',
      'relation.Failure': 'Failure',
      'relation.Custom': '自定义',
      'relation.selectType': '选择关系类型',
      // Command palette
      'cmd.placeholder': '输入命令或搜索...',
      'cmd.noResults': '未找到匹配命令',
      // Search
      'search.nodes': '搜索节点...',
      'search.noResults': '无结果',
    },
  },
  en: {
    translation: {
      'nav.brand': 'RuleFlow Editor',
      'nav.search': 'Search (Ctrl+K)',
      'nav.theme': 'Toggle theme',
      'toolbar.file': 'File',
      'toolbar.edit': 'Edit',
      'toolbar.run': 'Run',
      'toolbar.view': 'View',
      'toolbar.layout': 'Layout',
      'sidebar.search': 'Search components...',
      'sidebar.favorites': 'Favorites',
      'sidebar.marketplace': 'Marketplace',
      'panel.properties': 'Properties',
      'panel.debug': 'Debug',
      'panel.outline': 'Outline',
      'status.editing': 'Editing',
      'status.running': 'Running',
      'status.deployed': 'Deployed',
      'status.disabled': 'Disabled',
      'canvas.empty.title': 'Start building your rule chain',
      'canvas.empty.desc': 'Drag components from the sidebar or double-click to add',
      'debug.controls': 'Controls',
      'debug.nodeStates': 'Node States',
      'debug.log': 'Execution Log',
    },
  },
}

i18next.init({
  resources,
  lng: localStorage.getItem('rf-lang') || 'zh',
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
})

export default i18next
export const t = i18next.t.bind(i18next)
