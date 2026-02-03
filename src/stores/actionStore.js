import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useActionStore = create(
  persist(
    (set, get) => ({
      // 当前动作
      currentAction: null,
      
      // 播放状态
      isPlaying: false,
      
      // 播放速度
      playbackSpeed: 1.0,
      
      // 循环播放
      isLooping: false,
      
      // 收藏的动作
      favorites: [],
      
      // 最近使用的动作
      recentActions: [],
      
      // 动作使用统计
      actionStats: {},
      
      // 时间轴数据
      timeline: {
        tracks: [],
        duration: 0,
        currentTime: 0,
      },
      
      // Actions
      setCurrentAction: (action) => set({ currentAction: action }),
      
      togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      setPlaying: (value) => set({ isPlaying: value }),
      
      setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
      
      increaseSpeed: () => set((state) => ({ 
        playbackSpeed: Math.min(state.playbackSpeed + 0.1, 2.0) 
      })),
      
      decreaseSpeed: () => set((state) => ({ 
        playbackSpeed: Math.max(state.playbackSpeed - 0.1, 0.5) 
      })),
      
      toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
      
      addFavorite: (action) => set((state) => ({
        favorites: [...state.favorites.filter(a => a.id !== action.id), action]
      })),
      
      removeFavorite: (actionId) => set((state) => ({
        favorites: state.favorites.filter(a => a.id !== actionId)
      })),
      
      addRecentAction: (action) => set((state) => {
        const filtered = state.recentActions.filter(a => a.id !== action.id)
        return {
          recentActions: [action, ...filtered].slice(0, 20)
        }
      }),
      
      recordActionUsage: (actionId) => set((state) => ({
        actionStats: {
          ...state.actionStats,
          [actionId]: {
            count: (state.actionStats[actionId]?.count || 0) + 1,
            lastUsed: Date.now(),
          }
        }
      })),
      
      // 时间轴操作
      setTimeline: (timeline) => set({ timeline }),
      
      addTrack: (track) => set((state) => ({
        timeline: {
          ...state.timeline,
          tracks: [...state.timeline.tracks, track]
        }
      })),
      
      updateTrack: (trackId, updates) => set((state) => ({
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.map(t => 
            t.id === trackId ? { ...t, ...updates } : t
          )
        }
      })),
      
      removeTrack: (trackId) => set((state) => ({
        timeline: {
          ...state.timeline,
          tracks: state.timeline.tracks.filter(t => t.id !== trackId)
        }
      })),
      
      setCurrentTime: (time) => set((state) => ({
        timeline: {
          ...state.timeline,
          currentTime: time
        }
      })),
    }),
    {
      name: 'ar-action-store',
      partialize: (state) => ({
        favorites: state.favorites,
        recentActions: state.recentActions,
        actionStats: state.actionStats,
        playbackSpeed: state.playbackSpeed,
        isLooping: state.isLooping,
      }),
    }
  )
)
