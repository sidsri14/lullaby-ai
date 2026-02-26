import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Mic, Moon, Music, Baby, Settings } from 'lucide-react-native';
import CryTranslatorScreen from '../screens/CryTranslatorScreen';
import FeedingScreen from '../screens/FeedingScreen';
import WakeWindowScreen from '../screens/WakeWindowScreen';
import SootheScreen from '../screens/SootheScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#1E293B',
                    borderTopColor: '#334155',
                    paddingTop: 8,
                },
                tabBarActiveTintColor: '#818CF8',
                tabBarInactiveTintColor: '#94A3B8',
            }}
        >
            <Tab.Screen
                name="Translator"
                component={CryTranslatorScreen}
                options={{
                    tabBarLabel: 'Translator',
                    tabBarIcon: ({ color, size }) => <Mic color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Sleep"
                component={WakeWindowScreen}
                options={{
                    tabBarLabel: 'Sleep Coach',
                    tabBarIcon: ({ color, size }) => <Moon color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Soothe"
                component={SootheScreen}
                options={{
                    tabBarLabel: 'Soothe',
                    tabBarIcon: ({ color, size }) => <Music color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Feeding"
                component={FeedingScreen}
                options={{
                    tabBarLabel: 'Feeding',
                    tabBarIcon: ({ color, size }) => <Baby color={color} size={size} />,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarLabel: 'Settings',
                    tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
                }}
            />
        </Tab.Navigator>
    );
}
