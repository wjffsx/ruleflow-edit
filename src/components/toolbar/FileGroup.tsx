import { FilePlus, FolderOpen, Save } from 'lucide-preact'
import { lfInstance, chainName, nodeCount, edgeCount } from '../../store'
// P0-opt: 直接从具体文件导入，避免 services/index.ts 被静态导入
import { showSuccess, showWarning } from '../../services/toastService'
import { t } from '../../i18n'
import {
  isValidGraphData,
  safeJsonParse,
  RuleFlowError,
  ERROR_CODES,
  buildSemanticDocument,
  buildViewDocument,
  downloadAsJsonPair,
  mergeFromSemanticAndView,
  loadViewFromLocalStorage,
  saveViewToLocalStorage,
  validateSemanticDocument,
} from '../../utils'
import { ToolbarBtn } from './ToolbarBtn'

export function FileGroup() {
  return (
    <div class="flex items-center gap-px">
      <ToolbarBtn
        icon={FilePlus}
        title={t('toolbar.new')}
        onClick={() => {
          const lf = lfInstance.value
          if (lf) {
            lf.clearData()
            lf.render({ nodes: [], edges: [] } as any)
            chainName.value = '未命名规则链'
            nodeCount.value = 0
            edgeCount.value = 0
            showSuccess('已创建新规则链')
          }
        }}
      />
      <ToolbarBtn
        icon={FolderOpen}
        title={t('toolbar.open')}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = '.json'
          input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (file) {
              const reader = new FileReader()
              reader.onload = (event) => {
                const raw = event.target?.result as string
                const data = safeJsonParse(raw, isValidGraphData)
                if (!data) {
                  showWarning('文件格式不正确：缺少 nodes/edges')
                  return
                }
                const lf = lfInstance.value
                if (!lf) return

                const obj = data as Record<string, unknown>
                const nodes = (obj.nodes as Array<Record<string, unknown>>) || []
                const edges = (obj.edges as Array<Record<string, unknown>>) || []

                // 检测是否为语义文档（v2 双文件格式）
                const isSemantic = obj.version === '2.0' && nodes.length > 0 && nodes[0].x === undefined

                if (isSemantic) {
                  // 加载语义文档 + 视图文档（localStorage 兜底）
                  const chainId = (obj.chainId as string) || ''
                  const view = loadViewFromLocalStorage(chainId)
                  const merged = mergeFromSemanticAndView(obj as any, view)
                  lf.render(merged as any)
                  chainName.value = (obj.chainName as string) || file.name.replace(/\.rules\.json$/, '').replace('.json', '') || '未命名规则链'
                } else {
                  // 旧版单文件格式
                  lf.render({ nodes, edges } as any)
                  chainName.value =
                    (obj.chainName as string) || file.name.replace('.json', '') || '未命名规则链'
                }
                nodeCount.value = nodes.length || 0
                edgeCount.value = edges.length || 0
                showSuccess(`已加载规则链: ${chainName.value}`)
              }
              reader.readAsText(file)
            }
          }
          input.click()
        }}
      />
      <ToolbarBtn
        icon={Save}
        title={t('toolbar.save')}
        onClick={() => {
          const lf = lfInstance.value
          if (!lf) return
          try {
            const name = chainName.value || '未命名规则链'
            // 阶段 2: 拆分语义/视图，下载双文件
            const semantic = buildSemanticDocument(lf, name)
            const view = buildViewDocument(lf, name)

            // 阶段 4.2: 语义文档强校验（开发环境）
            if (import.meta.env.DEV) {
              const v = validateSemanticDocument(semantic)
              if (!v.valid) {
                console.warn('[RuleFlow] 语义校验失败:', v.errors)
              }
            }

            // 阶段 4.1: 视图态本地化（自动恢复）
            saveViewToLocalStorage(view, name)

            // 阶段 2: 输出双文件（语义 + 视图）
            downloadAsJsonPair(semantic, view, name)
            showSuccess('规则链已保存（语义+视图）')
          } catch (err) {
            const error = new RuleFlowError('文件保存失败', ERROR_CODES.FILE_OPERATION, {
              cause: err,
            })
            showWarning('保存失败')
            if (import.meta.env.DEV) console.warn(error)
            throw error
          }
        }}
      />
    </div>
  )
}
