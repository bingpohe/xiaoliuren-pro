/**
 * 小六壬 Pro - 推算算法引擎
 *
 * 核心算法：三次顺数法
 *   第一步「月上起日」：大安(1)起正月 → 得月落位 pos1
 *   第二步「日上起时」：从pos1起初一 → 得日落位 pos2
 *   第三步「时上查诀」：从pos2起子时 → 得最终结果 pos3
 *
 * 数学原理：在模6的整数环上做加法
 *   next_pos = ((current_pos - 1 + count - 1) % 6) + 1
 *
 * 设计原则：
 * - 纯函数设计，无DOM依赖，完全可测试
 * - 完善的输入验证
 * - 清晰的返回数据结构
 */

import { PALACES } from './data.js'
import { CONFIG } from './config.js'

/**
 * 自定义错误类：推算输入错误
 */
export class CalculationInputError extends Error {
  constructor(message, { field, value } = {}) {
    super(message)
    this.name = 'CalculationInputError'
    this.field = field
    this.value = value
  }
}

/**
 * 验证推算输入参数
 * @param {number} first - 第一数（月份/数字1）
 * @param {number} second - 第二数（日期/数字2）
 * @param {number} third - 第三数（时辰/数字3）
 * @throws {CalculationInputError} 输入无效时抛出
 */
function validateInputs(first, second, third) {
  const rules = [
    { field: 'first', value: first, ...CONFIG.VALIDATION.NUMBER_METHOD },
    { field: 'second', value: second, ...CONFIG.VALIDATION.NUMBER_METHOD },
    { field: 'third', value: third, ...CONFIG.VALIDATION.NUMBER_METHOD }
  ]

  for (const rule of rules) {
    if (!Number.isInteger(rule.value) || rule.value < rule.min || rule.value > rule.max) {
      throw new CalculationInputError(
        `无效的${rule.field}参数: ${rule.value} (应在 ${rule.min}-${rule.max} 之间)`,
        { field: rule.field, value: rule.value }
      )
    }
  }
}

/**
 * 在六宫环上计算下一个位置（核心数学运算）
 *
 * @param {number} currentPosition - 当前位置 (1-6)
 * @param {number} count - 要移动的步数
 * @returns {number} 新位置 (1-6)
 */
function calculateNextPosition(currentPosition, count) {
  const { PALACE_COUNT, STARTING_PALACE } = CONFIG.CALCULATOR
  return ((currentPosition - STARTING_PALACE + count - 1) % PALACE_COUNT) + STARTING_PALACE
}

/**
 * 小六壬推算主函数（纯函数）
 *
 * @param {number} first - 第一数（农历月份 或 报数法第一个数字）
 * @param {number} second - 第二数（农历日期 或 报数法第二个数字）
 * @param {number} third - 第三数（时辰序号 或 报数法第三个数字）
 * @returns {{
 *   monthPos: number,
 *   dayPos: number,
 *   resultPos: number,
 *   result: object,
 *   steps: Array<{label: string, from: number, count: number, result: number}>
 * }} 推算结果对象
 * @throws {CalculationInputError} 输入无效时抛出
 */
export function calculate(first, second, third) {
  validateInputs(first, second, third)

  const { STARTING_PALACE } = CONFIG.CALCULATOR

  // 第一步「月上起日」
  const pos1 = calculateNextPosition(STARTING_PALACE, first)

  // 第二步「日上起时」
  const pos2 = calculateNextPosition(pos1, second)

  // 第三步「时上查诀」
  const pos3 = calculateNextPosition(pos2, third)

  return {
    monthPos: pos1,
    dayPos: pos2,
    resultPos: pos3,
    result: PALACES[pos3],
    steps: [
      {
        label: '月上起日',
        from: STARTING_PALACE,
        count: first,
        result: pos1
      },
      {
        label: '日上起时',
        from: pos1,
        count: second,
        result: pos2
      },
      {
        label: '时上查诀',
        from: pos2,
        count: third,
        result: pos3
      }
    ]
  }
}

/**
 * 批量推算（用于测试或批量场景）
 * @param {Array<{first: number, second: number, third: number}>} inputs - 输入数组
 * @returns {Array<object>} 推算结果数组
 */
export function batchCalculate(inputs) {
  return inputs.map(({ first, second, third }) => {
    try {
      return {
        success: true,
        data: calculate(first, second, third),
        input: { first, second, third }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        input: { first, second, third }
      }
    }
  })
}

export default {
  calculate,
  batchCalculate,
  CalculationInputError
}