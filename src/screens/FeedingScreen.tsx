import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Baby, Clock, History, Save, Play, Pause, Square, Trash2 } from 'lucide-react-native';
import { feedingService, FeedingLog } from '../services/FeedingService';
import { useToast } from '../components/Toast';

export default function FeedingScreen() {
    const [activeTab, setActiveTab] = useState<'BOTTLE' | 'BREAST'>('BOTTLE');
    const [amount, setAmount] = useState('4'); // Default 4 oz
    const [logs, setLogs] = useState<FeedingLog[]>([]);

    const { showToast } = useToast();

    // Breastfeeding Timer State
    const [timerActive, setTimerActive] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [activeSide, setActiveSide] = useState<'LEFT' | 'RIGHT' | null>(null);

    useEffect(() => {
        loadLogs();
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerActive) {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive]);

    const loadLogs = async () => {
        const loadedLogs = await feedingService.getLogs();
        setLogs(loadedLogs);
    };

    const handleSaveBottle = async () => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            showToast('Please enter a valid amount', 'error');
            return;
        }

        try {
            await feedingService.logFeeding({
                type: 'BOTTLE',
                details: { amount: numAmount, unit: 'oz' },
            });
            loadLogs();
            showToast(`Logged ${numAmount} oz bottle feeding`, 'success');
        } catch (e) {
            showToast('Failed to save feeding', 'error');
        }
    };

    const toggleTimer = (side: 'LEFT' | 'RIGHT') => {
        if (timerActive && activeSide === side) {
            // Pause
            setTimerActive(false);
        } else if (timerActive && activeSide !== side) {
            // Switch side (stop current, start new? or just switch?) 
            // For simple MVP: Just switch active side tracking
            setActiveSide(side);
        } else {
            // Start
            setActiveSide(side);
            setTimerActive(true);
        }
    };

    const handleStopAndSaveBreast = async () => {
        if (seconds === 0) return;

        setTimerActive(false);

        try {
            await feedingService.logFeeding({
                type: 'BREAST',
                details: {
                    side: activeSide || 'BOTH',
                    durationSeconds: seconds
                },
            });
            setSeconds(0);
            setActiveSide(null);
            loadLogs();
            showToast('Breastfeeding session logged', 'success');
        } catch (e) {
            showToast('Failed to save feeding', 'error');
        }
    };

    const handleDeleteLog = async (id: string) => {
        await feedingService.deleteFeeding(id);
        loadLogs();
    };

    const formatTime = (totalSeconds: number) => {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#F8FAFC', marginBottom: 20 }}>
                    Feeding Tracker
                </Text>

                {/* Toggle */}
                <View style={{ flexDirection: 'row', backgroundColor: '#1E293B', borderRadius: 12, padding: 4, marginBottom: 24 }}>
                    <TouchableOpacity
                        onPress={() => setActiveTab('BOTTLE')}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'BOTTLE' ? '#3B82F6' : 'transparent',
                            borderRadius: 8
                        }}
                    >
                        <Text style={{ color: activeTab === 'BOTTLE' ? 'white' : '#94A3B8', fontWeight: '600' }}>Bottle</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setActiveTab('BREAST')}
                        style={{
                            flex: 1,
                            paddingVertical: 10,
                            alignItems: 'center',
                            backgroundColor: activeTab === 'BREAST' ? '#EC4899' : 'transparent',
                            borderRadius: 8
                        }}
                    >
                        <Text style={{ color: activeTab === 'BREAST' ? 'white' : '#94A3B8', fontWeight: '600' }}>Breast</Text>
                    </TouchableOpacity>
                </View>

                {/* BOTTLE FORM */}
                {activeTab === 'BOTTLE' && (
                    <View style={{ backgroundColor: '#1E293B', padding: 20, borderRadius: 16, alignItems: 'center' }}>
                        <Baby size={48} color="#60A5FA" style={{ marginBottom: 16 }} />
                        <Text style={{ color: '#94A3B8', marginBottom: 8 }}>Amount (oz)</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                            <TouchableOpacity onPress={() => setAmount(Math.max(0, parseFloat(amount || '0') - 0.5).toString())} style={styles.adjustBtn}>
                                <Text style={styles.adjustBtnText}>-</Text>
                            </TouchableOpacity>
                            <TextInput
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                style={{
                                    backgroundColor: '#334155',
                                    color: 'white',
                                    fontSize: 24,
                                    fontWeight: 'bold',
                                    paddingHorizontal: 20,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    minWidth: 80,
                                    textAlign: 'center',
                                    marginHorizontal: 12
                                }}
                            />
                            <TouchableOpacity onPress={() => setAmount((parseFloat(amount || '0') + 0.5).toString())} style={styles.adjustBtn}>
                                <Text style={styles.adjustBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleSaveBottle}
                            style={{ backgroundColor: '#3B82F6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50 }}
                        >
                            <Save size={20} color="white" style={{ marginRight: 8 }} />
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Log Bottle</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* BREAST FORM */}
                {activeTab === 'BREAST' && (
                    <View style={{ backgroundColor: '#1E293B', padding: 20, borderRadius: 16, alignItems: 'center' }}>
                        <Clock size={48} color="#F472B6" style={{ marginBottom: 16 }} />
                        <Text style={{ color: '#F8FAFC', fontSize: 48, fontWeight: 'bold', fontFamily: 'monospace', marginBottom: 24 }}>
                            {formatTime(seconds)}
                        </Text>

                        <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
                            <TouchableOpacity
                                onPress={() => toggleTimer('LEFT')}
                                style={[styles.timerBtn, { backgroundColor: activeSide === 'LEFT' && timerActive ? '#EF4444' : '#334155' }]}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Left</Text>
                                {activeSide === 'LEFT' && timerActive ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => toggleTimer('RIGHT')}
                                style={[styles.timerBtn, { backgroundColor: activeSide === 'RIGHT' && timerActive ? '#EF4444' : '#334155' }]}
                            >
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Right</Text>
                                {activeSide === 'RIGHT' && timerActive ? <Pause size={16} color="white" /> : <Play size={16} color="white" />}
                            </TouchableOpacity>
                        </View>

                        {seconds > 0 && (
                            <TouchableOpacity
                                onPress={handleStopAndSaveBreast}
                                style={{ backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 50 }}
                            >
                                <Square size={20} color="white" style={{ marginRight: 8 }} fill="white" />
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Finish & Save</Text>
                            </TouchableOpacity>
                        )}

                    </View>
                )}

                {/* HISTORY */}
                <View style={{ marginTop: 32 }}>
                    <Text style={{ color: '#94A3B8', fontSize: 14, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase' }}>Recent Activity</Text>
                    {logs.map(log => (
                        <View key={log.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 8 }}>
                            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: log.type === 'BOTTLE' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(236, 72, 153, 0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
                                {log.type === 'BOTTLE' ? <Baby size={20} color="#60A5FA" /> : <Clock size={20} color="#F472B6" />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ color: '#F8FAFC', fontWeight: 'bold', fontSize: 16 }}>
                                    {log.type === 'BOTTLE' ? `${log.details.amount} ${log.details.unit}` : `Breastfeed (${log.details.side})`}
                                </Text>
                                <Text style={{ color: '#94A3B8', fontSize: 14 }}>
                                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    {log.type === 'BREAST' && ` • ${Math.floor((log.details.durationSeconds || 0) / 60)} min`}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => handleDeleteLog(log.id)} style={{ padding: 8 }}>
                                <Trash2 size={20} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    adjustBtn: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center'
    },
    adjustBtnText: {
        color: 'white', fontSize: 24, fontWeight: 'bold'
    },
    timerBtn: {
        paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8
    }
});
