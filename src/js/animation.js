/**
 * 小六壬 Pro - 动画系统
 *
 * 重构改进：
 * - 使用 requestAnimationFrame 替代 setTimeout（与浏览器渲染同步）
 * - 支持取消动画（AbortController 模式）
 * - 尊重 prefers-reduced-motion 用户偏好
 * - 三段变速策略（起手慢 → 中段快 → 末段渐慢）
 *
 * 设计模式：
 * - 观察者模式：支持动画事件回调
 * - 策略模式：可配置不同的变速策略
 */

import { CONFIG } from './config.js'

/**
 * 动画状态枚举
 */
export const AnimationState = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}

/**
 * 动画控制器类
 * 管理六宫格推算动画的完整生命周期
 */
export class AnimationController {
  constructor() {
    this.state = AnimationState.IDLE
    this._animationFrameId = null
    this._abortController = null
    this._listeners = new Map()
    this._reducedMotion = window.matchMedia(CONFIG.ACCESSIBILITY.REDUCED_MOTION_QUERY).matches

    // 监听 reduced-motion 偏好变化
    window
      .matchMedia(CONFIG.ACCESSIBILITY.REDUCED_MOTION_QUERY)
      .addEventListener('change', (e) => {
        this._reducedMotion = e.matches
      })
  }

  /**
   * 获取当前动画状态
   */
  get currentState() {
    return this.state
  }

  /**
   * 注册事件监听器
   * @param {string} event - 事件名称 (stepStart | stepEnd | complete | error)
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, [])
    }
    this._listeners.get(event).push(callback)
    return this // 支持链式调用
  }

  /**
   * 移除事件监听器
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    const listeners = this._listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) listeners.splice(index, 1)
    }
    return this
  }

  /**
   * 触发事件
   * @param {string} event - 事件名称
   * @param {*} data - 事件数据
   */
  _emit(event, data) {
    const listeners = this._listeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Animation event handler error [${event}]:`, error)
        }
      })
    }
  }

  /**
   * 执行推算动画（核心方法）
   *
   * @param {object} params - 动画参数
   * @param {number} params.fromIdx - 起始位置 (1-6)
   * @param {number} params.count - 总步数
   * @param {number} params.resultIdx - 最终落点位置 (1-6)
   * @param {Function} params.onTick - 每帧回调 (currentPosition) => void
   * @returns {Promise<void>} 动画完成时 resolve
   */
  async play({ fromIdx, count, resultIdx, onTick }) {
    if (this.state === AnimationState.RUNNING) {
      throw new Error('动画正在运行中，请先停止当前动画')
    }

    // 如果用户偏好减少动效，直接跳到结果
    if (this._reducedMotion) {
      onTick(resultIdx, CONFIG.ANIMATION.CLASSES.RESULT)
      this.state = AnimationState.COMPLETED
      this._emit('complete', { resultIdx })
      return
    }

    this.state = AnimationState.RUNNING
    this._abortController = new AbortController()

    const { signal } = this._abortController
    const timing = CONFIG.ANIMATION.TIMING
    let current = fromIdx
    let n = 1
    const visited = []

    return new Promise((resolve) => {
      const startTime = performance.now()

      const tick = (timestamp) => {
        if (signal.aborted) {
          this.state = AnimationState.CANCELLED
          resolve()
          return
        }

        if (n > count) {
          // 动画完成
          onTick(resultIdx, CONFIG.ANIMATION.CLASSES.RESULT)
          this.state = AnimationState.COMPLETED
          this._emit('complete', { resultIdx, duration: timestamp - startTime })
          resolve()
          return
        }

        // 更新当前位置
        onTick(current, CONFIG.ANIMATION.CLASSES.COUNTING)

        // 记录轨迹
        visited.push(current)

        // 计算下一位置
        if (n < count) {
          current = (current % CONFIG.CALCULATOR.PALACE_COUNT) + 1
        }

        // 发送步骤事件
        this._emit('stepEnd', { step: n, position: current })

        // 计算延迟时间（三段变速策略）
        const delay = this._calculateDelay(n, count)

        n++

        // 使用 setTimeout + rAF 结合，保证精确的延迟控制
        setTimeout(() => {
          if (!signal.aborted) {
            this._animationFrameId = requestAnimationFrame(tick)
          }
        }, delay)
      }

      // 初始延迟后开始
      setTimeout(() => {
        this._emit('stepStart')
        this._animationFrameId = requestAnimationFrame(tick)
      }, timing.INITIAL_DELAY)
    })
  }

  /**
   * 取消正在运行的动画
   */
  cancel() {
    if (this._abortController) {
      this._abortController.abort()
    }
    if (this._animationFrameId) {
      cancelAnimationFrame(this._animationFrameId)
    }
    this.state = AnimationState.CANCELLED
    this._emit('cancelled')
  }

  /**
   * 计算当前步骤的延迟时间（三段变速策略）
   * @param {number} currentStep - 当前步数 (1-based)
   * @param {number} totalSteps - 总步数
   * @returns {number} 延迟毫秒数
   */
  _calculateDelay(currentStep, totalSteps) {
    const t = CONFIG.ANIMATION.TIMING
    const isLastStep = currentStep === totalSteps

    if (isLastStep) return t.FINAL_DELAY_MS

    if (totalSteps <= t.SHORT_ANIMATION_THRESHOLD) {
      // 短动画：正弦波调速
      const progress = (currentStep - 1) / totalSteps
      return t.SLOW_PHASE_MS + Math.sin(progress * Math.PI) * (t.END_PHASE_BASE_MS - t.SLOW_PHASE_MS)
    }

    // 长动画：三段式
    if (currentStep <= 3) return t.SLOW_PHASE_MS
    if (currentStep >= totalSteps - t.LONG_ANIMATION_END_STEPS) {
      const stepsFromEnd = totalSteps - currentStep
      return t.END_PHASE_BASE_MS + (t.LONG_ANIMATION_END_STEPS - stepsFromEnd) * t.END_PHASE_STEP_MS
    }
    return t.FAST_PHASE_MS
  }

  /**
   * 销毁动画控制器，释放资源
   */
  destroy() {
    this.cancel()
    this._listeners.clear()
    this.state = AnimationState.IDLE
  }
}

/**
 * 创建全局动画控制器单例
 */
let _globalAnimationController = null

export function getAnimationController() {
  if (!_globalAnimationController) {
    _globalAnimationController = new AnimationController()
  }
  return _globalAnimationController
}

export default AnimationController