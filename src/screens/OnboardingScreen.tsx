import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, FlatList, Image, Animated, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Bell, ArrowRight, Check } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AudioModule } from 'expo-audio';
import * as Notifications from 'expo-notifications';

const SLIDES = [
    {
        id: '1',
        title: 'Understand Baby\'s Needs',
        description: 'Lullaby AI listens to your baby\'s cry and translates it into needs like Hunger, Sleep, or Diaper changes.',
        icon: 'mic',
    },
    {
        id: '2',
        title: 'Smart Sleep Predictions',
        description: 'Track wake windows and get notified exactly when your baby is ready to sleep—before the overtired tears start.',
        icon: 'bell',
    },
    {
        id: '3',
        title: 'Ready to Start?',
        description: 'We need access to your Microphone to hear the baby, and Notifications to alert you for sleep times.',
        icon: 'permissions',
    },
];

export const HAS_LAUNCHED_KEY = '@lullaby_has_launched';

export default function OnboardingScreen({ navigation }: any) {
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollX = useRef(new Animated.Value(0)).current;
    const slidesRef = useRef<FlatList>(null);
    const [permissionsGranted, setPermissionsGranted] = useState({ mic: false, notif: false });

    // Ensure we scroll to correct index on width change (orientation change)
    // useEffect(() => {
    //     slidesRef.current?.scrollToIndex({ index: currentIndex, animated: false });
    // }, [width]);

    const updateCurrentSlide = (e: any) => {
        const contentOffsetX = e.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / width);
        setCurrentIndex(index);
    };

    const scrollToNext = async () => {
        const nextSlideIndex = currentIndex + 1;
        if (nextSlideIndex < SLIDES.length) {
            slidesRef.current?.scrollToIndex({ index: nextSlideIndex, animated: true });
            setCurrentIndex(nextSlideIndex);
        } else {
            await finishOnboarding();
        }
    };

    const finishOnboarding = async () => {
        await AsyncStorage.setItem(HAS_LAUNCHED_KEY, 'true');
        navigation.replace('MainTabs');
    };
    // ... (permissions functions remain the same) ...

    const requestMic = async () => {
        try {
            const status = await AudioModule.requestRecordingPermissionsAsync();
            if (status.granted) {
                setPermissionsGranted(p => ({ ...p, mic: true }));
            }
        } catch (e) {
            console.warn(e);
        }
    };

    const requestNotif = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === 'granted') {
                setPermissionsGranted(p => ({ ...p, notif: true }));
            }
        } catch (e) {
            console.warn(e);
        }
    };

    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
        const isPermissionSlide = item.id === '3';

        return (
            <View style={[styles.itemContainer, { width }]}>
                <View style={[styles.imageContainer, { backgroundColor: getTokenColor(item.id) }]}>
                    {item.icon === 'mic' && <Mic size={80} color="#FFF" />}
                    {item.icon === 'bell' && <Bell size={80} color="#FFF" />}
                    {item.icon === 'permissions' && <Check size={80} color="#FFF" />}
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.description}>{item.description}</Text>

                    {isPermissionSlide && (
                        <View style={styles.permissionButtons}>
                            <TouchableOpacity
                                style={[styles.permButton, permissionsGranted.mic && styles.permButtonActive]}
                                onPress={requestMic}
                                disabled={permissionsGranted.mic}
                            >
                                <Mic size={20} color={permissionsGranted.mic ? '#FFF' : '#818CF8'} />
                                <Text style={[styles.permText, permissionsGranted.mic && styles.permTextActive]}>
                                    {permissionsGranted.mic ? 'Microphone Access' : 'Enable Microphone'}
                                </Text>
                                {permissionsGranted.mic && <Check size={16} color="#FFF" style={{ marginLeft: 'auto' }} />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.permButton, permissionsGranted.notif && styles.permButtonActive]}
                                onPress={requestNotif}
                                disabled={permissionsGranted.notif}
                            >
                                <Bell size={20} color={permissionsGranted.notif ? '#FFF' : '#818CF8'} />
                                <Text style={[styles.permText, permissionsGranted.notif && styles.permTextActive]}>
                                    {permissionsGranted.notif ? 'Notifications' : 'Enable Notifications'}
                                </Text>
                                {permissionsGranted.notif && <Check size={16} color="#FFF" style={{ marginLeft: 'auto' }} />}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    const getTokenColor = (id: string) => {
        switch (id) {
            case '1': return '#6366F1'; // Indigo
            case '2': return '#F59E0B'; // Amber
            case '3': return '#10B981'; // Emerald
            default: return '#6366F1';
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <View style={{ flex: 3 }}>
                <FlatList
                    data={SLIDES}
                    renderItem={renderItem}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    pagingEnabled
                    bounces={false}
                    keyExtractor={(item) => item.id}
                    onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                        useNativeDriver: false,
                    })}
                    onMomentumScrollEnd={updateCurrentSlide}
                    scrollEventThrottle={32}
                    ref={slidesRef}
                    getItemLayout={(data, index) => ({ length: width, offset: width * index, index })}
                />
            </View>

            <View style={styles.footer}>
                {/* Paginator */}
                <View style={styles.paginator}>
                    {SLIDES.map((_, i) => {
                        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
                        const dotWidth = scrollX.interpolate({
                            inputRange,
                            outputRange: [10, 20, 10],
                            extrapolate: 'clamp',
                        });
                        const opacity = scrollX.interpolate({
                            inputRange,
                            outputRange: [0.3, 1, 0.3],
                            extrapolate: 'clamp',
                        });

                        return (
                            <Animated.View
                                key={i.toString()}
                                style={[styles.dot, { width: dotWidth, opacity }]}
                            />
                        );
                    })}
                </View>

                {/* Next Button */}
                <TouchableOpacity style={styles.button} onPress={scrollToNext}>
                    <Text style={styles.buttonText}>
                        {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                    </Text>
                    {currentIndex !== SLIDES.length - 1 && <ArrowRight size={20} color="#FFF" />}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    imageContainer: {
        width: 160,
        height: 160,
        borderRadius: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    textContainer: {
        alignItems: 'center',
        maxWidth: '80%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#F8FAFC',
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 50,
        width: '100%',
        alignItems: 'center',
    },
    paginator: {
        flexDirection: 'row',
        height: 64,
    },
    dot: {
        height: 10,
        borderRadius: 5,
        backgroundColor: '#6366F1',
        marginHorizontal: 8,
    },
    button: {
        flexDirection: 'row',
        backgroundColor: '#6366F1',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        gap: 8,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    permissionButtons: {
        marginTop: 32,
        width: '100%',
        gap: 12,
    },
    permButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#334155',
        width: 280,
    },
    permButtonActive: {
        backgroundColor: '#10B981',
        borderColor: '#10B981',
    },
    permText: {
        color: '#818CF8',
        fontWeight: '600',
        marginLeft: 12,
        fontSize: 16,
    },
    permTextActive: {
        color: '#FFF',
    },
});
