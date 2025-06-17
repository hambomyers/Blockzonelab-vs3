/**
* audio-system.js - Clean, classic block game sounds
*
* Simple, satisfying, and perfect for competitive play
*/

export class AudioSystem {
   constructor(config) {
       this.config = config;
       this.ctx = null;
       this.initialized = false;
       this.enabled = true;
       this.lastPlayed = new Map();

       // Get volume from config
       this.volume = config.get('audio.masterVolume') || 0.3;

       // Listen for volume changes
       config.onChange('audio.masterVolume', (newVolume) => {
           this.volume = newVolume;
       });
   }

   /**
    * Initialize audio context
    */
   init() {
       if (this.initialized) return true;

       try {
           this.ctx = new (window.AudioContext || window.webkitAudioContext)();
           this.initialized = true;

           if (this.ctx.state === 'suspended') {
               this.ctx.resume().catch(e => {
                   // Failed to resume audio context - continue silently
               });
           }

           // Audio system initialized successfully
           return true;
       } catch (e) {
           // Audio initialization failed - continue silently
           this.enabled = false;
           return false;
       }
   }

   /**
    * Play a sound by type
    */
   playSound(type, params = {}) {
       if (!this.enabled || !this.config.get('audio.soundEffects')) return;

       if (!this.initialized) {
           if (!this.init()) return;
       }

       // Simple cooldown to prevent spam
       const now = Date.now();
       const cooldown = 50;
       const lastTime = this.lastPlayed.get(type) || 0;

       if (now - lastTime < cooldown) return;
       this.lastPlayed.set(type, now);

       // Play the appropriate sound
       try {
           switch(type) {
               case 'move':
                   this.playMoveSound();
                   break;
               case 'rotate':
                   this.playRotateSound();
                   break;
               case 'drop':
                   this.playDropSound();
                   break;
               case 'land':
                   this.playLandSound();
                   break;
               case 'lock':
                   this.playLockSound();
                   break;
               case 'clear':
                   this.playLineClearSound(params.lines || 1);
                   break;
               case 'hold':
                   this.playHoldSound();
                   break;
               case 'levelup':
                   this.playLevelUpSound();
                   break;
               case 'gameover':
                   this.playGameOverSound();
                   break;
               case 'pause':
                   this.playPauseSound();
                   break;
               case 'invalid':
                   this.playInvalidSound();
                   break;
           }
       } catch (e) {
           // Failed to play sound - continue silently
       }
   }

   // ============ CLASSIC SOUND GENERATORS ============

   /**
    * Move - Subtle tick
    */
   playMoveSound() {
       const now = this.ctx.currentTime;

       // Short click
       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();

       osc.type = 'square';
       osc.frequency.setValueAtTime(800, now);

       gain.gain.setValueAtTime(this.volume * 0.1, now);
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.01);

       osc.connect(gain);
       gain.connect(this.ctx.destination);

