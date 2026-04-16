import { useCssElement } from 'react-native-css';
import React from 'react';
import { StyleSheet, ImageStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { Image as RNImage } from 'expo-image';

const AnimatedExpoImage = Animated.createAnimatedComponent(RNImage);

export type ImageProps = React.ComponentProps<typeof Image>;

function CSSImage(props: React.ComponentProps<typeof AnimatedExpoImage>) {
  const flattenedStyle = StyleSheet.flatten(props.style) as ImageStyle & {
    objectFit?: string;
    objectPosition?: string;
  } || {};
  const { objectFit, objectPosition, ...style } = flattenedStyle;

  return (
    <AnimatedExpoImage
      contentFit={objectFit as any}
      contentPosition={objectPosition as any}
      {...props}
      source={
        typeof props.source === 'string' ? { uri: props.source } : props.source
      }
      style={style}
    />
  );
}

export const Image = (
  props: React.ComponentProps<typeof CSSImage> & { className?: string },
) => {
  return useCssElement(CSSImage, props, { className: 'style' });
};

Image.displayName = 'CSS(Image)';
