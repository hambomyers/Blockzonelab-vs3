/**
* core/audio-system.js - Enhanced audio with better drop sounds
*/

export class AudioSystem {
   constructor(config) {
       this.volume = config.get('audio.masterVolume') || 0.5;
       this.enabled = config.get('audio.soundEffects') !== false;
       this.ctx = null;
       this.initialized = false;
       this.config = config;
   }

   init() {
       if (this.ctx) {
           this.initialized = true;
           return;
       }
       try {
           this.ctx = new (window.AudioContext || window.webkitAudioContext)();
           this.initialized = true;
           
           // Resume immediately if suspended
           if (this.ctx.state === 'suspended') {
               this.ctx.resume();
           }
       } catch (e) {
           this.enabled = false;
       }
   }

   playSound(type, params = {}) {
       // Initialize on first use
       if (!this.ctx) {
           this.init();
       }
       
       if (!this.enabled || !this.ctx) {
           return;
       }

       // Resume if suspended
       if (this.ctx.state === 'suspended') {
           this.ctx.resume().then(() => {
               this.playSoundInternal(type, params);
           });
           return;
       }

       this.playSoundInternal(type, params);
   }

   playSoundInternal(type, params = {}) {
       const now = this.ctx.currentTime;

       switch(type) {
           case 'rotate':
               this.playRotate(now);
               break;
           case 'land':
               this.playLand(now);
               break;
           case 'drop':
               this.playDrop(now);
               break;
           case 'clear':
               this.playClear(now, params.lines || 1);
               break;
       }
   }

   playRotate(now) {
       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();
       osc.type = 'square';
       osc.frequency.setValueAtTime(1200, now);
       gain.gain.setValueAtTime(this.volume * 0.0375, now);
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
       osc.connect(gain);
       gain.connect(this.ctx.destination);
       osc.start(now);
       osc.stop(now + 0.03);
   }

   playLand(now) {
       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();
       osc.type = 'sine';
       osc.frequency.setValueAtTime(120, now);
       gain.gain.setValueAtTime(this.volume * 1.2, now);
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
       osc.connect(gain);
       gain.connect(this.ctx.destination);
       osc.start(now);
       osc.stop(now + 0.15);
   }

   playDrop(now) {
       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();
       osc.type = 'sine';
       osc.frequency.setValueAtTime(80, now);
       gain.gain.setValueAtTime(this.volume * 0.6, now);
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
       osc.connect(gain);
       gain.connect(this.ctx.destination);
       osc.start(now);
       osc.stop(now + 0.1);
   }

   playClear(now, lines) {
       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();
       osc.type = 'sine';
       
       // Progressive frequency increase
       const baseFreq = 400;
       const freqIncrease = 100;
       osc.frequency.setValueAtTime(baseFreq + (lines * freqIncrease), now);
       
       // Progressive volume increase: 1 line = 1.0x, 2 lines = 1.5x, 3 lines = 2.2x, 4 lines = 3.0x
       const volumeMultipliers = [1.0, 1.5, 2.2, 3.0];
       const volumeMultiplier = volumeMultipliers[Math.min(lines - 1, 3)];
       gain.gain.setValueAtTime(this.volume * volumeMultiplier, now);
       
       // Shorter, punchier sound for more impact
       const duration = 0.015 + (lines * 0.005); // Slightly longer for more lines
       gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
       osc.connect(gain);
       gain.connect(this.ctx.destination);
       osc.start(now);
       osc.stop(now + duration);
   }

   setVolume(volume) {
       this.volume = Math.max(0, Math.min(1, volume));
   }

   mute() { this.enabled = false; }
   unmute() { this.enabled = true; }
   toggle() { this.enabled = !this.enabled; }
}

