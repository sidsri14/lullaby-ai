import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { Play, Pause, Volume2 } from 'lucide-react-native';

import { Asset } from 'expo-asset';

const { width } = Dimensions.get('window');

interface SoundTrack {
    id: string;
    title: string;
    category: 'White Noise' | 'Nature' | 'Womb' | 'Instrumental';
    uri: string;
}

const TRACKS: SoundTrack[] = [
    { id: '1', title: 'Calm Melody', category: 'White Noise', uri: Asset.fromModule(require('../../assets/calm-no-copyright-459737.mp3')).uri },
    { id: '2', title: 'Gentle Piano', category: 'Instrumental', uri: Asset.fromModule(require('../../assets/background-music-soft-calm-404429.mp3')).uri },
    { id: '3', title: 'Acoustic Quest', category: 'Womb', uri: Asset.fromModule(require('../../assets/calm-acoustic-quiet-quest-251658.mp3')).uri },
];



export default function SootheScreen({ route }: any) {
    const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    // We need a way to control the player from the parent UI.
    // We can hold a reference to the current player methods?
    const [playerControl, setPlayerControl] = useState<{ play: () => void; pause: () => void } | null>(null);

    useEffect(() => {
        if (route.params?.trackId) {
            setCurrentTrackId(route.params.trackId);
        }
    }, [route.params?.trackId]);

    const handlePlayerMount = (control: { play: () => void; pause: () => void }) => {
        setPlayerControl(control);
        setIsPlaying(true); // Auto play on mount
    };

    const togglePlayback = () => {
        if (isPlaying) {
            playerControl?.pause();
            setIsPlaying(false);
        } else {
            playerControl?.play();
            setIsPlaying(true);
        }
    };

    const handleTrackPress = useCallback((trackId: string) => {
        if (currentTrackId === trackId) {
            togglePlayback();
        } else {
            setCurrentTrackId(trackId);
        }
    }, [currentTrackId, isPlaying, playerControl]);

    const renderTrack = useCallback(({ item }: { item: SoundTrack }) => {
        return (
            <TrackItem
                item={item}
                isActive={currentTrackId === item.id}
                isPlaying={isPlaying && currentTrackId === item.id} // Only show playing state if this track is active AND playing
                onPress={handleTrackPress}
                onTogglePlayback={togglePlayback}
            />
        );
    }, [currentTrackId, isPlaying, handleTrackPress, togglePlayback]);

    const activeTrack = TRACKS.find(t => t.id === currentTrackId);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Soothe</Text>
                <Text style={styles.headerSubtitle}>Calming Sounds</Text>
            </View>

            <FlatList
                data={TRACKS}
                renderItem={renderTrack}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                extraData={{ currentTrackId, isPlaying }} // Ensure list updates when state changes
            />

            {/* This invisible component handles the audio for the active track */}
            {activeTrack && (
                <AudioController
                    key={activeTrack.id} // Remounts when track changes
                    uri={activeTrack.uri}
                    onReady={handlePlayerMount}
                    onPlayStatusChange={setIsPlaying}
                />
            )}

            {currentTrackId && (
                <View style={styles.playerContainer}>
                    <Text style={styles.nowPlayingText}>
                        Now Playing: {activeTrack?.title}
                    </Text>
                    <TouchableOpacity style={styles.mainControl} onPress={togglePlayback}>
                        {isPlaying ? (
                            <Pause size={32} color="#FFF" />
                        ) : (
                            <Play size={32} color="#FFF" />
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

// Memoized Track Item Component
const TrackItem = React.memo(({
    item,
    isActive,
    isPlaying,
    onPress,
    onTogglePlayback
}: {
    item: SoundTrack;
    isActive: boolean;
    isPlaying: boolean;
    onPress: (id: string) => void;
    onTogglePlayback: () => void;
}) => {
    return (
        <TouchableOpacity
            style={[styles.trackCard, isActive && styles.activeCard]}
            onPress={() => onPress(item.id)}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                <Volume2 size={24} color={isActive ? '#FFF' : '#818CF8'} />
            </View>
            <View style={styles.trackInfo}>
                <Text style={[styles.trackTitle, isActive && styles.activeText]}>{item.title}</Text>
                <Text style={[styles.trackCategory, isActive && styles.activeSubText]}>{item.category}</Text>
            </View>
            {isActive && (
                <TouchableOpacity onPress={onTogglePlayback} style={styles.miniControl}>
                    {isPlaying ? (
                        <Pause size={20} color="#FFF" />
                    ) : (
                        <Play size={20} color="#FFF" />
                    )}
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
});

// Sub-component to isolate the hook
function AudioController({ uri, onReady, onPlayStatusChange }: { uri: string, onReady: (c: any) => void, onPlayStatusChange: (p: boolean) => void }) {
    const player = useAudioPlayer(uri);

    useEffect(() => {
        // Pass control up
        onReady({
            play: () => player.play(),
            pause: () => player.pause()
        });

        // Auto play
        player.loop = true;
        player.play();

        // useAudioPlayer handles cleanup automatically. 
        // Manual pause here causes "shared object released" error.
    }, []);

    return null;
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
    listContent: {
        padding: 24,
        gap: 16,
    },
    trackCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    activeCard: {
        backgroundColor: '#6366F1',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    trackInfo: {
        flex: 1,
    },
    trackTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#F8FAFC',
        marginBottom: 4,
    },
    trackCategory: {
        fontSize: 14,
        color: '#94A3B8',
    },
    activeText: {
        color: '#FFF',
    },
    activeSubText: {
        color: 'rgba(255,255,255,0.8)',
    },
    miniControl: {
        padding: 8,
    },
    playerContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1E293B',
        padding: 24,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    nowPlayingText: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '600',
    },
    mainControl: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#6366F1',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
