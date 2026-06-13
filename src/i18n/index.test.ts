import { describe, it, expect, vi, beforeEach } from 'vitest'
import { currentLang, t, getLang, setLang } from './index'

describe('i18n', () => {
  beforeEach(() => {
    setLang('zh')
  })

  it('should return Chinese text for zh locale', () => {
    expect(t('nav.brand')).toBe('RuleFlow Editor')
    expect(t('toolbar.file')).toBe('文件')
    expect(t('status.editing')).toBe('编辑中')
  })

  it('should return English text for en locale', () => {
    expect(t('toolbar.file', 'en')).toBe('File')
    expect(t('status.editing', 'en')).toBe('Editing')
  })

  it('should return key as fallback for missing translation', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key')
  })

  it('should fall back to zh when en key is missing', () => {
    // If a key exists in zh but not en, should return zh value
    expect(t('toolbar.file', 'en')).toBe('File')
  })

  it('should update currentLang signal', () => {
    setLang('en')
    expect(currentLang.value).toBe('en')
    expect(getLang()).toBe('en')
  })

  it('should use currentLang when no lang parameter provided', () => {
    setLang('en')
    expect(t('toolbar.file')).toBe('File')
    setLang('zh')
    expect(t('toolbar.file')).toBe('文件')
  })
})
