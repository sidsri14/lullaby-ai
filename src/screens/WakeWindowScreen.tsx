import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Moon, Sun, Clock } from 'lucide-react-native';
import { sleepService, SleepLog } from '../services/SleepService';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function WakeWindowScreen() {
    const [isAsleep, setIsAsleep] = useState(false);
    const [nextNapTime, setNextNapTime] = useState<Date | null>(null);
    const [currentLog, setCurrentLog] = useState<SleepLog | null>(null);
    const [timeToNap, setTimeToNap] = useState<string>('');
    const [stats, setStats] = useState({ totalDuration: 0, avgDuration: 0, count: 0 });

    const loadStatus = async () => {
        const status = await sleepService.getCurrentStatus();
        setIsAsleep(status.isAsleep);
        if (status.currentLog) {
            setCurrentLog(status.currentLog);
        }

        if (!status.isAsleep) {
            const lastWake = await sleepService.getLastWakeTime();
            if (lastWake) {
                const next = sleepService.calculateNextNap(lastWake);
                setNextNapTime(next);
            }
        } else {
            setNextNapTime(null);
        }

        // Calculate Stats
        const logs = await sleepService.getLogs();
        const today = new Date().toDateString();
        const todaysLogs = logs.filter(l => l.endTime && new Date(l.startTime).toDateString() === today);

        let total = 0;
        todaysLogs.forEach(l => {
            if (l.endTime) {
                total += (new Date(l.endTime).getTime() - new Date(l.startTime).getTime());
            }
        });

        setStats({
            totalDuration: total,
            avgDuration: todaysLogs.length ? total / todaysLogs.length : 0,
            count: todaysLogs.length
        });
    };

    useFocusEffect(
        useCallback(() => {
            loadStatus();
        }, [])
    );

    useEffect(() => {
        const interval = setInterval(() => {
            if (nextNapTime && !isAsleep) {
                const now = new Date();
                const diff = nextNapTime.getTime() - now.getTime();

                if (diff > 0) {
                    const minutes = Math.floor(diff / 60000);
                    const hours = Math.floor(minutes / 60);
                    setTimeToNap(`${hours > 0 ? `${hours}h ` : ''}${minutes % 60}m`);
                } else {
                    setTimeToNap('Now');
                }
            }
        }, 1000); // Update every minute (or second for demo)

        return () => clearInterval(interval);
    }, [nextNapTime, isAsleep]);

    const toggleSleep = async () => {
        try {
            if (isAsleep) {
                // Wake up
                if (currentLog) {
                    await sleepService.logSleepEnd(currentLog.id);
                }
                setIsAsleep(false);
                setCurrentLog(null);
                await loadStatus(); // Recalculate next nap
            } else {
                // Go to sleep
                const newLog = await sleepService.logSleepStart();
                setCurrentLog(newLog);
                setIsAsleep(true);
                setNextNapTime(null);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update sleep status');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Sleep Coach</Text>
                <Text style={styles.headerSubtitle}>Track & Predict Sleep</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>Baby is currently</Text>
                    <Text style={[styles.statusValue, isAsleep ? styles.asleepText : styles.awakeText]}>
                        {isAsleep ? 'ASLEEP' : 'AWAKE'}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.actionButton, isAsleep ? styles.wakeButton : styles.sleepButton]}
                    onPress={toggleSleep}
                    activeOpacity={0.8}
                >
                    {isAsleep ? (
                        <>
                            <Sun size={32} color="#FFF" />
                            <Text style={styles.buttonText}>Wake Up</Text>
                        </>
                    ) : (
                        <>
                            <Moon size={32} color="#FFF" />
                            <Text style={styles.buttonText}>Start Sleep</Text>
                        </>
                    )}
                </TouchableOpacity>

                {!isAsleep && nextNapTime && (
                    <View style={styles.predictionContainer}>
                        <View style={styles.predictionHeader}>
                            <Clock size={24} color="#94A3B8" />
                            <Text style={styles.predictionTitle}>Next Nap Due</Text>
                        </View>
                        <Text style={styles.predictionTime}>
                            {nextNapTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.countdownText}>in {timeToNap}</Text>
                    </View>
                )}

                <View style={{ flexDirection: 'row', gap: 12, width: '100%', paddingHorizontal: 20 }}>
                    <View style={[styles.statCard, { flex: 1 }]}>
                        <Text style={styles.statLabel}>Today's Sleep</Text>
                        <Text style={styles.statValue}>{(stats.totalDuration / 3600000).toFixed(1)}h</Text>
                    </View>
                    <View style={[styles.statCard, { flex: 1 }]}>
                        <Text style={styles.statLabel}>Avg Nap</Text>
                        <Text style={styles.statValue}>{Math.round(stats.avgDuration / 60000)}m</Text>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
    },
    header: {
        padding: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#F8FAFC',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#94A3B8',
    },
    content: {
        flex: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    statusContainer: {
        alignItems: 'center',
    },
    statusLabel: {
        fontSize: 18,
        color: '#94A3B8',
        marginBottom: 12,
    },
    statusValue: {
        fontSize: 48,
        fontWeight: 'bold',
    },
    asleepText: {
        color: '#818CF8', // Indigo
    },
    awakeText: {
        color: '#F59E0B', // Amber
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: width * 0.7,
        paddingVertical: 20,
        borderRadius: 20,
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    sleepButton: {
        backgroundColor: '#312E81', // Dark Indigo
    },
    wakeButton: {
        backgroundColor: '#F59E0B', // Amber
    },
    buttonText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '600',
    },
    predictionContainer: {
        backgroundColor: '#1E293B',
        padding: 24,
        borderRadius: 24,
        width: '100%',
        alignItems: 'center',
    },
    predictionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    predictionTitle: {
        fontSize: 18,
        color: '#94A3B8',
    },
    predictionTime: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#F8FAFC',
        marginBottom: 4,
    },
    countdownText: {
        fontSize: 16,
        color: '#6366F1',
        fontWeight: '600',
    },
    statCard: {
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
    },
    statLabel: {
        color: '#94A3B8',
        fontSize: 14,
        marginBottom: 4,
    },
    statValue: {
        color: '#F8FAFC',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
