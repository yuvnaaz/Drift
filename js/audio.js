// Drift Meditative Audio Synthesizer using Web Audio API

class MeditativeAudio {
  constructor() {
    this.ctx = null;
    this.isInitialized = false;
    this.isMuted = true;

    // Nodes references
    this.masterGain = null;
    
    // Background Pad (drone)
    this.padOsc1 = null;
    this.padOsc2 = null;
    this.padGain = null;
    
    // Wind Breeze (white noise + LFO filtered)
    this.windSource = null;
    this.windFilter = null;
    this.windGain = null;
    this.windLfo = null;
    
    // Generative Music
    this.musicTimer = null;
    this.scale = [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // A3, C4, D4, E4, G4, A4, C5, D5, E5
  }

  // Initialize the audio context. Must be triggered via user interaction.
  init() {
    if (this.isInitialized) return;

    try {
      // Create context
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      // Master gain node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime); // start silent
      this.masterGain.connect(this.ctx.destination);
      
      this.setupPad();
      this.setupWind();
      
      // Start ambient generative chimes sequencer
      this.startGenerativeMusic();
      
      this.isInitialized = true;
      console.log("Drift Meditative Audio Initialized successfully.");
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser:", e);
    }
  }

  setupPad() {
    const now = this.ctx.currentTime;
    
    // Create twin oscillators for chorus-like beating drone
    this.padOsc1 = this.ctx.createOscillator();
    this.padOsc2 = this.ctx.createOscillator();
    
    // Triangle wave for smooth, flute-like soft tones
    this.padOsc1.type = 'triangle';
    this.padOsc2.type = 'triangle';
    
    // A2 (110Hz) and E3 (165Hz) - A peaceful perfect fifth interval
    this.padOsc1.frequency.setValueAtTime(110.00, now);
    this.padOsc2.frequency.setValueAtTime(164.81, now);
    
    // Detune slightly for lush chorusing
    this.padOsc1.detune.setValueAtTime(-5, now);
    this.padOsc2.detune.setValueAtTime(5, now);
    
    // Lowpass filter to filter out any mid-to-high buzz
    const padFilter = this.ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.setValueAtTime(250, now);
    padFilter.Q.setValueAtTime(1.5, now);
    
    // Gain control for the pad
    this.padGain = this.ctx.createGain();
    this.padGain.gain.setValueAtTime(0.06, now); // low, soft ambient background
    
    // Connect
    this.padOsc1.connect(padFilter);
    this.padOsc2.connect(padFilter);
    padFilter.connect(this.padGain);
    this.padGain.connect(this.masterGain);
    
    // Start oscillators
    this.padOsc1.start(0);
    this.padOsc2.start(0);
  }

  setupWind() {
    const now = this.ctx.currentTime;
    const sampleRate = this.ctx.sampleRate;
    
    // Create a 2-second buffer of white noise
    const bufferSize = sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    // Noise source node
    this.windSource = this.ctx.createBufferSource();
    this.windSource.buffer = noiseBuffer;
    this.windSource.loop = true;
    
    // Bandpass filter to isolate a slice of frequencies representing blowing wind
    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(700, now);
    this.windFilter.Q.setValueAtTime(1.0, now); // soft width
    
    // LFO to modulate filter frequency (creates wave/wind movement)
    this.windLfo = this.ctx.createOscillator();
    this.windLfo.type = 'sine';
    this.windLfo.frequency.setValueAtTime(0.12, now); // slow cycle (~8 seconds)
    
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(220, now); // sweep range
    
    // Gain control for wind volume
    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.01, now); // starts very soft
    
    // Connections
    this.windLfo.connect(lfoGain);
    lfoGain.connect(this.windFilter.frequency);
    
    this.windSource.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    
    // Start noise source and LFO
    this.windSource.start(0);
    this.windLfo.start(0);
  }

  // Adjust wind volume dynamic to the wind currents strength/count in the game
  setWindIntensity(intensity) {
    if (!this.isInitialized || this.isMuted) return;
    const targetGain = 0.01 + intensity * 0.04; // scale range
    const targetFilterQ = 1.0 + intensity * 0.8; // narrow wind when stronger
    
    const now = this.ctx.currentTime;
    this.windGain.gain.setTargetAtTime(targetGain, now, 0.5);
    this.windFilter.Q.setTargetAtTime(targetFilterQ, now, 0.5);
  }

  toggleMute() {
    this.init(); // ensure initialized on click
    if (!this.ctx) return true;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    if (this.isMuted) {
      // Unmute: fade master gain up smoothly to 1.0
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(1.0, now + 1.2);
      this.isMuted = false;
    } else {
      // Mute: fade master gain down smoothly to 0.0
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.linearRampToValueAtTime(0.0, now + 0.8);
      this.isMuted = true;
    }
    return this.isMuted;
  }

