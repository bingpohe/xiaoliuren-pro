/**
 * 小六壬 Pro - 应用主入口
 *
 * 职责：
 * - 应用初始化和生命周期管理
 * - 模块协调与依赖注入
 * - 事件总线（统一事件分发）
 * - PWA 安装逻辑
 *
 * 架构模式：
 * - 单例模式：全局应用实例
 * - 观察者模式：事件驱动的模块通信
 * - 依赖注入：通过构造函数注入依赖
 */

import { CONFIG, getAppVersion } from './config.js'
import { solarToLunar, getCurrentShiChen } from './lunar-engine.js'
import { calculate, CalculationInputError } from './calculator.js'
import { SHI_CHEN } from './data.js'
import { getAnimationController, AnimationState } from './animation.js'
import { createUIController } from './ui-controller.js'

/**
 * 应用状态枚举
 */
const AppState = {
  INITIALIZING: 'initializing',
  READY: 'ready',
  CALCULATING: 'calculating',
  ERROR: 'error'
}

/**
 * 小六壬 Pro 主应用类
 */
class XiaoliurenApp {
  constructor() {
    this.state = AppState.INITIALIZING
    this.ui = null
    this.animation = null

    // 绑定方法上下文
    this._handleCalculation = this._handleCalculation.bind(this)
    this._handleAutoTime = this._handleAutoTime.bind(this)
    this._handleNumberMethod = this._handleNumberMethod.bind(this)
  }

  /**
   * 初始化应用
   */
  async init() {
    try {
      console.log(`🏮 ${getAppVersion()} 正在启动...`)

      // 1. 初始化 UI 控制器
      this.ui = createUIController()

      // 2. 获取动画控制器（单例）
      this.animation = getAnimationController()

      // 3. 绑定 UI 事件
      this._bindEvents()

      // 4. 更新时间显示
      this._updateAutoTime()

      // 5. 设置定时器更新时间
      this._startTimeUpdater()

      // 6. 注册 PWA Service Worker
      this._registerServiceWorker()

      // 7. 设置 PWA 安装提示
      this._setupPWAInstall()

      // 标记就绪
      this.state = AppState.READY
      console.log(`✅ ${getAppVersion()} 启动完成`)

      // 触发就绪事件
      window.dispatchEvent(new CustomEvent('app:ready'))
    } catch (error) {
      this.state = AppState.ERROR
      console.error('❌ 应用初始化失败:', error)
      this._showError('应用初始化失败，请刷新页面重试')
    }
  }

