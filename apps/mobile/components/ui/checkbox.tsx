import { Check } from 'lucide-react-native';
import * as React from 'react';
import { Pressable } from '@/tw';
import { cn } from '@/lib/utils';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Checkbox({ checked, onCheckedChange, disabled, className }: CheckboxProps) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(0);

  React.useEffect(() => {
    if (checked) {
      scale.value = withSpring(1.15, { damping: 12, stiffness: 200 });
      checkScale.value = withTiming(1, { duration: 200 });
      setTimeout(() => {
        scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      }, 100);
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      checkScale.value = withTiming(0, { duration: 150 });
    }
  }, [checked, scale, checkScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <AnimatedPressable
      onPress={() => onCheckedChange?.(!checked)}
      disabled={disabled}
      style={animatedStyle}
      className={cn(
        'w-5 h-5 rounded border-2 items-center justify-center',
        checked ? 'bg-primary border-primary' : 'border-[#326744] bg-transparent',
        disabled && 'opacity-50',
        className
      )}
    >
      {checked && (
        <Animated.View style={checkStyle}>
          <Check size={14} color="#0a2e16" strokeWidth={3} />
        </Animated.View>
      )}
    </AnimatedPressable>
  );
}
