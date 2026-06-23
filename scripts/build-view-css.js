/**
 * Build view.css — minimal CSS for read-only visualization mode.
 * This script copies src/view.css to dist/view.css and injects theme tokens.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')
const srcPath = join(rootDir, 'src', 'view.css')
const distPath = join(rootDir, 'dist', 'view.css')
const tokensPath = join(rootDir, 'src', 'theme', 'tokens.css')

// Ensure dist directory exists
if (!existsSync(join(rootDir, 'dist'))) {
  mkdirSync(join(rootDir, 'dist'), { recursive: true })
}

// Read view.css
let viewCss = readFileSync(srcPath, 'utf-8')

// Read tokens.css and extract only the CSS variables (not @theme blocks)
const tokensCss = readFileSync(tokensPath, 'utf-8')

// Inject tokens at the top of view.css
const injectedCss = `/* RuleFlow Editor — View CSS (minimal) */
/* Auto-generated from src/view.css + src/theme/tokens.css */

/* Theme Tokens */
${tokensCss}

/* View-specific Styles */
${viewCss}
`

// Write to dist
writeFileSync(distPath, injectedCss, 'utf-8')

console.log('[build-view-css] Generated dist/view.css')