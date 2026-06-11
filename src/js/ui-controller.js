/**
 * 小六壬 Pro - UI 控制器
 *
 * 职责：
 * - DOM 引用缓存（避免重复查询）
 * - 用户输入验证和错误提示
 * - 结果卡片生成和显示
 * - 历史记录管理（LocalStorage）
 * - 无障碍支持（ARIA、键盘导航）
 *
 * 设计原则：
 * - 单一职责：只负责UI交互，不包含业务逻辑
 * - 缓存优先：初始化时缓存所有常用 DOM 元素
 * - 错误友好：所有用户操作都有反馈
 */

import { CONFIG } from './config.js'
import { SHI_CHEN, PALACES } from './data.js'

/**
 * 自定义错误类：UI 操作错误
 */
class UIError extends Error {
  constructor(message, { element, action } = {}) {
    super(message)
    this.name = 'UIError'
    this.element = element
    this.action = action
  }
}

/**
 * UI 控制器类
 */
class UIController {
  constructor() {
    this._domCache = new Map()
    this._isAnimating = false
    this._history = []
    this._init()
  }

  /**
   * 初始化：缓存 DOM 引用、绑定基础事件
   */
  _init() {
    try {
      this._cacheDOMReferences()
      this._populateSelects()
      this._loadHistory()
      this._setupAccessibility()
    } catch (error) {
      console.error('UI Controller 初始化失败:', error)
      throw new UIError('UI 初始化失败', { action: 'init' })
    }
  }

  /**
   * 缓存所有常用的 DOM 元素引用
   */
  _cacheDOMReferences() {
    const selectors = {
      // 输入控件
      lunarMonth: '#lunarMonth',
      lunarDay: '#lunarDay',
      lunarHour: '#lunarHour',
      num1: '#num1',
      num2: '#num2',
      num3: '#num3',

      // 按钮
      btnCalc: '#btnCalc',
      btnAuto: '#btnAuto',
      btnNumber: '#btnNumber',

      // 显示区域
      autoDate: '#autoDate',
      autoTime: '#autoTime',
      circleContainer: '#circleContainer',
      resultCard: '#resultCard',

      // 步骤指示器
      step1: '#step1',
      step2: '#step2',
      step3: '#step3',

      // 安装横幅
      installBanner: '#installBanner',

      // 六宫格
      palaces: '.palace'
    }

    for (const [key, selector] of Object.entries(selectors)) {
      const element = document.querySelector(selector)
      if (!element) {
        console.warn(`UI 元素未找到: ${selector}`)
        continue
      }
      this._domCache.set(key, element)
    }

    // 特殊处理：缓存所有宫格元素
    const palaceElements = document.querySelectorAll('.palace')
    this._domCache.set('palaceArray', Array.from(palaceElements))
  }

