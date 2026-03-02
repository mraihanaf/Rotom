import { Check } from 'lucide-react-native';
import * as React from 'react';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/utils';

type CheckboxProps = {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Checkbox({ checked, onCheckedChange, disabled, className }: CheckboxProps) {
  return (
    <Pressable
      onPress={() => onCheckedChange?.(!checked)}
      disabled={disabled}
      className={cn(
        'w-5 h-5 rounded border-2 items-center justify-center',
        checked ? 'bg-primary border-primary' : 'border-[#326744] bg-transparent',
        disabled && 'opacity-50',
        className
      )}
    >
      {checked && <Check size={14} color="#0a2e16" strokeWidth={3} />}
    </Pressable>
  );
}
