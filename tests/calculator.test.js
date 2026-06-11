/**
 * 小六壬 Pro - 推算算法单元测试
 *
 * 测试策略：
 * - 边界值测试：最小/最大输入
 * - 正常路径测试：典型场景
 * - 异常路径测试：无效输入
 * - 数学正确性验证：已知结果对比
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { calculate, batchCalculate, CalculationInputError } from '../src/js/calculator.js'

describe('小六壬推算算法', () => {
  // ==================== 正常路径测试 ====================

  describe('正常输入场景', () => {
    it('正月初一子时应落在大安 (1)', () => {
      const result = calculate(1, 1, 1)
      expect(result.resultPos).toBe(1)
      expect(result.result.name).toBe('大安')
    })

    it('正月一日丑时应落在留连 (2)', () => {
      const result = calculate(1, 1, 2)
      expect(result.resultPos).toBe(2)
      expect(result.result.name).toBe('留连')
    })

    it('六月十五午时应有有效结果', () => {
      const result = calculate(6, 15, 7)
      expect(result.resultPos).toBeGreaterThanOrEqual(1)
      expect(result.resultPos).toBeLessThanOrEqual(6)
      expect(result.result).toBeDefined()
      expect(result.result.name).toBeDefined()
    })

    it('十二月三十亥时应有有效结果', () => {
      const result = calculate(12, 30, 12)
      expect(result.resultPos).toBeGreaterThanOrEqual(1)
      expect(result.resultPos).toBeLessThanOrEqual(6)
    })

    it('报数法：1-1-1 应落在大安', () => {
      const result = calculate(1, 1, 1)
      expect(result.resultPos).toBe(1)
    })

    it('报数法：999-999-999 应有有效结果', () => {
      const result = calculate(999, 999, 999)
      expect(result.resultPos).toBeGreaterThanOrEqual(1)
      expect(result.resultPos).toBeLessThanOrEqual(6)
    })
  })

  // ==================== 边界值测试 ====================

  describe('边界值测试', () => {
    it('最小月份 (1) 应正常工作', () => {
      const result = calculate(1, 15, 6)
      expect(result.resultPos).toBeGreaterThanOrEqual(1)
      expect(result.resultPos).toBeLessThanOrEqual(6)
    })

    it('最大月份 (12) 应正常工作', () => {
      const result = calculate(12, 15, 6)
      expect(result.resultPos).toBeGreaterThanOrEqual(1)
      expect(result.resultPos).toBeLessThanOrEqual(6)
    })

    it('最小日期 (1) 应正常工作', () => {
      const result = calculate(6, 1, 6)
      expect(result.resultPos).toBeGreaterThanOrEqual(1)
      expect(result.resultPos).toBeLessThanOrEqual(6)
    })

    it('最大日期 (30) 应正常工作', () => {
      const result = calculate(6, 30, 6)
      expect(result.resultPos).toBeGreaterThanOrEqual(1)
      expect(result.resultPos).toBeLessThanOrEqual(6)
    })

    it('最小时辰 (1-子时) 应正常工作', () => {
      const result = calculate(6, 15, 1)
      expect(result.resultPos).toBeGreaterThanOrEqual(1)
      expect(result.resultPos).toBeLessThanOrEqual(6)
    })

    it('最大时辰 (12-亥时) 应正常工作', () => {
      const result = calculate(6, 15, 12)
      expect(result.resultPos).toBeGreaterThanOrEqual(1)
      expect(result.resultPos).toBeLessThanOrEqual(6)
    })
  })

  // ==================== 返回数据结构验证 ====================

  describe('返回数据结构', () => {
    beforeEach(() => {
      this.result = calculate(3, 15, 8)
    })

    it('应包含 monthPos 属性', () => {
      expect(this.result).toHaveProperty('monthPos')
      expect(typeof this.result.monthPos).toBe('number')
    })

    it('应包含 dayPos 属性', () => {
      expect(this.result).toHaveProperty('dayPos')
      expect(typeof this.result.dayPos).toBe('number')
    })

    it('应包含 resultPos 属性', () => {
      expect(this.result).toHaveProperty('resultPos')
      expect(typeof this.result.resultPos).toBe('number')
    })

    it('应包含 result 对象（掌诀完整数据）', () => {
      expect(this.result).toHaveProperty('result')
      expect(this.result.result).toHaveProperty('name')
      expect(this.result.result).toHaveProperty('fortune')
      expect(this.result.result).toHaveProperty('fortuneLevel')
      expect(this.result.result).toHaveProperty('element')
      expect(this.result.result).toHaveProperty('koujue')
      expect(this.result.result).toHaveProperty('overview')
      expect(this.result.result).toHaveProperty('details')
    })

    it('应包含 steps 数组（三个步骤）', () => {
      expect(this.result).toHaveProperty('steps')
      expect(Array.isArray(this.result.steps)).toBe(true)
      expect(this.result.steps).toHaveLength(3)
    })

    it('每个步骤应包含 label, from, count, result', () => {
      this.result.steps.forEach((step) => {
        expect(step).toHaveProperty('label')
        expect(step).toHaveProperty('from')
        expect(step).toHaveProperty('count')
        expect(step).toHaveProperty('result')
      })
    })
  })

  // ==================== 步骤验证 ====================

  describe('推算步骤验证', () => {
    it('第一步「月上起日」从大安(1)开始', () => {
      const result = calculate(5, 10, 7)
      expect(result.steps[0].from).toBe(1)
      expect(result.steps[0].label).toBe('月上起日')
    })

    it('第二步「日上起时」从月落位开始', () => {
      const result = calculate(5, 10, 7)
      expect(result.steps[1].from).toBe(result.monthPos)
      expect(result.steps[1].label).toBe('日上起时')
    })

    it('第三步「时上查诀」从日落位开始', () => {
      const result = calculate(5, 10, 7)
      expect(result.steps[2].from).toBe(result.dayPos)
      expect(result.steps[2].label).toBe('时上查诀')
    })
  })

  // ==================== 异常输入测试 ====================

  describe('无效输入处理', () => {
    it('月份为 0 应抛出 CalculationInputError', () => {
      expect(() => calculate(0, 15, 6)).toThrow(CalculationInputError)
    })

    it('月份为 13 应抛出 CalculationInputError', () => {
      expect(() => calculate(13, 15, 6)).toThrow(CalculationInputError)
    })

    it('日期为 0 应抛出 CalculationInputError', () => {
      expect(() => calculate(6, 0, 6)).toThrow(CalculationInputError)
    })

    it('日期为 31 应抛出 CalculationInputError', () => {
      expect(() => calculate(6, 31, 6)).toThrow(CalculationInputError)
    })

    it('时辰为 0 应抛出 CalculationInputError', () => {
      expect(() => calculate(6, 15, 0)).toThrow(CalculationInputError)
    })

    it('时辰为 13 应抛出 CalculationInputError', () => {
      expect(() => calculate(6, 15, 13)).toThrow(CalculationInputError)
    })

    it('负数输入应抛出 CalculationInputError', () => {
      expect(() => calculate(-1, 15, 6)).toThrow(CalculationInputError)
    })

    it('非整数输入应抛出 CalculationInputError', () => {
      expect(() => calculate(6.5, 15, 6)).toThrow(CalculationInputError)
    })

    it('NaN 输入应抛出 CalculationInputError', () => {
      expect(() => calculate(NaN, 15, 6)).toThrow(CalculationInputError)
    })
  })

  // ==================== 批量推算测试 ====================

  describe('批量推算功能', () => {
    it('批量推算多个输入应返回结果数组', () => {
      const inputs = [
        { first: 1, second: 1, third: 1 },
        { first: 6, second: 15, third: 7 },
        { first: 12, second: 30, third: 12 }
      ]

      const results = batchCalculate(inputs)

      expect(Array.isArray(results)).toBe(true)
      expect(results).toHaveLength(3)

      results.forEach((r) => {
        expect(r).toHaveProperty('success')
        if (r.success) {
          expect(r).toHaveProperty('data')
          expect(r.data.resultPos).toBeGreaterThanOrEqual(1)
          expect(r.data.resultPos).toBeLessThanOrEqual(6)
        }
      })
    })

    it('批量推算包含无效输入时应标记失败', () => {
      const inputs = [
        { first: 1, second: 1, third: 1 },
        { first: 0, second: 15, third: 6 },  // 无效
        { first: 12, second: 30, third: 12 }
      ]

      const results = batchCalculate(inputs)

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
      expect(results[1].error).toBeDefined()
      expect(results[2].success).toBe(true)
    })
  })

  // ==================== 数学正确性验证 ====================

  describe('数学正确性（已知结果验证）', () => {
    /**
     * 手动验算用例：
     * 大安(1) → 留连(2) → 速喜(3) → 赤口(4) → 小吉(5) → 空亡(6) → 大安(1)...
     */
    it('正月(1): 从大安数1次 → 停在大安(1)', () => {
      const result = calculate(1, 1, 1)
      expect(result.monthPos).toBe(1)
    })

    it('二月(2): 从大安数2次 → 留连(2)', () => {
      const result = calculate(2, 1, 1)
      expect(result.monthPos).toBe(2)
    })

    it('六月(6): 从大安数6次 → 空亡(6)', () => {
      const result = calculate(6, 1, 1)
      expect(result.monthPos).toBe(6)
    })

    it('七月(7): 从大安数7次 → 回到大安(1) [模6]', () => {
      const result = calculate(7, 1, 1)
      expect(result.monthPos).toBe(1)
    })

    it('十二月(12): 从大安数12次 → 留连(2) [12%6=0→6, 但实际是12次]', () => {
      const result = calculate(12, 1, 1)
      expect(result.monthPos).toBe(2)  // 12次后回到留连
    })
  })
})