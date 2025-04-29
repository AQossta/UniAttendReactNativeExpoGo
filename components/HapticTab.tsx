import React from 'react';
import { TouchableOpacity, Vibration, Platform, GestureResponderEvent } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

export const HapticTab = (props: BottomTabBarButtonProps) => {
  const { onPress, accessibilityState, children } = props;

  const handlePress = (event: GestureResponderEvent) => {
    if (onPress) {
      onPress(event); // Передаём event в onPress
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 10,
      }}
    >
      {children}
    </TouchableOpacity>
  );
};