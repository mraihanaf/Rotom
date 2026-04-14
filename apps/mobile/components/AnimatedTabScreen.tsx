import { useTabAnimation } from '@/lib/animation/TabAnimationContext';
import Animated, { 
  SlideInRight, 
  SlideInLeft, 
  FadeOut,
  SlideOutLeft,
  SlideOutRight
} from 'react-native-reanimated';
import { View } from 'react-native';

interface AnimatedTabScreenProps {
  children: React.ReactNode;
}

export function AnimatedTabScreen({ children }: AnimatedTabScreenProps) {
  const { direction } = useTabAnimation();

  // Determine entering animation based on direction
  // direction 'left' means we navigated to next tab (screen enters from right)
  // direction 'right' means we navigated to prev tab (screen enters from left)
  const enteringAnimation = direction === 'left' 
    ? SlideInRight.duration(250)
    : direction === 'right'
    ? SlideInLeft.duration(250)
    : undefined;

  const exitingAnimation = direction === 'left'
    ? SlideOutLeft.duration(200)
    : direction === 'right'
    ? SlideOutRight.duration(200)
    : FadeOut.duration(150);

  return (
    <Animated.View 
      style={{ flex: 1 }}
      entering={enteringAnimation}
      exiting={exitingAnimation}
    >
      {children}
    </Animated.View>
  );
}
