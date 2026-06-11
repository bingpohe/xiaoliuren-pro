/**
 * 小六壬 Pro - 农历转换单元测试
 *
 * 测试重点：
 * - 已知日期的转换准确性
 * - 边界年份处理
 * - 闰月判断
 * - 时辰计算
 * - 错误处理
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import {
  solarToLunar,
  getCurrentShiChen,
  getStemBranch,
  getLunarYearInfo,
  getLeapMonth,
  getMonthDaysByIndex,
  lunarYearDays,
  LunarConversionError
} from '../src/js/lunar-engine.js'

describe('农历转换引擎', () => {
  // ==================== 公历转农历测试 ====================

  describe('solarToLunar() - 已知日期验证', () => {
    it('1900-01-31 (基准日) 应为 农历1900年正月初一', () => {
      const date = new Date(1900, 0, 31)
      const lunar = solarToLunar(date)

      expect(lunar.year).toBe(1900)
      expect(lunar.month).toBe(1)
      expect(lunar.day).toBe(1)
      expect(lunar.isLeap).toBe(false)
    })

    it('2000-01-01 应为 农历1999年十一月廿五', () => {
      const date = new Date(2000, 0, 1)
      const lunar = solarToLunar(date)

      expect(lunar.year).toBe(1999)
      expect(lunar.month).toBe(11)
      expect(lunar.day).toBe(25)
    })

    it('2024-01-01 应为 农历2023年冬月二十', () => {
      const date = new Date(2024, 0, 1)
      const lunar = solarToLunar(date)

      expect(lunar.year).toBe(2023)
      expect(lunar.month).toBe(11)
      expect(lunar.day).toBe(20)
    })

    it('2024-02-10 (春节) 应为 农历2024年正月初一', () => {
      const date = new Date(2024, 1, 10)
      const lunar = solarToLunar(date)

      expect(lunar.year).toBe(2024)
      expect(lunar.month).toBe(1)
      expect(lunar.day).toBe(1)
    })

    it('当前日期应在合理范围内', () => {
      const now = new Date()
      const lunar = solarToLunar(now)

      expect(lunar.year).toBeGreaterThanOrEqual(1900)
      expect(lunar.year).toBeLessThanOrEqual(2100)
      expect(lunar.month).toBeGreaterThanOrEqual(1)
      expect(lunar.month).toBeLessThanOrEqual(12)
      expect(lunar.day).toBeGreaterThanOrEqual(1)
      expect(lunar.day).toBeLessThanOrEqual(30)
    })
  })

  // ==================== 时辰计算测试 ====================

  describe('getCurrentShiChen() - 时辰判断', () => {
    it('23:00 应为子时 (1)', () => {
      const date = new Date(2024, 0, 1, 23, 0)
      expect(getCurrentShiChen(date)).toBe(1)
    })

    it('00:30 应为子时 (1)', () => {
      const date = new Date(2024, 0, 1, 0, 30)
      expect(getCurrentShiChen(date)).toBe(1)
    })

    it('01:00 应为丑时 (2)', () => {
      const date = new Date(2024, 0, 1, 1, 0)
      expect(getCurrentShiChen(date)).toBe(2)
    })

    it('06:00 应为卯时 (4)', () => {
      const date = new Date(2024, 0, 1, 6, 0)
      expect(getCurrentShiChen(date)).toBe(4)
    })

    it('12:00 应为午时 (7)', () => {
      const date = new Date(2024, 0, 1, 12, 0)
      expect(getCurrentShiChen(date)).toBe(7)
    })

    it('18:00 应为酉时 (10)', () => {
      const date = new Date(2024, 0, 1, 18, 0)
      expect(getCurrentShiChen(date)).toBe(10)
    })

    it('22:59 应为亥时 (12)', () => {
      const date = new Date(2024, 0, 1, 22, 59)
      expect(getCurrentShiChen(date)).toBe(12)
    })

    it('不传参数应使用当前时间', () => {
      const shiChen = getCurrentShiChen()
      expect(shiChen).toBeGreaterThanOrEqual(1)
      expect(shiChen).toBeLessThanOrEqual(12)
    })
  })

  // ==================== 干支纪年测试 ====================

  describe('getStemBranch() - 干支计算', () => {
    it('1984年应为甲子年', () => {
      const result = getStemBranch(1984)
      expect(result).toContain('甲子')
    })

    it('2024年应为甲辰年', () => {
      const result = getStemBranch(2024)
      expect(result).toContain('甲辰')
    })

    it('返回值应包含生肖', () => {
      const result = getStemBranch(2024)
      expect(result).toContain('[')
      expect(result).toContain(']')
    })
  })

  // ==================== 年份信息查询测试 ====================

  describe('农历年信息查询', () => {
    it('getLunarYearInfo(1900) 应返回有效编码', () => {
      const info = getLunarYearInfo(1900)
      expect(typeof info).toBe('number')
      expect(info).toBeGreaterThan(0)
    })

    it('getLunarYearInfo(2100) 应返回有效编码', () => {
      const info = getLunarYearInfo(2100)
      expect(typeof info).toBe('number')
    })

    it('getLeapMonth() 返回值应在 0-12 范围内', () => {
      for (let year = 1900; year <= 2100; year++) {
        const leap = getLeapMonth(year)
        expect(leap).toBeGreaterThanOrEqual(0)
        expect(leap).toBeLessThanOrEqual(12)
      }
    })

    it('lunarYearDays() 返回值应在合理范围内', () => {
      for (let year = 1900; year <= 2100; year += 10) {
        const days = lunarYearDays(year)
        expect(days).toBeGreaterThanOrEqual(350)
        expect(days).toBeLessThanOrEqual(390)
      }
    })
  })

  // ==================== 错误处理测试 ====================

  describe('错误处理', () => {
    it('传入无效日期对象应抛出 LunarConversionError', () => {
      expect(() => solarToLunar(new Date('invalid'))).toThrow(LunarConversionError)
    })

    it('传入非 Date 对象应抛出 LunarConversionError', () => {
      expect(() => solarToLunar(null)).toThrow(LunarConversionError)
      expect(() => solarToLunar(undefined)).toThrow(LunarConversionError)
      expect(() => solarToLunar('2024-01-01')).toThrow(LunarConversionError)
    })

    it('错误消息应包含有用信息', () => {
      try {
        solarToLunar(null)
      } catch (error) {
        expect(error).toBeInstanceOf(LunarConversionError)
        expect(error.name).toBe('LunarConversionError')
        expect(error.message).toBeTruthy()
      }
    })
  })
})