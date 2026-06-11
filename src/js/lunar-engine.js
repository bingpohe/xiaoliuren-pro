/**
 * 小六壬 Pro - 农历转换引擎
 *
 * 职责：公历日期 ↔ 冲历日期 双向转换
 *
 * 设计原则：
 * - 纯函数设计，无副作用，便于单元测试
 * - 完善的输入验证和错误处理
 * - 清晰的算法文档和注释
 * - 支持闰月判断和显示
 */

import { LUNAR_YEAR_DATA, STEMS, BRANCHES, ZODIAC } from './data.js'

import { CONFIG } from './config.js'

/**
 * 自定义错误类：农历转换错误
 */
export class LunarConversionError extends Error {
  constructor(message, { year, date } = {}) {
    super(message)
    this.name = 'LunarConversionError'
    this.year = year
    this.date = date
  }
}

/**
 * 从 LUNAR_YEAR_DATA 中获取指定年份的编码值
 * @param {number} year - 公历年份 (1900-2100)
 * @returns {number} 该年的农历编码数据
 * @throws {LunarConversionError} 年份超出范围时抛出
 */
export function getLunarYearInfo(year) {
  _validateYearRange(year)
  return LUNAR_YEAR_DATA[year - CONFIG.LUNAR.BASE_YEAR] || 0
}

/**
 * 获取指定年份的闰月月份
 * @param {number} year - 公历年份
 * @returns {number} 闰月月份 (0=无闰月, 1-12=闰几月)
 */
export function getLeapMonth(year) {
  const info = getLunarYearInfo(year)
  return info & CONFIG.LUNAR.ENCODED_BITS.LEAP_MONTH_MASK
}

/**
 * 按月份序号获取该月天数
 * @param {number} year - 公历年份
 * @param {number} monthIndex - 月份序号 (1-12 非闰年, 1-13 闰年)
 * @returns {number} 该月天数 (29 或 30)
 */
export function getMonthDaysByIndex(year, monthIndex) {
  const info = getLunarYearInfo(year)
  const bitPosition = CONFIG.LUNAR.ENCODED_BITS.MONTH_SIZE_START_BIT + monthIndex - 1
  return (info & (1 << bitPosition)) ? 30 : 29
}

/**
 * 判断指定月份序号是否为闰月
 * @param {number} year - 公历年份
 * @param {number} monthIndex - 月份序号
 * @returns {boolean} 是否为闰月
 */
export function isLeapAtIndex(year, monthIndex) {
  const leap = getLeapMonth(year)
  return leap > 0 && monthIndex === leap + 1
}

/**
 * 计算农历年总天数
 * @param {number} year - 农历年份
 * @returns {number} 该年总天数
 */
export function lunarYearDays(year) {
  const leap = getLeapMonth(year)
  const monthCount = leap > 0 ? CONFIG.LUNAR.MAX_MONTHS_IN_LEAP_YEAR : 12

  let sum = 0
  for (let i = 1; i <= monthCount; i++) {
    sum += getMonthDaysByIndex(year, i)
  }
  return sum
}

/**
 * 公历转农历（核心算法）
 *
 * 算法流程：
 * 1. 计算从基准日到目标日期的偏移天数
 * 2. 逐年减去每年天数 → 确定农历年
 * 3. 逐月减去每月天数 → 确定农历月、日
 * 4. 判断闰月并转换为友好显示格式
 *
 * @param {Date} date - 公历日期对象
 * @returns {{ year: number, month: number, day: number, isLeap: boolean }} 农历日期
 * @throws {LunarConversionError} 日期无效或超出范围时抛出
 */
export function solarToLunar(date) {
  // 输入验证
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    throw new LunarConversionError('无效的日期对象', { date })
  }

  const baseDate = CONFIG.LUNAR.BASE_DATE
  let offset = Math.floor((date - baseDate) / 86400000)

  if (offset < 0) {
    offset = 0
  }

  // 第一步：确定农历年
  let lunarYear
  for (lunarYear = CONFIG.LUNAR.BASE_YEAR; lunarYear <= CONFIG.LUNAR.END_YEAR; lunarYear++) {
    const yDays = lunarYearDays(lunarYear)
    if (offset < yDays) break
    offset -= yDays
  }

  if (lunarYear > CONFIG.LUNAR.END_YEAR) {
    lunarYear = CONFIG.LUNAR.END_YEAR
  }

  // 第二步：确定农历月日
  const leap = getLeapMonth(lunarYear)
  const monthCount = leap > 0 ? CONFIG.LUNAR.MAX_MONTHS_IN_LEAP_YEAR : 12

  for (let mi = 1; mi <= monthCount; mi++) {
    const mDays = getMonthDaysByIndex(lunarYear, mi)

    if (offset < mDays) {
      const isLeap = isLeapAtIndex(lunarYear, mi)

      let displayMonth
      if (isLeap) {
        displayMonth = leap
      } else if (leap > 0 && mi > leap + 1) {
        displayMonth = mi - 1
      } else {
        displayMonth = mi
      }

      return {
        year: lunarYear,
        month: displayMonth,
        day: offset + 1,
        isLeap: isLeap
      }
    }
    offset -= mDays
  }

  return { year: lunarYear, month: 12, day: 30, isLeap: false }
}

/**
 * 获取当前时辰序号 (1-12)
 * @param {Date} [date=new Date()] - 日期对象（可选，默认当前时间）
 * @returns {number} 时辰序号 1-12
 */
export function getCurrentShiChen(date = new Date()) {
  const h = date.getHours()

  if (h >= 23 || h < 1) return 1   // 子时
  if (h >= 1 && h < 3) return 2    // 丑时
  if (h >= 3 && h < 5) return 3    // 寅时
  if (h >= 5 && h < 7) return 4    // 卯时
  if (h >= 7 && h < 9) return 5    // 辰时
  if (h >= 9 && h < 11) return 6   // 巳时
  if (h >= 11 && h < 13) return 7  // 午时
  if (h >= 13 && h < 15) return 8  // 未时
  if (h >= 15 && h < 17) return 9  // 申时
  if (h >= 17 && h < 19) return 10 // 酉时
  if (h >= 19 && h < 21) return 11 // 戌时
  return 12                        // 亥时
}

/**
 * 获取干支纪年字符串
 * @param {number} year - 公历年份
 * @returns {string} 如 "丙午年 [马]"
 */

export function getStemBranch(year) {
  const s = STEMS[(year - 4) % 10]
  const b = BRANCHES[(year - 4) % 12]
  const z = ZODIAC[(year - 4) % 12]
  return `${s}${b}年 [${z}]`
}

// ==================== 私有辅助函数 ====================

/**
 * 验证年份是否在有效范围内
 * @param {number} year - 年份
 * @throws {LunarConversionError} 超出范围时抛出
 */
function _validateYearRange(year) {
  if (
    !Number.isInteger(year) ||
    year < CONFIG.LUNAR.BASE_YEAR ||
    year > CONFIG.LUNAR.END_YEAR
  ) {
    throw new LunarConversionError(
      `年份 ${year} 超出支持范围 (${CONFIG.LUNAR.BASE_YEAR}-${CONFIG.LUNAR.END_YEAR})`,
      { year }
    )
  }
}

export default {
  solarToLunar,
  getCurrentShiChen,
  getStemBranch,
  getLunarYearInfo,
  getLeapMonth,
  getMonthDaysByIndex,
  lunarYearDays
}