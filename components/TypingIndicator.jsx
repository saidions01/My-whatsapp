import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const TypingIndicator = () => {
  const animations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const animate = (index) => {
      Animated.sequence([
        Animated.timing(animations[index], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(animations[index], {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Chain to next dot
        const nextIndex = (index + 1) % 3;
        animate(nextIndex);
      });
    };

    // Start the chain
    animate(0);

    return () => {
      animations.forEach(anim => anim.stopAnimation());
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>typing...</Text>
      <View style={styles.dotsContainer}>
        {animations.map((anim, index) => (
          <Animated.Text 
            key={index}
            style={[
              styles.dot,
              {
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
                transform: [{
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -3],
                  }),
                }],
              },
            ]}
          >
            ●
          </Animated.Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginLeft: 50,
    marginBottom: 5,
  },
  label: {
    fontSize: 12,
    color: '#666',
    marginRight: 6,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    fontSize: 8,
    color: '#666',
    marginHorizontal: 1,
  },
});

export default TypingIndicator;