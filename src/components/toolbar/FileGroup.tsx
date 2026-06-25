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
  buildRuleflowDocument,
  buildSemanticDocument,
  buildViewDocument,
  downloadAsJsonFile,
  readJsonFile,
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
                const data = safeJsonParse(event.target?.result as string, isValidGraphData)
                if (!data) {
                  showWarning('文件格式不正确：缺少 nodes/edges')
                  return
                }
                const lf = lfInstance.value
                if (lf) {
                  lf.render(data as any)
                  chainName.value =
                    (data.chainName as string) || file.name.replace('.json', '') || '未命名规则链'
                  nodeCount.value = data.nodes?.length || 0
                  edgeCount.value = data.edges?.length || 0
                  showSuccess(`已加载规则链: ${chainName.value}`)
                }
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

            // 旧版兼容：仍输出单文件（迁移期）
            const doc = buildRuleflowDocument(lf, name)
            downloadAsJsonFile(doc)
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
