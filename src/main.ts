import { AudioService } from './audio';
import { PatternProvider } from './pattern-provider';

class SimpleSPA {
  private phaseIndicator: HTMLElement;
  private startStopButton: HTMLElement
  private rhytm1Canvas: HTMLCanvasElement;
  private rhytm2Canvas: HTMLCanvasElement;
  private foregroundColor: string;
  private backgroundColor: string;

  private patternProvider: PatternProvider;

  private audioService: AudioService;

  constructor() {
    this.phaseIndicator = document.getElementById('phase')!;
    this.startStopButton = document.getElementById('start')!;
    this.rhytm1Canvas = document.getElementById('rhytm1') as HTMLCanvasElement;
    this.rhytm2Canvas = document.getElementById('rhytm2') as HTMLCanvasElement;

    this.patternProvider = new PatternProvider();

    // Get the computed foreground color from CSS

    const computedStyle = window.getComputedStyle(document.body);
    this.foregroundColor = computedStyle.getPropertyValue('--foreground');
    this.backgroundColor = computedStyle.getPropertyValue('--background');


    this.render();
    this.bindEvents();

    this.audioService = new AudioService(120, this.patternProvider);

    this.audioService.setOnPatternComplete(() => {
      this.patternProvider.advancePattern();
      this.render();
    });

    this.audioService.setOnBarComplete((barIndex) => {
      this.phaseIndicator.innerHTML = barIndex % 2 === 1 ? `⬛🔲` :
        `🔲⬛`;
    });

    const bpmInput = document.getElementById('bpmNumber') as HTMLInputElement;
    this.audioService.setBPM(parseInt(bpmInput.value));

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        this.activateScreenLock();
      }
    });

    window.addEventListener("load", () => {
      this.activateScreenLock();
    });

  }

  private render() {
    this.renderRhytmCanvas(this.rhytm1Canvas, this.patternProvider.getCurrentPattern());
    this.renderRhytmCanvas(this.rhytm2Canvas, this.patternProvider.getNextPattern());
  }

  private renderRhytmCanvas(canvas: HTMLCanvasElement, rhytm: number[]) {
    const dpr = window.devicePixelRatio;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d')!;

    // Set the display size
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    // Set the actual size in memory
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale all drawing operations by the dpr
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    const width = rect.width / rhytm.length;
    const height = rect.height;
    const divisionHeight = height * 0.4;

    const quadHeight = height * 0.35;

    // Bottom border with fat line

    ctx.fillStyle = this.foregroundColor;
    ctx.strokeStyle = this.foregroundColor;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, height);
    ctx.lineTo(rect.width, height);
    ctx.lineTo(rect.width, 0);
    ctx.stroke();
    ctx.closePath();

    ctx.lineWidth = 2;

    const rectPad = 5;

    rhytm.forEach((value, index) => {

      let divHeight = divisionHeight;

      if (index % 4 === 0) {
        ctx.lineWidth = 4;
        divHeight = rect.height * 0.7;
      }
      else {
        ctx.lineWidth = 2;
      }

      ctx.beginPath();
      ctx.moveTo(index * width - ctx.lineWidth / 2, height - divHeight);
      ctx.lineTo(index * width - ctx.lineWidth / 2, height);
      ctx.stroke();
      ctx.closePath();

      ctx.fillStyle = value ? this.foregroundColor : this.backgroundColor;

      const start = index == 0 ?
        index * width + rectPad + ctx.lineWidth / 2 :
        index * width + rectPad - ctx.lineWidth / 2;

      const x = start;
      const y = height - quadHeight + rectPad;
      const w = width - 2 * rectPad;
      const h = quadHeight - 2 * rectPad - 1;
      const radius = 5;

      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
    });
  }

  private bindEvents() {
    const bpmInput = document.getElementById('bpmNumber') as HTMLInputElement;
    bpmInput.addEventListener('change', (e) => {
      this.audioService.setBPM(parseInt((e.target as HTMLInputElement).value));
    });

    const togglePlayback = () => {
      if (this.startStopButton.innerHTML === 'START') {
        this.startStopButton.innerHTML = 'STOP';
        this.audioService.setBPM(parseInt(bpmInput.value));
        this.audioService.start();
      } else {
        this.startStopButton.innerHTML = 'START';
        this.audioService.stop();
      }
      this.render();
    };

    this.startStopButton.addEventListener('click', togglePlayback);

    // Add keyboard controls
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault(); // Prevent page scroll for spacebar
        togglePlayback();
      }
    });
  }

  private async activateScreenLock() {
    if (typeof document.body.requestFullscreen !== "function") {
      return;
    }

    for (let i = 0; i < 5; i++) {
      try {
        await navigator.wakeLock.request("screen");
        return;
      } catch (e) {
        console.error("Failed to request wake lock, retrying...", e);
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    console.error("Failed to request wake lock after 5 tries");
  }

}

// Initialize the application
new SimpleSPA();