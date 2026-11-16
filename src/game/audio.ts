class RetroAudio {
  private ctx: AudioContext | null = null;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.08,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    }

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  public jump() {
    this.playTone(220, 480, 0.11, 'square', 0.07);
  }

  public wallHop() {
    this.playTone(280, 620, 0.1, 'square', 0.075);
  }

  public doubleJump() {
    this.playTone(380, 740, 0.1, 'triangle', 0.09);
  }

  public backflip() {
    this.playTone(520, 960, 0.09, 'square', 0.065);
    this.playTone(740, 1180, 0.11, 'triangle', 0.065, 0.04);
  }

  public grappleLatch() {
    this.playTone(620, 320, 0.06, 'sawtooth', 0.06);
    this.playTone(440, 880, 0.08, 'square', 0.05, 0.03);
  }

  public grappleBoost() {
    this.playTone(340, 920, 0.14, 'triangle', 0.09);
  }

  public crumble() {
    this.playTone(170, 75, 0.14, 'sawtooth', 0.06);
  }

  public gem() {
    this.playTone(660, 880, 0.07, 'square', 0.06);
    this.playTone(990, 1320, 0.1, 'triangle', 0.06, 0.05);
  }

  public laserWarn() {
    this.playTone(880, 960, 0.05, 'sine', 0.03);
  }

  public dartFire() {
    this.playTone(520, 190, 0.065, 'triangle', 0.045);
  }

  public batScreech() {
    this.playTone(980, 640, 0.08, 'sawtooth', 0.045);
    this.playTone(1120, 720, 0.09, 'triangle', 0.04, 0.05);
  }

  public unlockSkin() {
    this.playTone(523, 659, 0.08, 'square', 0.06);
    this.playTone(659, 784, 0.08, 'square', 0.06, 0.06);
    this.playTone(784, 1046, 0.14, 'triangle', 0.07, 0.12);
  }

  public bouncePad() {
    this.playTone(260, 760, 0.14, 'triangle', 0.085);
    this.playTone(520, 1080, 0.11, 'square', 0.05, 0.03);
  }

  public crusherSlam() {
    this.playTone(130, 42, 0.18, 'sawtooth', 0.09);
    this.playTone(90, 36, 0.2, 'square', 0.06, 0.02);
  }

  public flameBurst() {
    this.playTone(240, 110, 0.14, 'sawtooth', 0.045);
  }

  public themeUnlock() {
    this.playTone(440, 554, 0.08, 'triangle', 0.07);
    this.playTone(554, 659, 0.08, 'triangle', 0.07, 0.07);
    this.playTone(659, 880, 0.16, 'square', 0.065, 0.14);
  }

  public electricZap() {
    this.playTone(920, 340, 0.08, 'sawtooth', 0.055);
    this.playTone(1240, 620, 0.07, 'square', 0.04, 0.03);
  }

  public acidSplash() {
    this.playTone(320, 140, 0.09, 'triangle', 0.035);
  }

  public revive() {
    this.playTone(392, 523, 0.09, 'triangle', 0.08);
    this.playTone(523, 659, 0.09, 'triangle', 0.08, 0.07);
    this.playTone(659, 1046, 0.16, 'square', 0.07, 0.14);
  }

  public death() {
    this.playTone(260, 55, 0.28, 'sawtooth', 0.11);
    this.playTone(180, 42, 0.34, 'square', 0.08, 0.05);
  }
}

export const retroAudio = new RetroAudio();
