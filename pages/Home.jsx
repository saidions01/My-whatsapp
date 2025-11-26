import React from "react";
import { StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Profile from "./Profile";
import Discussions from "./discussions";
import NewUser from "./NewUser";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

const Tab = createBottomTabNavigator();

export default function Home() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: "#3478f6",
        tabBarInactiveTintColor: "#777",
      }}
      initialRouteName="Discussions"
    >
      <Tab.Screen
        name="Discussions"
        component={Discussions}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="chat" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Add User"
        component={NewUser}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-add" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    elevation: 5,
    height: 60,
    backgroundColor: "#fff",
  },
});