  /**
   * ⭐ 核心方法：填充下拉选择框
   * 
   * 解决"年月日没有数据"的根本方法
   * 负责填充：
   * - 农历月（正月~腊月，12个选项）
   * - 农历日（初一~三十，30个选项）
   * - 时辰（子时~亥时，12个选项）
   */
  _populateSelects() {
    console.log('[UI] 📋 开始填充下拉选择框...')
    
    const monthSel = this.getElement('lunarMonth')
    const daySel = this.getElement('lunarDay')
    const hourSel = this.getElement('lunarHour')

    // 验证元素存在
    if (!monthSel || !daySel || !hourSel) {
      console.error('[UI] ❌ 找不到下拉选择框元素！', { monthSel, daySel, hourSel })
      return
    }

    try {
      // ===== 1. 填充农历月 =====
      monthSel.innerHTML = ''  // 清空现有选项
      for (let i = 1; i <= 12; i++) {
        const option = document.createElement('option')
        option.value = i
        // 特殊月份名称：正月、冬月、腊月
        let monthName
        if (i === 1) monthName = '正月'
        else if (i === 11) monthName = '冬月'
        else if (i === 12) monthName = '腊月'
        else monthName = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'][i-1] + '月'
        
        option.textContent = monthName
        monthSel.appendChild(option)
      }
      console.log(`[UI] ✅ 已填充 ${monthSel.options.length} 个月份选项`)

      // ===== 2. 填充农历日 =====
      daySel.innerHTML = ''
      const dayNames = ['', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
        '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
        '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十']
      
      for (let i = 1; i <= 30; i++) {
        const option = document.createElement('option')
        option.value = i
        option.textContent = dayNames[i]
        daySel.appendChild(option)
      }
      console.log(`[UI] ✅ 已填充 ${daySel.options.length} 个日期选项`)

      // ===== 3. 填充十二时辰 =====
      hourSel.innerHTML = ''
      SHI_CHEN.forEach((sc) => {
        const option = document.createElement('option')
        option.value = sc.hour
        option.textContent = `${sc.name} (${sc.range})`
        hourSel.appendChild(option)
      })
      console.log(`[UI] ✅ 已填充 ${hourSel.options.length} 个时辰选项`)

      // ===== 4. 设置默认值（当前时间）=====
      const now = new Date()
      const h = now.getHours()
      let currentShiChen
      
      if (h >= 23 || h < 1) currentShiChen = 1       // 子时
      else if (h < 3) currentShiChen = 2              // 丑时
      else if (h < 5) currentShiChen = 3              // 寅时
      else if (h < 7) currentShiChen = 4              // 卯时
      else if (h < 9) currentShiChen = 5              // 辰时
      else if (h < 11) currentShiChen = 6             // 巳时
      else if (h < 13) currentShiChen = 7             // 午时
      else if (h < 15) currentShiChen = 8             // 未时
      else if (h < 17) currentShiChen = 9             // 申时
      else if (h < 19) currentShiChen = 10            // 酉时
      else if (h < 21) currentShiChen = 11            // 戌时
      else currentShiChen = 12                        // 亥时

      // 设置默认选中值
      monthSel.value = 1           // 默认正月
      daySel.value = 1            // 默认初一
      hourSel.value = currentShiChen  // 当前时辰
      
      console.log(`[UI] ✅ 默认值已设置: 正月初一 ${SHI_CHEN[currentShiChen - 1].name}`)
      console.log('[UI] 🎉 下拉选择框填充完成！')
      
    } catch (error) {
      console.error('[UI] ❌ 填充下拉选择框失败:', error)
    }
  }

  /**
   * 获取缓存的 DOM 元素
   * @param {string} key - 元素键名
   * @returns {HTMLElement|null}
   */
  getElement(key) {
    return this._domCache.get(key) || null
  }

  /**
   * 获取用户输入值（带验证）
   * @param {'lunar'|'number'} mode - 输入模式
   * @returns {{ valid: boolean, data?: object, errors?: string[] }}
   */
  getInputValues(mode) {
    const errors = []

    if (mode === 'lunar') {
      const month = parseInt(this.getElement('lunarMonth')?.value)
      const day = parseInt(this.getElement('lunarDay')?.value)
      const hour = parseInt(this.getElement('lunarHour')?.value)

      if (!month || month < 1 || month > 12) errors.push('请选择有效的农历月份')
      if (!day || day < 1 || day > 30) errors.push('请选择有效的农历日期')
      if (!hour || hour < 1 || hour > 12) errors.push('请选择有效的时辰')

      if (errors.length > 0) {
        return { valid: false, errors }
      }

      return {
        valid: true,
        data: { month, day, hour, mode: 'lunar' }
      }
    }

    if (mode === 'number') {
      let n1 = parseInt(this.getElement('num1')?.value)
      let n2 = parseInt(this.getElement('num2')?.value)
      let n3 = parseInt(this.getElement('num3')?.value)

      // 空值自动随机填充
      if (!n1 || n1 < 1) n1 = Math.floor(Math.random() * 99) + 1
      if (!n2 || n2 < 1) n2 = Math.floor(Math.random() * 99) + 1
      if (!n3 || n3 < 1) n3 = Math.floor(Math.random() * 99) + 1

      // 回填到输入框
      if (this.getElement('num1')) this.getElement('num1').value = n1
      if (this.getElement('num2')) this.getElement('num2').value = n2
      if (this.getElement('num3')) this.getElement('num3').value = n3

      return {
        valid: true,
        data: { first: n1, second: n2, third: n3, mode: 'number' }
      }
    }

    return { valid: false, errors: ['无效的输入模式'] }
  }

