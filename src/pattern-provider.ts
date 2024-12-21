export class PatternProvider {
    private rhythmSeed: number = 0;
    private currentPatternNumber: number = 0;

    private lastPatternNumber: number = -1;
    private lastRhythmSeed: number = -1;
    private cachedPattern: number[] = [];

    private static readonly MAX_CONSECUTIVE_ONES = 3;
    private static readonly MAX_CONSECUTIVE_ZEROS = 4;
    private static readonly ATTEMPT_SEED_MULTIPLIER = 31337; // Large prime

    constructor() {
        this.newSeed();
    }

    public newSeed() {
        this.rhythmSeed = Math.random();
    }

    public getCurrentPattern(): number[] {
        // Check if cache is valid
        if (this.lastPatternNumber === this.currentPatternNumber && 
            this.lastRhythmSeed === this.rhythmSeed) {
            return this.cachedPattern;
        }
    
        // Generate new pattern and update cache
        const newPattern = this.getPattern(this.currentPatternNumber);
        this.lastPatternNumber = this.currentPatternNumber;
        this.lastRhythmSeed = this.rhythmSeed;
        this.cachedPattern = newPattern;
        
        return newPattern;
    }

    public getNextPattern(): number[] {
        return this.getPattern(this.currentPatternNumber + 1);
    }

    public advancePattern() {
        this.currentPatternNumber++;
    }

    private seededRandom(index: number, patternNumber: number): number {
        const x = Math.sin(this.rhythmSeed * 13 + patternNumber * 7919 + index * 11) * 10000;
        return x - Math.floor(x);
    }

    private isValid(pattern: number[]): boolean {
        const len = pattern.length;
        const maxConsecutive = Math.max(PatternProvider.MAX_CONSECUTIVE_ONES, PatternProvider.MAX_CONSECUTIVE_ZEROS);
        let consecutiveOnes = 0;
        let consecutiveZeros = 0;
        
        // Start checking maxConsecutive positions before index 0
        for (let i = -maxConsecutive; i < len; i++) {
            const value = pattern[(i + len) % len]; 
            
            consecutiveOnes = value === 1 ? consecutiveOnes + 1 : 0;
            consecutiveZeros = value === 0 ? consecutiveZeros + 1 : 0;
            
            if (consecutiveOnes > PatternProvider.MAX_CONSECUTIVE_ONES) return false;
            if (consecutiveZeros > PatternProvider.MAX_CONSECUTIVE_ZEROS) return false;
        }
        
        return true;
    }

    private getPattern(patternNumber: number): number[] {
        const maxAttempts = 10;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const attemptSeed = patternNumber + (attempt * PatternProvider.ATTEMPT_SEED_MULTIPLIER);
            const pattern = Array(16).fill(0).map((_, i) => {
                return this.seededRandom(i, attemptSeed) > 0.5 ? 1 : 0;
            });

            if (this.isValid(pattern)) {
                return pattern;
            }
        }

        return Array(16).fill(0).map((_, i) => i % 2); // Fallback to alternating pattern
    }
}