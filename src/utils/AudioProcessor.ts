import * as FileSystem from 'expo-file-system';
import { Buffer } from 'buffer';

export interface AudioFeatures {
    volume: number;      // 0.0 to 1.0 (Approximate energy)
    pitch: number;       // Hz (Approximate zero-crossing rate)
    duration: number;    // seconds
    isRhythmic: boolean; // Simple variance check
}

export class AudioProcessor {

    // Helper to decode Base64 to Float32Array
    private static decodeAudioData(base64: string): Float32Array {
        const binaryString = Buffer.from(base64, 'base64').toString('binary');
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Very rough "WAV to PCM" approximation
        // Real WAV parsing is complex, but for MVP we assume 16-bit PCM mono/stereo
        // We slip the header (approx 44 bytes) and just read raw samples
        const samples = new Float32Array(Math.floor((len - 44) / 2));
        const view = new DataView(bytes.buffer);

        // Start after header
        let idx = 0;
        for (let i = 44; i < len - 2; i += 2) {
            // Read Int16 and normalize to -1.0 to 1.0
            const sample = view.getInt16(i, true) / 32768.0;
            samples[idx++] = sample;
        }

        return samples;
    }

    static async processFile(uri: string): Promise<AudioFeatures> {
        try {
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            const samples = this.decodeAudioData(base64);

            if (samples.length === 0) {
                return { volume: 0, pitch: 0, duration: 0, isRhythmic: false };
            }

            // 1. Calculate RMS Volume
            let sumSquares = 0;
            for (let i = 0; i < samples.length; i++) {
                sumSquares += samples[i] * samples[i];
            }
            const rms = Math.sqrt(sumSquares / samples.length);
            // Amplify for detection sensitivity (arbitrary gain)
            const volume = Math.min(1.0, rms * 5);

            // 2. Calculate Zero-Crossing Rate (Pitch Estimate)
            let zeroCrossings = 0;
            for (let i = 1; i < samples.length; i++) {
                if ((samples[i - 1] > 0 && samples[i] <= 0) || (samples[i - 1] < 0 && samples[i] >= 0)) {
                    zeroCrossings++;
                }
            }
            // Assuming 44100Hz sample rate (standard for many recorders)
            // Frequency = ZCR * SampleRate / 2
            const estimatedFrequency = (zeroCrossings * 44100) / (2 * samples.length);

            // 3. Rhythm/Variance (Standard Deviation of amplitude chunks)
            // Break into 10 chunks
            const chunkSize = Math.floor(samples.length / 10);
            const chunkVolumes: number[] = [];
            for (let i = 0; i < 10; i++) {
                let chunkSum = 0;
                const start = i * chunkSize;
                const end = start + chunkSize;
                for (let j = start; j < end; j++) {
                    chunkSum += Math.abs(samples[j]);
                }
                chunkVolumes.push(chunkSum / chunkSize);
            }

            // Calc variance of chunks
            const avgChunkVol = chunkVolumes.reduce((a, b) => a + b, 0) / 10;
            const variance = chunkVolumes.reduce((a, b) => a + Math.pow(b - avgChunkVol, 2), 0) / 10;
            const isRhythmic = variance < 0.05; // Low variance = steady noise (vacuum), High = cry bursts

            return {
                volume,
                pitch: estimatedFrequency,
                duration: samples.length / 44100,
                isRhythmic
            };

        } catch (error) {
            console.warn('Audio Processing Failed:', error);
            // Fallback safe values
            return { volume: 0.5, pitch: 400, duration: 0, isRhythmic: false };
        }
    }
}
