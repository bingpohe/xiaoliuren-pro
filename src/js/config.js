/**
 * 小六壬 Pro - 全局配置常量
 * 
 * 设计原则：
 * - 所有魔法数字集中管理，便于维护和修改
 * - 配置分层：应用级 > 功能模块级 > UI细节级
 * - 支持未来扩展（如主题切换、多语言）
 */

export const CONFIG = Object.freeze({
  // ========== 应用基础信息 ==========
  APP: {
    NAME: '小六壬占卜',
    SUBTITLE: '诸葛马前课 · 掌诀推算',
    VERSION: '2.0.0',
    DESCRIPTION: '中国传统小六壬掌诀占卜，预测吉凶祸福',
    AUTHOR: 'XiaoLiuRen Team',
    LICENSE: 'MIT'
  },

  // ========== 农历转换配置 ==========
  LUNAR: {
    BASE_YEAR: 1900,           // 农历数据起始年
    BASE_DATE: new Date(1900, 0, 31),  // 农历1900年正月初一 = 公历1900-01-31
    END_YEAR: 2100,            // 农历数据结束年
    ENCODED_BITS: {
      LEAP_MONTH_MASK: 0xf,   // bits 0-3: 闰月月份
      MONTH_SIZE_START_BIT: 4, // bits 4-15: 每月大小（1=30天, 0=29天）
      LEAP_SIZE_START_BIT: 16  // bits 16-19: 闰月大小
    },
    MAX_MONTHS_IN_LEAP_YEAR: 13,  // 闰年最多13个月
    MAX_DAYS_IN_MONTH: 30         // 农历月份最大天数
  },

  // ========== 小六壬推算配置 ==========
  CALCULATOR: {
    PALACE_COUNT: 6,            // 六宫数量
    STARTING_PALACE: 1,         // 起始宫位（大安）
    SHI_CHEN_COUNT: 12,         // 十二时辰数
    MAX_INPUT_VALUE: 999        // 报数法最大输入值
  },

  // ========== 动画配置 ==========
  ANIMATION: {
    TIMING: {
      INITIAL_DELAY: 200,       // 动画开始前的延迟(ms)
      STEP_PAUSE: 300,          // 步骤间停顿(ms)
      RESULT_DELAY: 200,        // 结果高亮前延迟(ms)
      
      // 三段变速策略
      SLOW_PHASE_MS: 150,       // 起手慢速阶段
      FAST_PHASE_MS: 25,        // 中段快速掠过
      END_PHASE_BASE_MS: 100,   // 末段渐慢基准
      END_PHASE_STEP_MS: 55,    // 末段每步增量
      FINAL_DELAY_MS: 450,      // 最终落点延迟
      
      SHORT_ANIMATION_THRESHOLD: 12,  // 短动画阈值
      LONG_ANIMATION_END_STEPS: 6     // 长动画末段步数
    },
    
    // 振动反馈模式
    VIBRATION_PATTERN: [50, 100, 50],  // 短振-停-短振
    
    // CSS 类名映射
    CLASSES: {
      TRAIL: 'trail',           // 已走过轨迹
      COUNTING: 'counting',     // 当前位置
      ACTIVE: 'active',         // 步骤完成
      RESULT: 'result'          // 最终结果
    }
  },

  // ========== UI 配置 ==========
  UI: {
    RESPONSIVE: {
      MOBILE_BREAKPOINT: 340,   // 小屏幕断点(px)
      TABLET_BREAKPOINT: 420,   // 平板断点(px)
      MAX_CONTAINER_WIDTH: 420  // 容器最大宽度(px)
    },
    
    SAFE_AREA: {
      BOTTOM_DEFAULT: 16,       // 默认底部安全区(px)
      TOP_PADDING: 20,          // 顶部内边距(px)
      SIDE_PADDING: 16          // 两侧内边距(px)
    },
    
    GRID: {
      COLUMNS: 3,               // 六宫格列数
      ROWS: 2,                  // 六宫格行数
      GAP: 2                    // 格子间距(px)
    }
  },

  // ========== PWA 配置 ==========
  PWA: {
    CACHE_NAME_PREFIX: 'xiaoliuren-pro',
    INSTALL_BANNER_DELAY: 3000,  // 安装横幅延迟显示(ms)
    ASSETS: ['./', './index.html', './manifest.json', './icons/LOGO68.png']
  },

  // ========== 存储配置 ==========
  STORAGE: {
    HISTORY_KEY: 'xl_history',  // 历史记录存储键
    MAX_HISTORY_ITEMS: 10       // 最大历史记录数
  },

  // ========== 无障碍配置 ==========
  ACCESSIBILITY: {
    FOCUS_VISIBLE_CLASS: 'focus-visible',
    REDUCED_MOTION_QUERY: '(prefers-reduced-motion: reduce)'
  },

  // ========== 验证规则 ==========
  VALIDATION: {
    LUNAR_MONTH: { min: 1, max: 12 },
    LUNAR_DAY: { min: 1, max: 30 },
    SHI_CHEN: { min: 1, max: 12 },
    NUMBER_METHOD: { min: 1, max: 999 }
  }
})

/**
 * 版本信息工具函数
 */
export function getAppVersion() {
  return `${CONFIG.APP.NAME} v${CONFIG.APP.VERSION}`
}

/**
 * 获取缓存名称（含版本号）
 */
export function getCacheName() {
  return `${CONFIG.PWA.CACHE_NAME_PREFIX}-v${CONFIG.APP.VERSION.replace(/\./g, '-')}`
}

export default CONFIG