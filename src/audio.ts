import { AudioSourceProvider } from './audio-source';
import { PatternProvider } from './pattern-provider';

export class AudioService {
    private audioContext: AudioContext;
    private clickBuffer: AudioBuffer | null = null;
    private rhytmBuffer: AudioBuffer | null = null;
    private isPlaying: boolean = false;
    private nextNoteTime: number = 0;
    private currentBeat: number = 0;
    private schedulerID: number = 0;
    private isSilent: boolean = false;


    private onPatternComplete?: () => void;
    private onBarComplete?: (barIndex: number) => void;

    constructor(private bpm: number = 120, private patternProvider: PatternProvider) {

        this.audioContext = new AudioContext();
        this.loadSounds();
        this.setupVisibilityHandler();
    }

    private setupVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            this.isSilent = document.hidden;

            if (!this.isSilent) {
                this.nextNoteTime = this.audioContext.currentTime;
            }
        });
    }

    private async loadSounds() {
        // Convert base64 to binary data
        const clickData = await fetch(AudioSourceProvider.CLICK_MP3_BASE64).then(r => r.arrayBuffer());
        const rhytmData = await fetch(AudioSourceProvider.RHYTM_MP3_BASE64).then(r => r.arrayBuffer());

        this.clickBuffer = await this.audioContext.decodeAudioData(clickData);
        this.rhytmBuffer = await this.audioContext.decodeAudioData(rhytmData);
    }

    public setOnPatternComplete(callback: () => void) {
        this.onPatternComplete = callback;
    }

    public setOnBarComplete(callback: (barIndex: number) => void) {
        this.onBarComplete = callback
    }

    private scheduleNote(time: number, isRhytm: boolean = false) {
        if (this.isSilent) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = isRhytm ? this.rhytmBuffer : this.clickBuffer;
        source.connect(this.audioContext.destination);
        source.start(time);
    }

    private nextNote() {
        const secondsPerBeat = 60.0 / this.bpm;
        this.nextNoteTime += secondsPerBeat / 4;
        this.currentBeat++;
    }

    private scheduler() {

        const countInBeats = 16;

        while (this.nextNoteTime < this.audioContext.currentTime + 0.1) {
            const isCountIn = this.currentBeat < countInBeats;
            const beatIn16th = (this.currentBeat) % 16;

            // Play click only on quarter notes (every 4th 16th note)
            if (beatIn16th % 4 === 0) {
                this.scheduleNote(this.nextNoteTime);
            }

            // Play rhythm after count-in if pattern indicates
            if (!isCountIn && this.patternProvider.getCurrentPattern()[beatIn16th]) {
                this.scheduleNote(this.nextNoteTime, true);
            }

            // Trigger pattern change callback when pattern completes
            if (!isCountIn) {

                if ((this.currentBeat - countInBeats) % 32 === 31 && this.onPatternComplete) {
                    this.onPatternComplete();
                }

                if ((this.currentBeat - countInBeats) % 16 === 15 && this.onBarComplete) {
                    this.onBarComplete(Math.floor((this.currentBeat - countInBeats) / 16));
                }
            }

            this.nextNote();
        }
        this.schedulerID = requestAnimationFrame(this.scheduler.bind(this));
    }

    setBPM(bpm: number) {
        this.bpm = bpm;
    }

    start() {
        if (this.isPlaying)
            return;

        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        this.isPlaying = true;
        this.currentBeat = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.scheduler();
    }

    stop() {
        if (!this.isPlaying) return;

        this.isPlaying = false;
        cancelAnimationFrame(this.schedulerID);
    }
}