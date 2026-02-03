import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUIStore = create(
  persist(
    (set, get) => ({
      // UI显示状态
      isUIVisible: true,
      
      // 活动面板
      activePanel: null, // 'actions' | 'characters' | 'timeline' | 'settings' | 'expressions'
      
      // 面板折叠状态
      panelCollapsed: {
        actions: false,
        characters: true,
        timeline: true,
        expressions: true,
      },
      
      // 悬浮控制球位置
      floatingToolbarPos: { x: 100, y: typeof window !== 'undefined' ? window.innerHeight - 150 : 500 },
      
      // 全屏状态
      isFullscreen: false,
      
      // 移动端菜单状态
      isMobileMenuOpen: false,
      
      // Actions
      toggleUI: () => set((state) => ({ isUIVisible: !state.isUIVisible })),
      
      showUI: () => set({ isUIVisible: true }),
      
      hideUI: () => set({ isUIVisible: false }),
      
      setActivePanel: (panel) => set({ 
        activePanel: panel,
        isMobileMenuOpen: !!panel 
      }),
      
      closePanel: () => set({ 
        activePanel: null,
        isMobileMenuOpen: false 
      }),
      
      togglePanel: (name) => set((state) => ({
        panelCollapsed: {
          ...state.panelCollapsed,
          [name]: !state.panelCollapsed[name]
        }
      })),
      
      updateToolbarPos: (pos) => set({ floatingToolbarPos: pos }),
      
      toggleFullscreen: () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen()
          set({ isFullscreen: true })
        } else {
          document.exitFullscreen()
          set({ isFullscreen: false })
        }
      },
      
      setFullscreen: (value) => set({ isFullscreen: value }),
      
      toggleMobileMenu: () => set((state) => ({ 
        isMobileMenuOpen: !state.isMobileMenuOpen 
      })),
    }),
    {
      name: 'ar-ui-store',
      partialize: (state) => ({
        floatingToolbarPos: state.floatingToolbarPos,
        panelCollapsed: state.panelCollapsed,
      }),
    }
  )
)

// 自动隐藏UI的逻辑
let hideTimer = null

export const startUIAutoHide = () => {
  const { hideUI } = useUIStore.getState()
  clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    hideUI()
  }, 3000)
}

export const resetUIAutoHide = () => {
  const { showUI } = useUIStore.getState()
  clearTimeout(hideTimer)
  showUI()
  startUIAutoHide()
}

export const stopUIAutoHide = () => {
  clearTimeout(hideTimer)
}
