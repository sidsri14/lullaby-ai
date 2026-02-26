import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Check, X, Info } from 'lucide-react-native';

const ToastContext = createContext<{ showToast: (msg: string, type?: 'success' | 'error' | 'info') => void } | null>(null);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within a ToastProvider');
    return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-100)).current;

    const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
        setToast({ msg, type });
        
        // Reset animations
        fadeAnim.setValue(0);
        slideAnim.setValue(-100);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 60, // Top offset
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto hide
        setTimeout(() => {
            hideToast();
        }, 3000);
    };

    const hideToast = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => setToast(null));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Animated.View style={[
                    styles.toastContainer, 
                    { 
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
                    <View style={[styles.toastContent, styles[toast.type]]}>
                        {toast.type === 'success' && <Check color="#FFF" size={20} />}
                        {toast.type === 'error' && <X color="#FFF" size={20} />}
                        {toast.type === 'info' && <Info color="#FFF" size={20} />}
                        <Text style={styles.toastText}>{toast.msg}</Text>
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
};

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
        elevation: 10,
    },
    toastContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        minWidth: 200,
        justifyContent: 'center',
    },
    toastText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 14,
    },
    success: {
        backgroundColor: '#10B981',
    },
    error: {
        backgroundColor: '#EF4444',
    },
    info: {
        backgroundColor: '#3B82F6',
    }
});
