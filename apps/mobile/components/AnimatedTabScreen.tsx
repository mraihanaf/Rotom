import { useTabAnimation } from '@/lib/animation/TabAnimationContext';
import Animated, {
  SlideInRight,
  SlideInLeft,
  SlideOutLeft,
  SlideOutRight,
  FadeOut,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface AnimatedTabScreenProps {
  children: React.ReactNode;
}

export function AnimatedTabScreen({ children }: AnimatedTabScreenProps) {
  const { direction, translateX } = useTabAnimation();

  const enteringAnimation = direction === 'left'
    ? SlideInRight.springify().damping(26).stiffness(200)
    : direction === 'right'
    ? SlideInLeft.springify().damping(26).stiffness(200)
    : undefined;

  const exitingAnimation = direction === 'left'
    ? SlideOutLeft.springify().damping(26).stiffness(200)
    : direction === 'right'
    ? SlideOutRight.springify().damping(26).stiffness(200)
    : FadeOut.duration(150);

  const dragStyle = useAnimatedStyle(() => {
    const tx = translateX.value;
    const scale = interpolate(
      Math.abs(tx),
      [0, SCREEN_WIDTH * 0.5],
      [1, 0.94],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      Math.abs(tx),
      [0, SCREEN_WIDTH * 0.5],
      [1, 0.7],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{ translateX: tx }, { scale }],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[{ flex: 1 }, dragStyle]}
      entering={enteringAnimation}
      exiting={exitingAnimation}
    >
      {children}
    </Animated.View>
  );
}
