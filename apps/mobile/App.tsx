import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeScreen from './screens/HomeScreen';
import HistoryScreen from './screens/HistoryScreen';
import MemoirScreen from './screens/MemoirScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  Home: '🏠',
  History: '💬',
  Memoir: '📖',
  Settings: '⚙️',
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: () => (
              <Text style={{ fontSize: 24 }}>
                {TAB_ICONS[route.name]}
              </Text>
            ),
            tabBarActiveTintColor: '#7F77DD',
            tabBarInactiveTintColor: '#AAA',
            tabBarStyle: { height: 70, paddingBottom: 8 },
            tabBarLabelStyle: { fontSize: 14 },
            headerShown: false,
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '홈 / ホーム' }} />
          <Tab.Screen name="History" component={HistoryScreen} options={{ tabBarLabel: '대화 / 会話' }} />
          <Tab.Screen name="Memoir" component={MemoirScreen} options={{ tabBarLabel: '이야기 / 物語' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: '설정 / 設定' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
