// components/ui/TabBarBackground.js
import React from 'react';
import { View } from 'react-native';

export default function TabBarBackground() {
  return (
    <View
      style={{
        backgroundColor: '#FFFFFF', // Белый фон
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        borderTopWidth: 1,
        borderTopColor: '#0000001A',
      }}
    />
  );
}