  /**
   * 更新自动时间显示区
   * @param {object} lunar - 农历日期对象
   * @param {number} shiChenIndex - 时辰序号
   */
  updateAutoTime(lunar, shiChenIndex) {
    const autoDateEl = this.getElement('autoDate')
    const autoTimeEl = this.getElement('autoTime')

    if (autoDateEl) {
      autoDateEl.textContent = `${this._getStemBranch(lunar.year)} · ${this._formatLunarDate(lunar)}`
    }

    if (autoTimeEl && SHI_CHEN[shiChenIndex - 1]) {
      autoTimeEl.textContent = SHI_CHEN[shiChenIndex - 1].name
    }

    // 同步到下拉选择框
    if (this.getElement('lunarMonth')) this.getElement('lunarMonth').value = lunar.month
    if (this.getElement('lunarDay')) this.getElement('lunarDay').value = Math.min(lunar.day, 30)
    if (this.getElement('lunarHour')) this.getElement('lunarHour').value = shiChenIndex
  }

  /**
   * 设置/清除宫格高亮状态
   * @param {number} idx - 宫格索引 (1-6)
   * @param {string} className - CSS 类名
   */
  setPalaceHighlight(idx, className) {
    const palace = this._getPalaceElement(idx)
    if (!palace) return

    // 清除同类型的其他高亮
    if (className !== CONFIG.ANIMATION.CLASSES.TRAIL) {
      this._clearAllPalaceClass(className)
    }

    palace.classList.add(className)
  }

  /**
   * 清除所有宫格的高亮状态
   */
  clearAllHighlights() {
    const classes = Object.values(CONFIG.ANIMATION.CLASSES)
    const palaces = this.getElement('palaceArray') || []

    palaces.forEach((palace) => {
      classes.forEach((cls) => palace.classList.remove(cls))
    })
  }

  /**
   * 显示结果卡片
   * @param {object} result - 推算结果对象
   * @param {boolean} isNumberMethod - 是否为报数法
   * @param {object} input - 输入参数
   */
  showResultCard(result, isNumberMethod, input) {
    const card = this.getElement('resultCard')
    if (!card) return

    const p = result.result
    const isGood = p.fortune.includes('吉')

    card.innerHTML = this._generateResultHTML(p, isGood, isNumberMethod, input)
    card.classList.remove('hidden')
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    // 保存到历史记录
    this._saveToHistory({ result, input, timestamp: Date.now() })
  }

  /**
   * 隐藏结果卡片
   */
  hideResultCard() {
    const card = this.getElement('resultCard')
    if (card) card.classList.add('hidden')
  }

  /**
   * 显示/隐藏安装横幅
   * @param {boolean} show - 是否显示
   */
  showInstallBanner(show) {
    const banner = this.getElement('installBanner')
    if (banner) {
      banner.classList.toggle('show', show)
    }
  }

  /**
   * 更新步骤指示器
   * @param {number} step - 步骤编号 (1-3)
   * @param {'current'|'done'} state - 状态
   * @param {string} label - 标签文字
   */
  updateStepIndicator(step, state, label) {
    const stepEl = this.getElement(`step${step}`)
    if (!stepEl) return

    stepEl.classList.remove('current', 'done')
    if (state) stepEl.classList.add(state)
    if (label) stepEl.textContent = label
  }

