import { appState, notifyStateChange } from './state';

const YT_VIDEO_ID = 'ffCAdXPO0K0';

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private synthStepTimer: any = null;
  private synthStep = 0;
  private ytPlayer: any = null;
  private ytReady = false;
  private ytPlaying = false;
  private isUnlocked = false;

  init() {
    this.initYouTube();
    this.setupGestureUnlock();
  }

  private setupGestureUnlock() {
    const unlock = () => {
      if (!this.isUnlocked) {
        this.isUnlocked = true;
        this.initWebAudio();
        if (appState.audioPlaying) {
          this.play();
        }
      }
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
  }

  private initWebAudio() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.value = appState.audioVolume * 0.45;
        this.masterGain.connect(this.audioCtx.destination);
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private playLogDrum(freq: number, time: number, dur = 0.24) {
    if (!this.audioCtx || !this.masterGain) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 1.6, time);
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.045);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.65, time + dur);

    gain.gain.setValueAtTime(0.001, time);
    gain.gain.linearRampToValueAtTime(0.75, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + dur + 0.02);
  }

  private playShaker(time: number, accent = false) {
    if (!this.audioCtx || !this.masterGain) return;
    const bufferSize = Math.floor(this.audioCtx.sampleRate * 0.045);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 6800;
    filter.Q.value = 2.2;

    const gain = this.audioCtx.createGain();
    gain.gain.value = accent ? 0.22 : 0.10;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(time);
  }

  private playWarmChord(freqs: number[], time: number, dur = 0.55) {
    if (!this.audioCtx || !this.masterGain) return;
    freqs.forEach((f) => {
      const osc = this.audioCtx!.createOscillator();
      const gain = this.audioCtx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, time);

      gain.gain.setValueAtTime(0.001, time);
      gain.gain.linearRampToValueAtTime(0.11, time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(time);
      osc.stop(time + dur + 0.02);
    });
  }

  private startSynthLoop() {
    this.initWebAudio();
    if (this.synthStepTimer) return;
    const stepMs = (60 / 106 / 4) * 1000; // 16th-note at 106 BPM (~141.5ms)
    const bassNotes = [110, 110, 130.81, 146.83, 164.81, 146.83, 130.81, 98.0];
    const chords = [
      [220.0, 261.63, 329.63, 392.0], // Am7
      [174.61, 220.0, 261.63, 349.23], // Fmaj7
      [196.0, 246.94, 293.66, 392.0], // G6
      [164.81, 196.0, 246.94, 329.63]  // Em7
    ];

    this.synthStepTimer = setInterval(() => {
      if (!appState.audioPlaying) return;
      if (appState.audioEngine === 'youtube' || (appState.audioEngine === 'hybrid' && this.ytPlaying)) {
        return;
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const s = this.synthStep % 16;

      // Afrobeat Shaker on 16th notes
      this.playShaker(now, s % 4 === 0 || s === 3 || s === 11);

      // Syncopated Log-Drum Bassline
      if (s === 0 || s === 3 || s === 6 || s === 10 || s === 12 || s === 14) {
        const note = bassNotes[(this.synthStep >> 1) % bassNotes.length];
        this.playLogDrum(note, now, s === 0 || s === 10 ? 0.28 : 0.18);
      }

      // Warm Luxury Rhodes Chords
      if (s === 0 || s === 6) {
        const chord = chords[Math.floor(this.synthStep / 16) % chords.length];
        this.playWarmChord(chord, now, 0.48);
      }

      this.synthStep++;
      if (!appState.audioLoop && this.synthStep >= 256) {
        this.stop();
      }
    }, stepMs);
  }

  private stopSynthLoop() {
    if (this.synthStepTimer) {
      clearInterval(this.synthStepTimer);
      this.synthStepTimer = null;
    }
  }

  private initYouTube() {
    const existing = document.getElementById('yt-script');
    if (!existing) {
      const tag = document.createElement('script');
      tag.id = 'yt-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }

    (window as any).onYouTubeIframeAPIReady = () => {
      const container = document.getElementById('yt-player-container');
      if (!container) return;
      this.ytPlayer = new (window as any).YT.Player('yt-player-container', {
        width: '1',
        height: '1',
        videoId: YT_VIDEO_ID,
        playerVars: {
          autoplay: 0,
          controls: 0,
          loop: 1,
          playlist: YT_VIDEO_ID,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            this.ytReady = true;
            event.target.setVolume(Math.round(appState.audioVolume * 100));
            if (appState.audioPlaying && appState.audioEngine !== 'synth') {
              event.target.playVideo();
            }
          },
          onStateChange: (event: any) => {
            if (event.data === 1) {
              this.ytPlaying = true;
            } else if (event.data === 0) {
              this.ytPlaying = false;
              if (appState.audioLoop && appState.audioPlaying) {
                event.target.seekTo(0);
                event.target.playVideo();
              }
            } else {
              this.ytPlaying = false;
            }
          },
          onError: () => {
            this.ytPlaying = false;
            if (appState.audioPlaying && appState.audioEngine !== 'youtube') {
              this.startSynthLoop();
            }
          }
        }
      });
    };
  }

  play() {
    this.initWebAudio();
    appState.audioPlaying = true;
    if (appState.audioEngine !== 'youtube') {
      this.startSynthLoop();
    }
    if (this.ytReady && this.ytPlayer && appState.audioEngine !== 'synth') {
      try {
        this.ytPlayer.unMute();
        this.ytPlayer.setVolume(Math.round(appState.audioVolume * 100));
        this.ytPlayer.playVideo();
      } catch (_) {}
    }
    notifyStateChange();
  }

  stop() {
    appState.audioPlaying = false;
    this.stopSynthLoop();
    if (this.ytReady && this.ytPlayer) {
      try {
        this.ytPlayer.pauseVideo();
        this.ytPlayer.seekTo(0);
      } catch (_) {}
    }
    this.ytPlaying = false;
    notifyStateChange();
  }

  setVolume(vol: number) {
    appState.audioVolume = vol;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(vol * 0.45, this.audioCtx.currentTime);
    }
    if (this.ytReady && this.ytPlayer) {
      try {
        this.ytPlayer.setVolume(Math.round(vol * 100));
      } catch (_) {}
    }
    notifyStateChange();
  }

  setEngine(engine: 'synth' | 'youtube' | 'hybrid') {
    appState.audioEngine = engine;
    if (appState.audioPlaying) {
      this.stop();
      this.play();
    } else {
      notifyStateChange();
    }
  }

  toggle() {
    if (appState.audioPlaying) {
      this.stop();
    } else {
      this.play();
    }
  }
}

export const audioEngine = new AudioEngine();
