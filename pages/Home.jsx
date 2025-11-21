import React from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import Profile from './Profile';
import Discussions from './discussions';
import NewUser from './NewUser';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
const Tab = createBottomTabNavigator();

export default function Home() {
  return (
    <Tab.Navigator initialRouteName="Discussions">
      <Tab.Screen
        name="Discussions"
        component={Discussions}
        options={{
          tabBarIcon: ({ color }) => <Icon name="chatbubble-ellipses-outline" color={color} size={24} />,
        }}
      />
     
        <Tab.Screen
        name="Add User"
        component={NewUser}
        options={{
          tabBarIcon: ({ color }) => <Icon name="person-outline" color={color} size={24} />,
        }}
      />
       <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color }) => <Icon name="person-outline" color={color} size={24} />,
        }}
      />
    </Tab.Navigator>
  );
}
