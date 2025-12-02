import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const reactionIcons = {
  like: 'thumbs-up',
  love: 'heart',
  laugh: 'happy',
  sad: 'sad',
  angry: 'sad', 
};

const MessageReaction = ({ messageId, currentReaction, onReactionChange }) => {
  const [showReactions, setShowReactions] = useState(false);

  const handleReactionSelect = (reaction) => {
    const newReaction = currentReaction === reaction ? null : reaction;
    onReactionChange(messageId, newReaction);
    setShowReactions(false);
  };

  const renderReactionIcon = (reaction) => {
    const iconName = reactionIcons[reaction] || 'happy';
    const isActive = currentReaction === reaction;
    return <Ionicons name={iconName} size={24} color={isActive ? '#007bff' : '#999'} />;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setShowReactions(!showReactions)}>
        {currentReaction ? renderReactionIcon(currentReaction) : <Ionicons name="happy-outline" size={20} color="#999" />}
      </TouchableOpacity>

      {showReactions && (
        <View style={styles.reactionContainer}>
          {Object.keys(reactionIcons).map((reaction) => (
            <TouchableOpacity
              key={reaction}
              onPress={() => handleReactionSelect(reaction)}
              style={styles.reactionButton}
            >
              {renderReactionIcon(reaction)}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 30,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 5,
    elevation: 2,
  },
  reactionButton: {
    marginHorizontal: 5,
  },
});

export default MessageReaction;