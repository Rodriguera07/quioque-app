import React, { useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  Platform,
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { stateLayerOpacity } from '../theme';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

interface Props extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: React.ReactNode;
  // Camada de estado do Material 3: um overlay translúcido dessa cor cobre o
  // elemento ao toque (ripple no Android, fade no iOS/web). Deixe undefined
  // para manter o feedback só por escala, como antes.
  stateLayerColor?: string;
}

export function AnimatedPressable({
  style,
  scaleTo = 0.96,
  children,
  onPressIn,
  onPressOut,
  disabled,
  stateLayerColor,
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const stateLayer = useRef(new Animated.Value(0)).current;

  const handlePressIn = (e: GestureResponderEvent) => {
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
    if (stateLayerColor) {
      Animated.timing(stateLayer, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 6,
    }).start();
    if (stateLayerColor) {
      Animated.timing(stateLayer, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
    onPressOut?.(e);
  };

  return (
    <AnimatedPressableBase
      disabled={disabled}
      android_ripple={
        stateLayerColor && Platform.OS === 'android'
          ? { color: stateLayerColor, foreground: true }
          : undefined
      }
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { transform: [{ scale }] }, disabled ? { opacity: 0.5 } : null]}
      {...rest}
    >
      {children}
      {stateLayerColor && Platform.OS !== 'android' && (
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: stateLayerColor,
              opacity: stateLayer.interpolate({
                inputRange: [0, 1],
                outputRange: [0, stateLayerOpacity.press],
              }),
            },
          ]}
        />
      )}
    </AnimatedPressableBase>
  );
}
