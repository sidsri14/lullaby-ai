import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ActivityIndicator, Modal, FlatList, Animated, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Square, RefreshCw, Check, X, History, Clock, Sparkles, Zap } from 'lucide-react-native';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { cryAnalysisService, AnalysisResult } from '../services/CryAnalysisService';
import { useToast } from '../components/Toast';

import { usageService } from '../services/UsageService';

const { width } = Dimensions.get('window');

export default function CryTranslatorScreen({ navigation }: any) {
    const [isListening, setIsListening] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<(AnalysisResult & { timestamp?: string })[]>([]);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

    useEffect(() => {
        if (isListening) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [isListening]);

    const loadHistory = async () => {
        const h = await cryAnalysisService.getHistory();
        setHistory(h);
    };

    useEffect(() => {
        return () => {
            // Hook handles cleanup. Manual stop causes crash.
        };
    }, []);

    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    const { showToast } = useToast();

    const handleToggleListening = async () => {
        if (isListening) {
            await stopListening();
        } else {
            await startListening();
        }
    };

    const startListening = async () => {
        try {
            // Check usage limit
            const canProceed = await usageService.incrementUsage();
            if (!canProceed) {
                navigation.navigate('Paywall');
                return;
            }

            const permission = await AudioModule.requestRecordingPermissionsAsync();
            if (!permission.granted) {
                showToast('Microphone permission required', 'error');
                return;
            }

            await audioRecorder.prepareToRecordAsync();
            audioRecorder.record();
            setIsListening(true);
            setResult(null);
            setFeedbackSubmitted(false);
        } catch (error) {
            showToast('Failed to start recording', 'error');
            console.error(error);
        }
    };

    const stopListening = async () => {
        try {
            setIsListening(false);
            setIsAnalyzing(true);

            await audioRecorder.stop();
            const uri = audioRecorder.uri;

            if (uri) {
                const analysis = await cryAnalysisService.analyzeAudio(uri);
                setResult(analysis);
            } else {
                showToast('Failed to capture audio', 'error');
            }
        } catch (error) {
            showToast('Analysis failed', 'error');
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setIsListening(false);
        setFeedbackSubmitted(false);
    };

    const handleFeedback = (correct: boolean) => {
        setFeedbackSubmitted(true);
        console.log('User feedback recorded:', correct ? 'Correct' : 'Incorrect');
    };

    if (result) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Analysis Result</Text>
                    {result.isRealAi ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139, 92, 246, 0.2)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 }}>
                            <Sparkles size={14} color="#A78BFA" style={{ marginRight: 6 }} />
                            <Text style={{ color: '#A78BFA', fontSize: 12, fontWeight: '600' }}>AI Analyzed</Text>
                        </View>
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(94, 234, 212, 0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginTop: 8 }}>
                            <Zap size={14} color="#5EEAD4" style={{ marginRight: 6 }} />
                            <Text style={{ color: '#5EEAD4', fontSize: 12, fontWeight: '600' }}>Smart Prediction</Text>
                        </View>
                    )}
                </View>

                <View style={styles.resultContainer}>
                    <Text style={styles.resultLabel}>{result.label}</Text>
                    <Text style={styles.confidenceText}>{Math.round(result.confidence * 100)}% Confidence</Text>
                    <Text style={styles.descriptionText}>{result.description}</Text>

                    <View style={styles.feedbackContainer}>
                        {feedbackSubmitted ? (
                            <View style={styles.thankYouContainer}>
                                <Check color="#10B981" size={32} />
                                <Text style={styles.thankYouText}>Thanks for your feedback!</Text>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.feedbackTitle}>Was this correct?</Text>
                                <View style={styles.feedbackButtons}>
                                    <TouchableOpacity style={[styles.feedbackButton, styles.correctButton]} onPress={() => handleFeedback(true)}>
                                        <Check color="#FFF" size={24} />
                                        <Text style={styles.feedbackButtonText}>Yes</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={[styles.feedbackButton, styles.incorrectButton]} onPress={() => handleFeedback(false)}>
                                        <X color="#FFF" size={24} />
                                        <Text style={styles.feedbackButtonText}>No</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>

                    <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                        <RefreshCw color="#FFF" size={24} />
                        <Text style={styles.resetButtonText}>Listen Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Lullaby AI</Text>
                <Text style={styles.headerSubtitle}>Tap to translate cry</Text>
            </View>

            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 40 }}>
                <Animated.View style={[styles.circleContainer, isListening && styles.listeningCircle, { transform: [{ scale: pulseAnim }] }]}>
                    <TouchableOpacity
                        style={styles.listenButton}
                        onPress={handleToggleListening}
                        activeOpacity={0.8}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <ActivityIndicator size="large" color="#FFFFFF" />
                        ) : isListening ? (
                            <Square size={48} color="#FFFFFF" fill="#FFFFFF" />
                        ) : (
                            <Mic size={64} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </Animated.View>
                <Text style={styles.statusText}>
                    {isAnalyzing ? 'Analyzing...' : isListening ? 'Listening... Tap to Stop' : 'Tap to Listen'}
                </Text>

                {!isListening && !isAnalyzing && (
                    <TouchableOpacity onPress={() => { loadHistory(); setShowHistory(true); }} style={styles.historyButton}>
                        <History color="#94A3B8" size={20} />
                        <Text style={styles.historyButtonText}>View History</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <Modal visible={showHistory} animationType="slide" presentationStyle="pageSheet">
                <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
                    <View style={{ padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white' }}>Cry History</Text>
                        <TouchableOpacity onPress={() => setShowHistory(false)}>
                            <X color="white" size={24} />
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={history}
                        keyExtractor={(item, index) => index.toString()}
                        contentContainerStyle={{ padding: 20 }}
                        renderItem={({ item }) => (
                            <View style={{ backgroundColor: '#1E293B', padding: 16, borderRadius: 12, marginBottom: 12 }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text style={{ color: '#818CF8', fontWeight: 'bold', fontSize: 18 }}>{item.label}</Text>
                                    <Text style={{ color: '#94A3B8' }}>{Math.round(item.confidence * 100)}%</Text>
                                </View>
                                <Text style={{ color: '#CBD5E1', marginBottom: 8 }}>{item.description}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Clock color="#64748B" size={14} style={{ marginRight: 4 }} />
                                    <Text style={{ color: '#64748B', fontSize: 12 }}>
                                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Just now'}
                                    </Text>
                                </View>
                            </View>
                        )}
                    />
                </SafeAreaView>
            </Modal>
        </SafeAreaView >
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
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleContainer: {
        width: width * 0.6,
        height: width * 0.6,
        borderRadius: width * 0.3,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 32,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    listeningCircle: {
        backgroundColor: '#312E81',
        shadowOpacity: 0.6,
        shadowRadius: 30,
        borderWidth: 2,
        borderColor: '#818CF8',
    },
    listenButton: {
        width: width * 0.4,
        height: width * 0.4,
        borderRadius: width * 0.2,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    statusText: {
        fontSize: 20,
        fontWeight: '600',
        color: '#E2E8F0',
    },
    resultContainer: {
        flex: 1,
        alignItems: 'center',
        padding: 24,
        justifyContent: 'center',
    },
    resultLabel: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#818CF8',
        marginBottom: 16,
    },
    confidenceText: {
        fontSize: 18,
        color: '#94A3B8',
        marginBottom: 24,
    },
    descriptionText: {
        fontSize: 18,
        color: '#E2E8F0',
        textAlign: 'center',
        marginBottom: 48,
        lineHeight: 28,
    },
    feedbackContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 48,
    },
    feedbackTitle: {
        fontSize: 16,
        color: '#94A3B8',
        marginBottom: 16,
    },
    feedbackButtons: {
        flexDirection: 'row',
        gap: 16,
    },
    feedbackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8,
    },
    correctButton: {
        backgroundColor: '#10B981',
    },
    incorrectButton: {
        backgroundColor: '#EF4444',
    },
    feedbackButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    resetButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#334155',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        gap: 12,
    },
    resetButtonText: {
        color: '#F8FAFC',
        fontSize: 18,
        fontWeight: '600',
    },
    suggestionButton: {
        backgroundColor: '#6366F1',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        marginBottom: 32,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    suggestionText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 32,
        padding: 12,
        backgroundColor: '#1E293B',
        borderRadius: 20,
        gap: 8,
    },
    historyButtonText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
    },
    thankYouContainer: {
        alignItems: 'center',
        gap: 8,
    },
    thankYouText: {
        color: '#10B981',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
