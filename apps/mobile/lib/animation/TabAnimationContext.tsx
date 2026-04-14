import React, { createContext, useContext, useState, useCallback } from 'react';

type AnimationDirection = 'left' | 'right' | null;

interface TabAnimationContextType {
  direction: AnimationDirection;
  setDirection: (direction: AnimationDirection) => void;
  triggerNavigation: (direction: 'next' | 'prev', navigate: () => void) => void;
}

const TabAnimationContext = createContext<TabAnimationContextType | null>(null);

export function TabAnimationProvider({ children }: { children: React.ReactNode }) {
  const [direction, setDirection] = useState<AnimationDirection>(null);

  const triggerNavigation = useCallback((navDirection: 'next' | 'prev', navigate: () => void) => {
    // Set direction for animation
    setDirection(navDirection === 'next' ? 'left' : 'right');
    
    // Execute navigation
    navigate();
    
    // Reset direction after animation
    setTimeout(() => setDirection(null), 300);
  }, []);

  return (
    <TabAnimationContext.Provider value={{ direction, setDirection, triggerNavigation }}>
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
