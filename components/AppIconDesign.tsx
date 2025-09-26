import React from 'react';
import { View, StyleSheet } from 'react-native';

// This is a simple icon component that represents our app icon design
// In a real app, you would use this as a reference to create actual PNG files
export default function AppIconComponent() {
  return (
    <View style={styles.container}>
      {/* This represents the design we want for our app icon */}
      {/* Background: Blue gradient */}
      {/* Foreground: White dollar sign with chart bars */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 1024,
    height: 1024,
    backgroundColor: '#007AFF',
    borderRadius: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Icon Design Specifications:
// - Background: Blue gradient (#007AFF to #0056CC)
// - Shape: Rounded rectangle (200px border radius)
// - Main Element: White dollar sign ($) with upward trending chart bars
// - Style: Modern, minimalist, professional
// - Colors: Blue background, white foreground
// - Size: 1024x1024px for high resolution