  // Play a soft high chime when placing an arrow
  playPlaceArrow() {
    if (!this.isInitialized || this.isMuted) return;
    this.playTone(880, 'sine', 0.1, 0.03); // A5 (high A)
  }

  // Play a gentle descending chord when recalling the boat
  playRecall() {
    if (!this.isInitialized || this.isMuted) return;
    const now = this.ctx.currentTime;
    // Ascending E-A-B pentatonic chord arpeggio
    this.playTone(329.63, 'sine', 0.4, 0.05, now);      // E4
    this.playTone(220.00, 'sine', 0.5, 0.04, now + 0.1);  // A3
    this.playTone(164.81, 'sine', 0.6, 0.03, now + 0.2);  // E3
  }

  // Play a warm, damped deep woodblock or bell sound on soft collision
  playBounce() {
    if (!this.isInitialized || this.isMuted) return;
    
    // Damped low frequency triangle wave + brief sine wave ring
    const now = this.ctx.currentTime;
    this.playTone(180, 'triangle', 0.25, 0.15, now);
    this.playTone(183, 'sine', 0.15, 0.08, now); // slightly detuned for organic sound
  }

  // Play a gorgeous ascending pentatonic arpeggio for victory
  playVictory() {
    if (!this.isInitialized || this.isMuted) return;
    
    const now = this.ctx.currentTime;
    const notes = [
      440.00, // A4
      493.88, // B4
      554.37, // C#5
      659.25, // E5
      739.99, // F#5
      880.00  // A5
    ];
    
    // Stagger notes to sound like a wind chime cascade
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.8, 0.06 - (idx * 0.005), now + idx * 0.1);
    });
  }

  // Play a sparkling high-pitched arpeggio when a lotus blooms
  playLotusBloom() {
    if (!this.isInitialized || this.isMuted) return;
    
    const now = this.ctx.currentTime;
    // High-pitched shimmering notes: E5, G5, A5, C6, D6
    const notes = [659.25, 783.99, 880.00, 1046.50, 1174.66];
    
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.8, 0.04, now + idx * 0.06);
    });
  }

  // Helper function to synthesize a single decaying tone
  playTone(freq, type, duration, volume, startTime = null) {
    const time = startTime || this.ctx.currentTime;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    // Envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.08); // slow attack for piano feel
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration); // smooth decay
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(time);
    osc.stop(time + duration + 0.1);
  }

  // Generative music sequencer (slow pentatonic chimes in background)
  startGenerativeMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);

    // Play a note every 6.5 seconds with 1.5s random timing variance
    const scheduleNext = () => {
      if (this.isInitialized && !this.isMuted) {
        this.playGenerativeNote();
      }
      const nextDelay = 5500 + Math.random() * 3000;
      this.musicTimer = setTimeout(scheduleNext, nextDelay);
    };
    
    // Start loop
    scheduleNext();
  }

  playGenerativeNote() {
    const now = this.ctx.currentTime;
    
    // Pick random note from scale
    const noteIdx = Math.floor(Math.random() * this.scale.length);
    const freq = this.scale[noteIdx];
    
    // Play root chime note (soft sine)
    this.playTone(freq, 'sine', 5.0, 0.02, now);
    
    // 35% chance to play a soft harmonizing third/fifth or octave note
    if (Math.random() < 0.38) {
      // Choose a harmonizing offset (e.g. +2, +4, or +7 scale indices)
      const offset = [2, 4, 7][Math.floor(Math.random() * 3)];
      const harmFreq = this.scale[(noteIdx + offset) % this.scale.length];
      
      // Delay slightly for organic stagger
      const delay = 0.15 + Math.random() * 0.25;
      
      this.playTone(harmFreq, 'sine', 4.5, 0.012, now + delay);
    }
  }

  // Sinking sound (downward pitch glide + splash)
  playSink() {
    if (!this.isInitialized || this.isMuted) return;
    
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    // Glide downward to represent sinking
    osc.frequency.exponentialRampToValueAtTime(80, now + 1.4);
    
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.045, now + 0.05); // attack
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4); // fade out
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(now);
    osc.stop(now + 1.5);
    
    // Add a secondary soft noise splash
    try {
      const splashFilter = this.ctx.createBiquadFilter();
      splashFilter.type = 'lowpass';
      splashFilter.frequency.setValueAtTime(400, now);
      splashFilter.frequency.exponentialRampToValueAtTime(120, now + 1.0);
      
      const splashGain = this.ctx.createGain();
      splashGain.gain.setValueAtTime(0.012, now);
      splashGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.0);
      
      // Re-use noise buffer from wind system if active
      if (this.windSource && this.windSource.buffer) {
        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = this.windSource.buffer;
        noiseSource.connect(splashFilter);
        splashFilter.connect(splashGain);
        splashGain.connect(this.masterGain);
        noiseSource.start(now);
        noiseSource.stop(now + 1.1);
      }
    } catch(e) {}
  }
}

// Export single instance
export const audio = new MeditativeAudio();
export default audio;
