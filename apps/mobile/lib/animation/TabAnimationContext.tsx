import React, { createContext, useContext, useState, useCallback } from 'react';
import { useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

type AnimationDirection = 'left' | 'right' | null;

interface TabAnimationContextType {
  direction: AnimationDirection;
  setDirection: (direction: AnimationDirection) => void;
  triggerNavigation: (direction: 'next' | 'prev', navigate: () => void) => void;
  translateX: SharedValue<number>;
}

const TabAnimationContext = createContext<TabAnimationContextType | null>(null);

export function TabAnimationProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<AnimationDirection>(null);
  const translateX = useSharedValue(0);

  const triggerNavigation = useCallback((navDirection: 'next' | 'prev', navigate: () => void) => {
    setDirection(navDirection === 'next' ? 'left' : 'right');
    navigate();
    translateX.value = withTiming(0, { duration: 0 });
    setTimeout(() => setDirection(null), 350);
  }, [translateX]);

  return (
    <TabAnimationContext.Provider value={{ direction, setDirection, triggerNavigation, translateX }}>
      {children}
    </TabAnimationContext.Provider>
  );
}

export function useTabAnimation() {
  const context = useContext(TabAnimationContext);
  if (!context) {
    throw new Error('useTabAnimation must be used within TabAnimationProvider');
  }
  return context;
}