       osc.start(now);
       osc.stop(now + 0.02);
   }

   /**
    * Rotate - Higher pitched tick
    */
   playRotateSound() {
       const now = this.ctx.currentTime;

       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();

       osc.type = 'square';
       osc.frequency.setValueAtTime(1200, now);

       gain.gain.setValueAtTime(this.volume * 0.15, now);
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

       osc.connect(gain);
       gain.connect(this.ctx.destination);

       osc.start(now);
       osc.stop(now + 0.03);
   }

   /**
    * Drop - Quick swoosh
    */
   playDropSound() {
       const now = this.ctx.currentTime;

       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();

       osc.type = 'sawtooth';
       osc.frequency.setValueAtTime(2000, now);
       osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);

       gain.gain.setValueAtTime(this.volume * 0.2, now);
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

       osc.connect(gain);
       gain.connect(this.ctx.destination);

       osc.start(now);
       osc.stop(now + 0.12);
   }

   /**
    * Land - Deep thud
    */
   playLandSound() {
       const now = this.ctx.currentTime;

       // Low frequency thud with more bass
       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();

       osc.type = 'sine';
       osc.frequency.setValueAtTime(45, now); // Deeper frequency (was 60)

       gain.gain.setValueAtTime(this.volume * 0.5, now); // Louder (was 0.3)
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12); // Longer duration (was 0.08)

       osc.connect(gain);
       gain.connect(this.ctx.destination);

       osc.start(now);
       osc.stop(now + 0.15); // Longer stop time (was 0.1)

       // Add a deeper click for impact
       const click = this.ctx.createOscillator();
       const clickGain = this.ctx.createGain();

       click.type = 'square';
       click.frequency.setValueAtTime(150, now); // Deeper click (was 200)

       clickGain.gain.setValueAtTime(this.volume * 0.15, now); // Louder click (was 0.1)
       clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015); // Slightly longer (was 0.01)

       click.connect(clickGain);
       clickGain.connect(this.ctx.destination);

       click.start(now);
       click.stop(now + 0.025); // Longer click (was 0.02)
   }

   /**
    * Lock - Satisfying click
    */
   playLockSound() {
       const now = this.ctx.currentTime;

       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();

       osc.type = 'square';
       osc.frequency.setValueAtTime(600, now);

       gain.gain.setValueAtTime(this.volume * 0.25, now);
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

       osc.connect(gain);
       gain.connect(this.ctx.destination);

       osc.start(now);
       osc.stop(now + 0.05);
   }

   /**
    * Line clear - Classic ascending tones
    */
   playLineClearSound(lineCount) {
       const now = this.ctx.currentTime;

       // Base frequencies for each line count
       const frequencies = {
           1: [400, 600, 800],
           2: [400, 600, 800, 1000],
           3: [400, 600, 800, 1000, 1200],
           4: [400, 500, 600, 800, 1000, 1200, 1600] // Four lines!
       };

       const tones = frequencies[lineCount] || frequencies[1];
       const noteLength = lineCount === 4 ? 0.06 : 0.04;

       tones.forEach((freq, i) => {
           const delay = i * noteLength;

           const osc = this.ctx.createOscillator();
           const gain = this.ctx.createGain();

           osc.type = 'square';
           osc.frequency.setValueAtTime(freq, now + delay);

           const volume = this.volume * (0.2 + lineCount * 0.05);
           gain.gain.setValueAtTime(0, now + delay);
           gain.gain.linearRampToValueAtTime(volume, now + delay + 0.01);
           gain.gain.exponentialRampToValueAtTime(0.001, now + delay + noteLength);

           osc.connect(gain);
           gain.connect(this.ctx.destination);

           osc.start(now + delay);
           osc.stop(now + delay + noteLength + 0.01);
       });
   }

   /**
    * Hold - Soft whoosh
    */
   playHoldSound() {
       const now = this.ctx.currentTime;

       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();

       osc.type = 'sine';
       osc.frequency.setValueAtTime(300, now);
       osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);

       gain.gain.setValueAtTime(this.volume * 0.15, now);
       gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

       osc.connect(gain);
       gain.connect(this.ctx.destination);

       osc.start(now);
       osc.stop(now + 0.12);
   }

   /**
    * Level up - Victory fanfare
    */
   playLevelUpSound() {
       const now = this.ctx.currentTime;
       const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

       notes.forEach((freq, i) => {
           const delay = i * 0.08;
           const osc = this.ctx.createOscillator();
           const gain = this.ctx.createGain();

           osc.type = 'square';
           osc.frequency.setValueAtTime(freq, now + delay);

           gain.gain.setValueAtTime(this.volume * 0.2, now + delay);
           gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);

           osc.connect(gain);
           gain.connect(this.ctx.destination);

           osc.start(now + delay);
           osc.stop(now + delay + 0.2);
       });
   }

   /**
    * Game over - Descending tones
    */
   playGameOverSound() {
       const now = this.ctx.currentTime;
       const notes = [800, 600, 400, 200];

       notes.forEach((freq, i) => {
           const delay = i * 0.15;
           const osc = this.ctx.createOscillator();
           const gain = this.ctx.createGain();

           osc.type = 'square';
           osc.frequency.setValueAtTime(freq, now + delay);

           gain.gain.setValueAtTime(this.volume * 0.3, now + delay);
           gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.3);

           osc.connect(gain);
           gain.connect(this.ctx.destination);

           osc.start(now + delay);
           osc.stop(now + delay + 0.4);
       });
   }

   /**
    * Pause - Two-tone beep
    */
   playPauseSound() {
       const now = this.ctx.currentTime;

       // First beep
       const osc1 = this.ctx.createOscillator();
       const gain1 = this.ctx.createGain();

       osc1.type = 'square';
       osc1.frequency.setValueAtTime(800, now);

       gain1.gain.setValueAtTime(this.volume * 0.15, now);
       gain1.gain.setValueAtTime(0, now + 0.08);

       osc1.connect(gain1);
       gain1.connect(this.ctx.destination);

       osc1.start(now);
       osc1.stop(now + 0.1);

       // Second beep
       const osc2 = this.ctx.createOscillator();
       const gain2 = this.ctx.createGain();

       osc2.type = 'square';
       osc2.frequency.setValueAtTime(600, now + 0.1);

       gain2.gain.setValueAtTime(this.volume * 0.15, now + 0.1);
       gain2.gain.setValueAtTime(0, now + 0.18);

       osc2.connect(gain2);
       gain2.connect(this.ctx.destination);

       osc2.start(now + 0.1);
       osc2.stop(now + 0.2);
   }

   /**
    * Invalid move - Error buzz
    */
   playInvalidSound() {
       const now = this.ctx.currentTime;

       const osc = this.ctx.createOscillator();
       const gain = this.ctx.createGain();

       osc.type = 'sawtooth';
       osc.frequency.setValueAtTime(100, now);

       gain.gain.setValueAtTime(this.volume * 0.15, now);
       gain.gain.setValueAtTime(0, now + 0.05);

       osc.connect(gain);
       gain.connect(this.ctx.destination);

       osc.start(now);
       osc.stop(now + 0.06);
   }

   // ============ UTILITY METHODS ============

   setVolume(volume) {
       this.volume = Math.max(0, Math.min(1, volume));
       this.config.set('audio.masterVolume', this.volume);
   }

   mute() {
       this.enabled = false;
       this.config.set('audio.soundEffects', false);
   }

   unmute() {
       this.enabled = true;
       this.config.set('audio.soundEffects', true);
   }

   toggle() {
       if (this.enabled) {
           this.mute();
       } else {
           this.unmute();
       }
   }
}
