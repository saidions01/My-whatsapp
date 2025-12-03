import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const TypingIndicator = () => {
  const [dot1] = useState(new Animated.Value(0));
  const [dot2] = useState(new Animated.Value(0));
  const [dot3] = useState(new Animated.Value(0));

  useEffect(() => {
    const animateDots = () => {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dot2, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dot3, {
            toValue: 1,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
        Animated.parallel([
          Animated.timing(dot1, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(dot2, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
          Animated.timing(dot3, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]),
      ]).start(() => animateDots());
    };

    animateDots();
  }, [dot1, dot2, dot3]);

  const dotOpacity = (dot) => ({
    opacity: dot.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{`${""}`}</Text>
      <View style={styles.dotsContainer}>
        <Animated.Text style={[styles.dot, dotOpacity(dot1)]}>●</Animated.Text>
        <Animated.Text style={[styles.dot, dotOpacity(dot2)]}>●</Animated.Text>
        <Animated.Text style={[styles.dot, dotOpacity(dot3)]}>●</Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 12,
    color: '#999',
    marginRight: 5,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    fontSize: 16,
    color: '#999',
    marginHorizontal: 2,
  },
});

export default TypingIndicator;
