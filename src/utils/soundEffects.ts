// Arcade Sound Effects System
// Using Web Audio API to generate 8-bit style sounds

class SoundEffectsManager {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = false;
  private volume: number = 0.3;

  constructor() {
    // Load preferences from localStorage
    const saved = localStorage.getItem('vibeRouletteSoundSettings');
    if (saved) {
      try {
        const { enabled, volume } = JSON.parse(saved);
        this.enabled = enabled ?? false;
        this.volume = volume ?? 0.3;
      } catch (e) {
        console.error('Failed to load sound settings:', e);
      }
    }
  }

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.saveSettings();
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getVolume(): number {
    return this.volume;
  }

  private saveSettings() {
    localStorage.setItem('vibeRouletteSoundSettings', JSON.stringify({
      enabled: this.enabled,
      volume: this.volume,
    }));
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = 'square') {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = type;
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      console.error('Error playing sound:', e);
    }
  }

  // Arcade-style sound effects
  spin() {
    if (!this.enabled) return;
    // Ascending chirp
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(200, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.3);

    gainNode.gain.setValueAtTime(this.volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  match() {
    // Success jingle
    if (!this.enabled) return;
    const notes = [262, 330, 392, 523]; // C, E, G, C (major chord)
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine'), i * 80);
    });
  }

  fileSave() {
    // Quick blip
    this.playTone(1000, 0.05, 'square');
  }

  aiResponse() {
    // Power-up sound
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(100, now);
    oscillator.frequency.exponentialRampToValueAtTime(1000, now + 0.4);

    gainNode.gain.setValueAtTime(this.volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    oscillator.start(now);
    oscillator.stop(now + 0.4);
  }

  error() {
    // Descending buzz
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    gainNode.gain.setValueAtTime(this.volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }

  success() {
    // Rising arpeggio
    if (!this.enabled) return;
    const notes = [523, 659, 784]; // C, E, G
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.1, 'sine'), i * 50);
    });
  }

  click() {
    // Tiny click sound
    this.playTone(800, 0.02, 'square');
  }

  typing() {
    // Subtle typing click (very quiet)
    if (!this.enabled) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    const noise = ctx.createOscillator();
    const gainNode = ctx.createGain();

    noise.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.type = 'square';
    noise.frequency.value = 1000;

    gainNode.gain.setValueAtTime(this.volume * 0.1, now); // Very quiet
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.01);

    noise.start(now);
    noise.stop(now + 0.01);
  }
}

export const soundEffects = new SoundEffectsManager();