  /**
   * 触发振动反馈
   */
  vibrate() {
    const canVibrate =
      navigator.vibrate &&
      !window.matchMedia(CONFIG.ACCESSIBILITY.REDUCED_MOTION_QUERY).matches

    if (canVibrate) {
      navigator.vibrate(CONFIG.ANIMATION.VIBRATION_PATTERN)
    }
  }

  /**
   * 获取历史记录
   * @returns {Array}
   */
  getHistory() {
    return [...this._history]
  }

  /**
   * 清空历史记录
   */
  clearHistory() {
    this._history = []
    try {
      localStorage.removeItem(CONFIG.STORAGE.HISTORY_KEY)
    } catch (e) {
      console.warn('无法清空本地存储:', e)
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 获取指定索引的宫格元素
   * @param {number} idx - 宫格索引 (1-6)
   * @returns {HTMLElement|null}
   */
  _getPalaceElement(idx) {
    return document.querySelector(`.palace-${idx}`)
  }

  /**
   * 清除所有宫格的指定类名
   * @param {string} className - CSS 类名
   */
  _clearAllPalaceClass(className) {
    const palaces = this.getElement('palaceArray') || []
    palaces.forEach((p) => p.classList.remove(className))
  }

  /**
   * 生成结果卡片的 HTML
   */
  _generateResultHTML(palace, isGood, isNumberMethod, input) {
    const fortuneClass = isGood ? 'fortune-good' : 'fortune-bad'
    const inputDesc = isNumberMethod
      ? `报数法：${input.first} → ${input.second} → ${input.third}`
      : `农历${this._formatChineseMonth(input.month)}${this._numToChinese(input.day)} ${SHI_CHEN[input.hour - 1]?.name || ''}`

    return `
      <div class="result-header">
        <div class="r-name">${palace.emoji} ${palace.name}</div>
        <div class="r-fortune ${fortuneClass}">${palace.fortune} · ${palace.sixGod} · 属${palace.element}</div>
        <div style="font-size:13px; opacity:0.7; margin-top:6px;">${inputDesc}</div>
      </div>

      <div class="result-body">
        <div class="r-section">
          ${this._generateInfoGrid(palace)}
        </div>

        <div class="detail-item" style="border-left-color: ${isGood ? 'var(--green)' : 'var(--red)'};">
          <div class="d-label">📖 掌诀总断</div>
          <div class="d-text">${palace.overview}</div>
        </div>

        <div class="koujue-box">
          <div class="koujue-title">📜 传统口诀</div>
          <div class="koujue-text">${palace.koujue.replace(/\n/g, '<br>')}</div>
        </div>

        <div class="section-title">🔍 各事项详解</div>
        <div class="detail-list">
          ${Object.entries(palace.details)
            .map(
              ([key, val]) => `
            <div class="detail-item">
              <div class="d-label">${this._getCategoryIcon(key)} ${key}</div>
              <div class="d-text">${val}</div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="fortune-meter">
          <div class="meter-label">吉凶指数</div>
          <div class="meter-bar">
            <div class="meter-fill ${isGood ? 'meter-good' : 'meter-bad'}" style="width:${(palace.fortuneLevel / 6) * 100}%"></div>
          </div>
          <div class="meter-stars">${palace.starRating} (${palace.fortuneLevel}/6)</div>
        </div>
      </div>
    `
  }

  /**
   * 生成基本信息网格 HTML
   */
  _generateInfoGrid(palace) {
    const items = [
      { label: '五行', value: `${palace.element} (${palace.elementColor})` },
      { label: '六神', value: palace.sixGod },
      { label: '方位', value: palace.direction },
      { label: '谋事主数', value: palace.numbers },
      { label: '贵人方', value: palace.nobleDirection },
      { label: '冲犯方', value: palace.conflictDirection }
    ]

    return items
      .map(
        (item) => `
        <div class="r-item">
          <div class="item-label">${item.label}</div>
          <div class="item-val">${item.value}</div>
        </div>
      `
      )
      .join('')
  }

  /**
   * 加载历史记录从 LocalStorage
   */
  _loadHistory() {
    try {
      const saved = localStorage.getItem(CONFIG.STORAGE.HISTORY_KEY)
      if (saved) {
        this._history = JSON.parse(saved)
      }
    } catch (e) {
      console.warn('加载历史记录失败:', e)
      this._history = []
    }
  }

  /**
   * 保存记录到历史
   */
  _saveToHistory(record) {
    this._history.unshift(record)

    // 限制最大数量
    if (this._history.length > CONFIG.STORAGE.MAX_HISTORY_ITEMS) {
      this._history = this._history.slice(0, CONFIG.STORAGE.MAX_HISTORY_ITEMS)
    }

    try {
      localStorage.setItem(CONFIG.STORAGE.HISTORY_KEY, JSON.stringify(this._history))
    } catch (e) {
      console.warn('保存历史记录失败:', e)
    }
  }

  /**
   * 设置基础无障碍属性
   */
  _setupAccessibility() {
    // 为按钮添加 aria-label
    const buttons = ['btnCalc', 'btnAuto', 'btnNumber']
    const labels = {
      btnCalc: '开始推算小六壬卦象',
      btnAuto: '使用当前时间自动推算',
      btnNumber: '使用三数报数法推算'
    }

    buttons.forEach((key) => {
      const btn = this.getElement(key)
      if (btn && labels[key]) {
        btn.setAttribute('aria-label', labels[key])
      }
    })

    // 为宫格添加 role 和 tabindex
    const palaces = this.getElement('palaceArray') || []
    palaces.forEach((palace, idx) => {
      palace.setAttribute('role', 'img')
      palace.setAttribute('tabindex', '0')
      palace.setAttribute('aria-label', `第${idx + 1}宫`)
    })
  }

  // ==================== 工具方法 ====================

  /**
   * 数字转中文（1-30）
   */
  _numToChinese(n) {
    const chars = [
      '',
      '一',
      '二',
      '三',
      '四',
      '五',
      '六',
      '七',
      '八',
      '九',
      '十',
      '十一',
      '十二',
      '十三',
      '十四',
      '十五',
      '十六',
      '十七',
      '十八',
      '十九',
      '二十',
      '廿一',
      '廿二',
      '廿三',
      '廿四',
      '廿五',
      '廿六',
      '廿七',
      '廿八',
      '廿九',
      '三十'
    ]
    return chars[n] || String(n)
  }

  /**
   * 月份数字转中文显示名
   */
  _formatChineseMonth(m, isLeap = false) {
    const prefix = isLeap ? '闰' : ''
    if (m === 1) return prefix + '正月'
    if (m === 11) return prefix + '冬月'
    if (m === 12) return prefix + '腊月'
    return prefix + this._numToChinese(m) + '月'
  }

  /**
   * 格式化农历日期显示
   */
  _formatLunarDate(lunar) {
    return `${this._formatChineseMonth(lunar.month, lunar.isLeap)}${this._numToChinese(lunar.day)}`
  }

  /**
   * 获取干支纪年字符串（简化版，避免循环依赖）
   */
  _getStemBranch(year) {
    const stems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
    const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
    const zodiac = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
    const s = stems[(year - 4) % 10]
    const b = branches[(year - 4) % 12]
    const z = zodiac[(year - 4) % 12]
    return `${s}${b}年 [${z}]`
  }

  /**
   * 获取分类图标
   */
  _getCategoryIcon(key) {
    const icons = {
      总体运程: '🔮',
      事业工作: '💼',
      财运求财: '💰',
      感情婚姻: '💕',
      健康疾病: '🏥',
      失物寻物: '🔍',
      行人出行: '🚶',
      官非诉讼: '⚖️',
      交易买卖: '🤝',
      田宅家宅: '🏠'
    }
    return icons[key] || '📌'
  }

  /**
   * 销毁 UI 控制器
   */
  destroy() {
    this._domCache.clear()
    this._history = []
  }
}

// 导出工厂函数
export function createUIController() {
  return new UIController()
}

export default UIController