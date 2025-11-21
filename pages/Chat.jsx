import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, FlatList } from 'react-native';
import firebase from '../config/firebase';

export default function Chat({ route }) {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const user = firebase.auth().currentUser;

  useEffect(() => {
    const messagesRef = firebase.database().ref(`chats/${chatId}/messages`);
    messagesRef.on('value', snapshot => {
      const data = snapshot.val() || {};
      const parsedMessages = Object.keys(data).map(key => ({
        id: key,
        ...data[key],
      }));
      setMessages(parsedMessages);
    });

    return () => messagesRef.off();
  }, [chatId]);

  const sendMessage = () => {
    if (!newMessage) return;
    const messagesRef = firebase.database().ref(`chats/${chatId}/messages`);
    messagesRef.push({
      text: newMessage,
      sender: user.uid,
      createdAt: firebase.database.ServerValue.TIMESTAMP,
    });
    setNewMessage('');
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <FlatList
        data={messages.sort((a, b) => a.createdAt - b.createdAt)}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Text>{item.sender === user.uid ? 'Me' : item.sender}: {item.text}</Text>
        )}
      />
      <TextInput
        placeholder="Type your message"
        value={newMessage}
        onChangeText={setNewMessage}
        style={{ borderWidth: 1, marginBottom: 5, padding: 5 }}
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
}
