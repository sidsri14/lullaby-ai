import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TabNavigator from './TabNavigator';
import PaywallScreen from '../screens/PaywallScreen';
import OnboardingScreen, { HAS_LAUNCHED_KEY } from '../screens/OnboardingScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
    const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

    useEffect(() => {
        AsyncStorage.getItem(HAS_LAUNCHED_KEY).then(value => {
            setIsFirstLaunch(value === null);
        });
    }, []);

    if (isFirstLaunch === null) {
        // Loading state
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0F172A' }}>
                <ActivityIndicator size="large" color="#6366F1" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator
                initialRouteName={isFirstLaunch ? "Onboarding" : "MainTabs"}
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0F172A' },
                }}
            >
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="MainTabs" component={TabNavigator} />
                <Stack.Screen
                    name="Paywall"
                    component={PaywallScreen}
                    options={{
                        presentation: 'modal',
                    }}
                />
                <Stack.Screen
                    name="Legal"
                    component={require('../screens/LegalScreen').default}
                    options={{ presentation: 'modal' }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
