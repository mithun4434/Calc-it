
import { SoundId } from '../types';

class SoundService {
    private ctx: AudioContext | null = null;
    private gainNode: GainNode | null = null;

    private init() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContext();
                this.gainNode = this.ctx.createGain();
                this.gainNode.connect(this.ctx.destination);
            }
        }
        // Resume context if suspended (browser autoplay policy)
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    public play(id: SoundId) {
        if (id === 'mute') return;
        this.init();
        if (!this.ctx || !this.gainNode) return;

        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.gainNode!);

        switch (id) {
            case 'click': // Standard mobile click
                osc.frequency.setValueAtTime(600, t);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                osc.start(t);
                osc.stop(t + 0.05);
                break;

            case 'mechanical': // Low thud
                osc.frequency.setValueAtTime(150, t);
                osc.type = 'square';
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                osc.start(t);
                osc.stop(t + 0.08);
                break;

            case 'blip': // Scifi UI
                osc.frequency.setValueAtTime(800, t);
                osc.frequency.exponentialRampToValueAtTime(400, t + 0.1);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.1, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'retro': // 8-bit jump
                osc.frequency.setValueAtTime(220, t);
                osc.frequency.linearRampToValueAtTime(440, t + 0.1);
                osc.type = 'square';
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'water': // Droplet
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.exponentialRampToValueAtTime(1200, t + 0.15);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                osc.start(t);
                osc.stop(t + 0.15);
                break;
            
            case 'laser': // Pew
                osc.frequency.setValueAtTime(1000, t);
                osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.linearRampToValueAtTime(0, t + 0.15);
                osc.start(t);
                osc.stop(t + 0.15);
                break;

            case 'typewriter': // High tick
                osc.frequency.setValueAtTime(2000, t);
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0.15, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
                osc.start(t);
                osc.stop(t + 0.03);
                break;
            
            case 'wood': // Woodblock
                osc.frequency.setValueAtTime(800, t);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.3, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;

            case 'glass': // High ping
                osc.frequency.setValueAtTime(1200, t);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.05, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                osc.start(t);
                osc.stop(t + 0.3);
                break;
            
            case 'pop': // Mouth pop
                osc.frequency.setValueAtTime(400, t);
                osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
                osc.type = 'triangle';
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                osc.start(t);
                osc.stop(t + 0.1);
                break;
        }
    }
}

export const soundService = new SoundService();