  /**
   * 绑定所有 UI 事件
   */
  _bindEvents() {
    const ui = this.ui

    // 手动推算按钮
    const btnCalc = ui.getElement('btnCalc')
    if (btnCalc) {
      btnCalc.addEventListener('click', () => {
        this._handleCalculation('lunar')
      })
    }

    // 使用当前时间按钮
    const btnAuto = ui.getElement('btnAuto')
    if (btnAuto) {
      btnAuto.addEventListener('click', () => {
        this._updateAutoTime()
        this._handleCalculation('lunar')
      })
    }

    // 三数报数法按钮
    const btnNumber = ui.getElement('btnNumber')
    if (btnNumber) {
      btnNumber.addEventListener('click', () => {
        this._handleCalculation('number')
      })
    }

    // 数字输入框回车键支持
    ['num1', 'num2', 'num3'].forEach((id) => {
      const input = ui.getElement(id)
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && btnNumber) {
            btnNumber.click()
          }
        })
      }
    })

    // 点击日期区域刷新时间
    const autoDateEl = ui.getElement('autoDate')
    if (autoDateEl) {
      autoDateEl.addEventListener('click', () => {
        this._updateAutoTime()
      })
    }

    // 动画事件监听
    this.animation.on('complete', ({ resultIdx }) => {
      this.ui.vibrate()
    })
  }

  /**
   * 处理推算请求（核心业务流程）
   * @param {'lunar'|'number'} mode - 推算模式
   */
  async _handleCalculation(mode) {
    if (this.state === AppState.CALCULATING) {
      console.warn('推算进行中，请稍候...')
      return
    }

    try {
      this.state = AppState.CALCULATING

      // 1. 获取并验证输入
      const { valid, data, errors } = this.ui.getInputValues(mode)

      if (!valid) {
        throw new Error(errors.join('; '))
      }

      // 2. 执行推算算法
      let result
      if (mode === 'lunar') {
        result = calculate(data.month, data.day, data.hour)
      } else {
        result = calculate(data.first, data.second, data.third)
      }

      // 3. 重置 UI 状态
      this.ui.clearAllHighlights()
      this.ui.hideResultCard()

      // 4. 更新步骤指示器标签
      const isNumberMode = mode === 'number'
      this.ui.updateStepIndicator(1, null, isNumberMode ? '数1' : '月')
      this.ui.updateStepIndicator(2, null, isNumberMode ? '数2' : '日')
      this.ui.updateStepIndicator(3, null, isNumberMode ? '数3' : '时')

      // 5. 执行动画序列
      await this._playAnimationSequence(result, isNumberMode)

      // 6. 显示结果
      this.ui.showResultCard(result, isNumberMode, data)

      this.state = AppState.READY
    } catch (error) {
      this.state = AppState.ERROR
      console.error('推算错误:', error)
      this._showError(error.message || '推算失败，请重试')
    }
  }

  /**
   * 播放完整的推算动画序列
   * @param {object} result - 推算结果
   * @param {boolean} isNumberMode - 是否为报数法
   */
  async _playAnimationSequence(result, isNumberMode) {
    const steps = result.steps
    const timing = CONFIG.ANIMATION.TIMING

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]

      // 更新当前步骤指示器
      this.ui.updateStepIndicator(i + 1, 'current')

      // 播放该步动画
      await this.animation.play({
        fromIdx: step.from,
        count: step.count,
        resultIdx: step.result,
        onTick: (pos, className) => {
          this.ui.setPalaceHighlight(pos, className)
        }
      })

      // 标记步骤完成
      this.ui.updateStepIndicator(i + 1, 'done')

      // 步骤间停顿
      if (i < steps.length - 1) {
        await this._sleep(timing.STEP_PAUSE)
      }
    }

    // 最终结果高亮
    await this._sleep(timing.RESULT_DELAY)
    this.ui.clearAllHighlights()
    this.ui.setPalaceHighlight(result.resultPos, CONFIG.ANIMATION.CLASSES.RESULT)
  }

  /**
   * 使用当前时间自动推算
   */
  _handleAutoTime() {
    this._updateAutoTime()
    this._handleCalculation('lunar')
  }

  /**
   * 三数报数法推算
   */
  _handleNumberMethod() {
    this._handleCalculation('number')
  }

  /**
   * 更新自动时间显示
   */
  _updateAutoTime() {
    try {
      const now = new Date()
      const lunar = solarToLunar(now)
      const shiChenIndex = getCurrentShiChen(now)
      this.ui.updateAutoTime(lunar, shiChenIndex)
    } catch (error) {
      console.warn('更新时间失败:', error)
    }
  }

  /**
   * 启动定时器，每分钟更新时间
   */
  _startTimeUpdater() {
    setInterval(() => {
      this._updateAutoTime()
    }, 60000) // 每分钟更新一次
  }

  /**
   * 注册 Service Worker
   */
  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => {
          console.warn('Service Worker 注册失败:', error)
        })
      })
    }
  }

  /**
   * 设置 PWA 安装提示
   */
  _setupPWAInstall() {
    let deferredPrompt = null

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e

      setTimeout(() => {
        if (deferredPrompt) {
          this.ui.showInstallBanner(true)
        }
      }, CONFIG.PWA.INSTALL_BANNER_DELAY)
    })

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null
      this.ui.showInstallBanner(false)
      console.log('📲 小六壬 Pro 已安装到主屏幕')
    })

    // 点击安装横幅触发安装
    const banner = this.ui.getElement('installBanner')
    if (banner) {
      banner.addEventListener('click', async () => {
        if (deferredPrompt) {
          deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice
          if (outcome === 'accepted') {
            console.log('用户接受了安装')
          }
          deferredPrompt = null
          this.ui.showInstallBanner(false)
        }
      })
    }

    // 如果已在独立模式运行，隐藏安装横幅
    if (window.matchMedia('(display-mode: standalone)').matches) {
      this.ui.showInstallBanner(false)
    }
  }

  /**
   * 显示错误信息给用户
   * @param {string} message - 错误消息
   */
  _showError(message) {
    alert(`⚠️ ${message}`)
  }

  /**
   * Promise 化的延迟函数
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise}
   */
  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * 销毁应用实例
   */
  destroy() {
    if (this.animation) {
      this.animation.destroy()
    }
    if (this.ui) {
      this.ui.destroy()
    }
    this.state = AppState.ERROR
  }
}

// ==================== 应用启动 ====================
let appInstance = null

/**
 * 获取应用单例
 * @returns {XiaoliurenApp}
 */
export function getApp() {
  if (!appInstance) {
    appInstance = new XiaoliurenApp()
  }
  return appInstance
}

// DOM 加载完成后自动初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    getApp().init()
  })
} else {
  getApp().init()
}

export default XiaoliurenApp