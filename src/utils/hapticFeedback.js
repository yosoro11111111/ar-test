/**
 * 触觉反馈系统
 * 在支持的设备上提供振动反馈
 */

export const HapticFeedback = {
  /**
   * 轻微振动 - 用于按钮点击等轻微交互
   */
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  },

  /**
   * 中等振动 - 用于重要操作确认
   */
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(20)
    }
  },

  /**
   * 强烈振动 - 用于错误或警告
   */
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30, 50, 30])
    }
  },

  /**
   * 成功反馈 - 愉快的短振动
   */
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 30, 10])
    }
  },

  /**
   * 错误反馈 - 明显的错误提示
   */
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50])
    }
  },

  /**
   * 模式切换反馈
   */
  modeSwitch: () => {
    if (navigator.vibrate) {
      navigator.vibrate([15, 30, 15])
    }
  },

  /**
   * 放置确认反馈
   */
  placement: () => {
    if (navigator.vibrate) {
      navigator.vibrate([20, 40, 20, 40, 20])
    }
  },

  /**
   * 动作播放反馈
   */
  actionPlay: () => {
    if (navigator.vibrate) {
      navigator.vibrate(15)
    }
  },

  /**
   * 录制开始/停止反馈
   */
  recording: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 100])
    }
  },

  /**
   * 截图反馈
   */
  screenshot: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 20, 10])
    }
  },

  /**
   * 检查设备是否支持振动
   */
  isSupported: () => {
    return 'vibrate' in navigator
  }
}

export default HapticFeedback
