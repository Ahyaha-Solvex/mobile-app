import React from "react";
import { View } from "react-native";
import { NavigationContainer, createNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { colors, fontWeight, navTheme } from "../theme";
import HomeScreen from "../screens/app/HomeScreen";
import DevicesScreen from "../screens/app/DevicesScreen";
import MapScreen from "../screens/app/MapScreen";
import MessagesScreen from "../screens/app/MessagesScreen";
import ProfileScreen from "../screens/app/ProfileScreen";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

export const navigationRef = createNavigationContainerRef<any>();

const TAB_ICONS: Record<
  string,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Home: { active: "home", inactive: "home-outline" },
  Cars: { active: "car", inactive: "car-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

function AppTabs() {
  // Raise the tab bar above the Android system navigation buttons / home indicator.
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#8B98A6",
        tabBarLabelStyle: { fontSize: 10, fontWeight: fontWeight.bold, letterSpacing: 0.2 },
        tabBarIconStyle: { marginTop: 1 },
        tabBarStyle: {
          backgroundColor: "rgba(255,255,255,0.97)",
          borderTopColor: "#E5EAED",
          borderTopWidth: 1,
          height: 78 + insets.bottom,
          paddingTop: 6,
          paddingBottom: 10 + insets.bottom,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Home;
          const name = focused ? icons.active : icons.inactive;
          const iconSize = focused ? size + 1.5 : size;
          return (
            <View style={{ alignItems: "center", justifyContent: "center", marginTop: 1 }}>
              <Ionicons name={name} size={iconSize} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Tab.Screen
        name="Cars"
        component={DevicesScreen}
        options={{ title: "My cars", headerShown: false }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

/** Tabs + screens opened on top of the tabs (Map from crash popups, Inbox from events). */
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="App" component={AppTabs} />
      <Stack.Screen name="Map" component={MapScreen} options={{ animation: "slide_from_right" }} />
      <Stack.Screen name="Messages" component={MessagesScreen} options={{ animation: "slide_from_right" }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#EFF5F7" },
        animation: "default",
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme as any}>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
