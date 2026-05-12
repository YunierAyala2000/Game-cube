const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GROUND_Y: 500,
    PLAYER_SIZE: 30,
    GRAVITY: 0.8,
    JUMP_FORCE: -15,
    JUMP_HOLD_FORCE: -0.5,
    MAX_JUMP_HOLD: 150,
    BASE_SPEED: 6,
    MAX_SPEED: 14,
    SPEED_INCREMENT: 0.1,
    SPEED_INCREMENT_INTERVAL: 5000,
    MIN_OBSTACLE_INTERVAL: 600,
    MAX_OBSTACLE_INTERVAL: 1800,
    NEAR_MISS_CLOSE: 25,
    NEAR_MISS_EXTREME: 15,
    NEAR_MISS_CLOSE_POINTS: 50,
    NEAR_MISS_EXTREME_POINTS: 100,
    COMBO_DECAY_TIMEOUT: 2000,
    MAX_PARTICLES: 200,
    TRAIL_LENGTH: 8,
    SLOW_MO_DURATION: 1500,
    HYPER_SPEED_DURATION: 3000,
    SLOW_MO_SCALE: 0.3,
};

const COLORS = {
    CYAN: '#00f5ff',
    PINK: '#ff00ff',
    YELLOW: '#ffff00',
    ORANGE: '#ff6600',
    RED: '#ff0044',
    GREEN: '#00ff88',
    PURPLE: '#9d00ff',
    WHITE: '#ffffff',
    BG: '#0a0a12',
    GRID: '#1a1a2e',
    BG2: '#12000a',
    GRID2: '#3e0020',
};

const THEMES = {
    cyan: { player: COLORS.CYAN, particles: COLORS.CYAN, trail: COLORS.CYAN },
    pink: { player: COLORS.PINK, particles: COLORS.PINK, trail: COLORS.PINK },
    orange: { player: COLORS.ORANGE, particles: COLORS.YELLOW, trail: COLORS.ORANGE },
    green: { player: COLORS.GREEN, particles: COLORS.CYAN, trail: COLORS.GREEN },
    void: { player: COLORS.WHITE, particles: COLORS.PINK, trail: COLORS.PURPLE },
};

const MEDALS = {
    BRONZE: { score: 100, class: 'bronze', symbol: '🥉' },
    SILVER: { score: 1000, class: 'silver', symbol: '🥈' },
    GOLD: { score: 5000, class: 'gold', symbol: '🥇' },
    NEON_GOD: { score: 25000, class: 'neon-god', symbol: '⚡' },
};

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let audioEnabled = true;
let bgMusicStarted = false;
let bgMusicGain = null;
let bgMusicOscillators = [];

const Storage = {
    save(data) {
        try {
            localStorage.setItem('neonDash', JSON.stringify(data));
        } catch (e) {}
    },
    load() {
        try {
            const data = localStorage.getItem('neonDash');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    },
};

const stored = Storage.load() || {
    bestScore: 0,
    totalRuns: 0,
    longestCombo: 0,
    playTime: 0,
    nearMissCount: 0,
    unlockedThemes: ['cyan'],
    currentTheme: 'cyan',
    soundEnabled: true,
};

if (stored.soundEnabled !== undefined) {
    audioEnabled = stored.soundEnabled;
}

const Audio = {
    play(type) {
        if (!audioEnabled) return;

        const now = audioCtx.currentTime;

        switch(type) {
            case 'jump': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
            }
            case 'score': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(880, now);
                osc.type = 'square';
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
                break;
            }
            case 'nearMiss': {
                const osc1 = audioCtx.createOscillator();
                const osc2 = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc1.connect(gain);
                osc2.connect(gain);
                gain.connect(audioCtx.destination);
                osc1.frequency.setValueAtTime(600, now);
                osc2.frequency.setValueAtTime(900, now);
                osc1.type = osc2.type = 'sawtooth';
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.15);
                osc2.stop(now + 0.15);
                break;
            }
            case 'extremeMiss': {
                const osc1 = audioCtx.createOscillator();
                const osc2 = audioCtx.createOscillator();
                const osc3 = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc1.connect(gain);
                osc2.connect(gain);
                osc3.connect(gain);
                gain.connect(audioCtx.destination);
                osc1.frequency.setValueAtTime(400, now);
                osc2.frequency.setValueAtTime(600, now);
                osc3.frequency.setValueAtTime(1000, now);
                osc1.type = osc2.type = osc3.type = 'square';
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc1.start(now);
                osc2.start(now);
                osc3.start(now);
                osc1.stop(now + 0.2);
                osc2.stop(now + 0.2);
                osc3.stop(now + 0.2);
                break;
            }
            case 'combo': {
                const notes = [523.25, 659.25, 783.99];
                notes.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.frequency.setValueAtTime(freq, now + i * 0.1);
                    osc.type = 'sine';
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.setValueAtTime(0.12, now + i * 0.1);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
                    osc.start(now + i * 0.1);
                    osc.stop(now + i * 0.1 + 0.2);
                });
                break;
            }
            case 'death': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.5);
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
                break;
            }
            case 'highScore': {
                const melody = [523.25, 659.25, 783.99, 1046.50];
                melody.forEach((freq, i) => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.frequency.setValueAtTime(freq, now + i * 0.15);
                    osc.type = 'square';
                    gain.gain.setValueAtTime(0, now);
                    gain.gain.linearRampToValueAtTime(0.1, now + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.3);
                    osc.start(now + i * 0.15);
                    osc.stop(now + i * 0.15 + 0.3);
                });
                break;
            }
            case 'slowMo': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.setValueAtTime(400, now + 0.2);
                osc.frequency.setValueAtTime(100, now + 0.4);
                osc.type = 'sine';
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.2, now + 0.3);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
                osc.start(now);
                osc.stop(now + 0.6);
                break;
            }
            case 'hyperSpeed': {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);
                osc.type = 'sawtooth';
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
                break;
            }
        }
    },
    toggle() {
        audioEnabled = !audioEnabled;
        stored.soundEnabled = audioEnabled;
        Storage.save(stored);
        if (!audioEnabled && bgMusicGain) {
            bgMusicGain.gain.setValueAtTime(0, audioCtx.currentTime);
        } else if (audioEnabled && bgMusicGain && gameState === 'playing') {
            bgMusicGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        }
        return audioEnabled;
    },
    startBgMusic() {
        if (bgMusicStarted || !audioEnabled) return;
        bgMusicStarted = true;

        const masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        masterGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        bgMusicGain = masterGain;

        const bassNotes = [65.41, 82.41, 73.42, 98.00];
        const melodyNotes = [261.63, 329.63, 392.00, 523.25, 440.00, 349.23, 293.66, 261.63];

        const playBass = (noteIndex, delay) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(bassNotes[noteIndex % bassNotes.length], audioCtx.currentTime + delay);
            gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
            gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + delay + 0.05);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime + delay + 0.4);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.8);
            osc.start(audioCtx.currentTime + delay);
            osc.stop(audioCtx.currentTime + delay + 0.8);
        };

        const playMelody = (noteIndex, delay) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(masterGain);
            osc.type = 'square';
            osc.frequency.setValueAtTime(melodyNotes[noteIndex % melodyNotes.length], audioCtx.currentTime + delay);
            gain.gain.setValueAtTime(0, audioCtx.currentTime + delay);
            gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + delay + 0.4);
            osc.start(audioCtx.currentTime + delay);
            osc.stop(audioCtx.currentTime + delay + 0.4);
        };

        const loopBgMusic = () => {
            if (gameState !== 'playing' || !audioEnabled) {
                if (masterGain) masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
                return;
            }

            const now = audioCtx.currentTime;
            for (let i = 0; i < 16; i++) {
                playBass(i, i * 0.5);
            }
            for (let i = 0; i < 32; i++) {
                playMelody(i, i * 0.25);
            }

            setTimeout(loopBgMusic, 8000);
        };

        loopBgMusic();
    },
    stopBgMusic() {
        bgMusicStarted = false;
        if (bgMusicGain) {
            bgMusicGain.gain.setValueAtTime(0, audioCtx.currentTime);
        }
    }
};

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 0;
        this.color = COLORS.CYAN;
        this.gravity = 0.1;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.life -= dt;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    draw(ctx) {
        if (!this.active) return;

        const alpha = Math.max(0, this.life / this.maxLife);
        const size = this.size * alpha;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class ParticlePool {
    constructor(size) {
        this.particles = [];
        for (let i = 0; i < size; i++) {
            this.particles.push(new Particle());
        }
    }

    emit(x, y, count, options = {}) {
        const {
            color = COLORS.CYAN,
            speed = 5,
            sizeRange = [2, 5],
            lifeRange = [20, 40],
            gravity = 0.15,
            angleRange = [0, Math.PI * 2],
            spread = Math.PI * 2
        } = options;

        for (let i = 0; i < count; i++) {
            const particle = this.particles.find(p => !p.active);
            if (!particle) break;

            const angle = angleRange[0] + Math.random() * (angleRange[1] - angleRange[0]);
            const spd = speed * (0.5 + Math.random() * 0.5);

            particle.active = true;
            particle.x = x;
            particle.y = y;
            particle.vx = Math.cos(angle) * spd;
            particle.vy = Math.sin(angle) * spd;
            particle.size = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0]);
            particle.life = lifeRange[0] + Math.random() * (lifeRange[1] - lifeRange[0]);
            particle.maxLife = particle.life;
            particle.color = color;
            particle.gravity = gravity;
        }
    }

    update(dt) {
        for (const p of this.particles) {
            p.update(dt);
        }
    }

    draw(ctx) {
        for (const p of this.particles) {
            p.draw(ctx);
        }
    }
}

const PATTERN_SIZE = 30;
const PATTERN_WIDE_SIZE = 40;

const patterns = {
    single: (groundY) => [{
        x: CONFIG.CANVAS_WIDTH + 50,
        y: groundY - PATTERN_SIZE,
        w: PATTERN_SIZE,
        h: PATTERN_SIZE,
        shape: 'square'
    }],

    spike: (groundY) => [{
        x: CONFIG.CANVAS_WIDTH + 50,
        y: groundY - PATTERN_SIZE * 1.2,
        w: PATTERN_SIZE,
        h: PATTERN_SIZE * 1.2,
        shape: 'triangle'
    }],

    diamond: (groundY) => [{
        x: CONFIG.CANVAS_WIDTH + 50,
        y: groundY - PATTERN_SIZE * 1.1,
        w: PATTERN_SIZE,
        h: PATTERN_SIZE * 1.1,
        shape: 'diamond'
    }],

    circle: (groundY) => [{
        x: CONFIG.CANVAS_WIDTH + 50,
        y: groundY - PATTERN_SIZE,
        w: PATTERN_SIZE,
        h: PATTERN_SIZE,
        shape: 'circle'
    }],

    doubleStack: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 2 - 5, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 3 - 5, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' }
    ],

    spikeStack: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 1.5, w: PATTERN_SIZE, h: PATTERN_SIZE * 1.2, shape: 'triangle' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 2.7, w: PATTERN_SIZE, h: PATTERN_SIZE * 1.2, shape: 'triangle' }
    ],

    mixedStack: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 1.2, w: PATTERN_SIZE, h: PATTERN_SIZE * 1.1, shape: 'diamond' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 2.5, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' }
    ],

    tripleWave: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 2, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 3, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 4, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' }
    ],

    spikeWave: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 1.5, w: PATTERN_SIZE, h: PATTERN_SIZE * 1.2, shape: 'triangle' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 2.7, w: PATTERN_SIZE, h: PATTERN_SIZE * 1.2, shape: 'triangle' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 3.9, w: PATTERN_SIZE, h: PATTERN_SIZE * 1.2, shape: 'triangle' }
    ],

    gap: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 2, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 3, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' }
    ],

    corridor: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 2, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' }
    ],

    corridorSpike: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 1.5, w: PATTERN_SIZE, h: PATTERN_SIZE * 1.2, shape: 'triangle' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' }
    ],

    spikeCluster: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 2, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 3, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 4, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 5, w: PATTERN_SIZE, h: PATTERN_SIZE, shape: 'square' }
    ],

    wide: (groundY) => [{
        x: CONFIG.CANVAS_WIDTH + 50,
        y: groundY - PATTERN_WIDE_SIZE,
        w: PATTERN_WIDE_SIZE * 1.5,
        h: PATTERN_WIDE_SIZE,
        shape: 'square'
    }],

    wideTriangle: (groundY) => [{
        x: CONFIG.CANVAS_WIDTH + 50,
        y: groundY - PATTERN_WIDE_SIZE * 1.3,
        w: PATTERN_WIDE_SIZE * 1.5,
        h: PATTERN_WIDE_SIZE * 1.3,
        shape: 'triangle'
    }],

    aerial: (groundY) => [{
        x: CONFIG.CANVAS_WIDTH + 50,
        y: groundY - PATTERN_SIZE * 4 - Math.random() * PATTERN_SIZE * 2,
        w: PATTERN_SIZE,
        h: PATTERN_SIZE,
        shape: 'square'
    }],

    dangler: (groundY) => [{
        x: CONFIG.CANVAS_WIDTH + 50,
        y: 20,
        w: PATTERN_SIZE,
        h: Math.random() * 60 + 40,
        shape: 'square'
    }],

    flyerPair: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 3, w: PATTERN_SIZE, h: PATTERN_SIZE * 0.6, shape: 'circle' },
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 5, w: PATTERN_SIZE, h: PATTERN_SIZE * 0.6, shape: 'circle' }
    ],

    zigzag: (groundY) => [
        { x: CONFIG.CANVAS_WIDTH + 50, y: groundY - PATTERN_SIZE * 2.5, w: PATTERN_SIZE, h: PATTERN_SIZE * 0.5, shape: 'triangle' },
        { x: CONFIG.CANVAS_WIDTH + 60, y: groundY - PATTERN_SIZE * 3.5, w: PATTERN_SIZE, h: PATTERN_SIZE * 0.5, shape: 'triangle' },
        { x: CONFIG.CANVAS_WIDTH + 70, y: groundY - PATTERN_SIZE * 4.5, w: PATTERN_SIZE, h: PATTERN_SIZE * 0.5, shape: 'triangle' }
    ],
};

const patternList = [
    'single', 'spike', 'diamond', 'circle',
    'doubleStack', 'spikeStack', 'mixedStack',
    'tripleWave', 'spikeWave',
    'gap', 'corridor', 'corridorSpike',
    'spikeCluster', 'wide', 'wideTriangle',
    'aerial', 'dangler', 'flyerPair', 'zigzag',
];

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let gameState = 'title';
let score = 0;
let combo = 0;
let maxCombo = 0;
let multiplier = 1;
let obstaclesDodged = 0;
let nearMissCount = 0;
let obstacles = [];
let gameSpeed = CONFIG.BASE_SPEED;
let obstacleInterval = CONFIG.MAX_OBSTACLE_INTERVAL;
let lastObstacleTime = 0;
let lastSpeedIncrease = 0;
let gameStartTime = 0;
let isSlowMo = false;
let slowMoEndTime = 0;
let isHyperSpeed = false;
let hyperSpeedEndTime = 0;
let isIntenseWave = false;
let intenseWaveCount = 0;
let shakeIntensity = 0;
let shakeX = 0;
let shakeY = 0;
let lastComboMilestone = 0;
let comboMilestones = [10, 25, 50, 100];
let bgPhase = 0;

const player = {
    x: 0,
    y: 0,
    vy: 0,
    width: CONFIG.PLAYER_SIZE,
    height: CONFIG.PLAYER_SIZE,
    isGrounded: true,
    isJumping: false,
    jumpCount: 0,
    maxJumps: 2,
    jumpHoldTime: 0,
    squashX: 1,
    squashY: 1,
    trail: [],
    rotation: 0,
    isDead: false,
};

const particles = new ParticlePool(CONFIG.MAX_PARTICLES);

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let lastTime = 0;
let deltaTime = 0;
let animationFrame = 0;

let gridOffset = 0;
let bgPulse = 0;
let bgImage = null;

function resize() {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    CONFIG.CANVAS_WIDTH = containerWidth;
    CONFIG.CANVAS_HEIGHT = containerHeight;
    CONFIG.GROUND_Y = containerHeight - 100;
    CONFIG.PLAYER_SIZE = Math.max(25, Math.min(40, containerWidth * 0.04));

    player.x = containerWidth * 0.18;
    player.width = CONFIG.PLAYER_SIZE;
    player.height = CONFIG.PLAYER_SIZE;

    if (player.isGrounded) {
        player.y = CONFIG.GROUND_Y - CONFIG.PLAYER_SIZE;
    }
}

function init() {
    window.addEventListener('resize', () => {
        resize();
        player.x = CONFIG.CANVAS_WIDTH * 0.18;
        player.y = CONFIG.GROUND_Y - player.height;
    });

    resize();
    player.x = CONFIG.CANVAS_WIDTH * 0.18;
    player.y = CONFIG.GROUND_Y - CONFIG.PLAYER_SIZE;

    bgImage = new Image();
    bgImage.src = 'public/Fondo1.png';

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handlePointerDown);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('touchstart', handlePointerDown, { passive: false });
    canvas.addEventListener('touchend', handlePointerUp, { passive: false });

    const soundToggle = document.getElementById('sound-toggle');
    soundToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const enabled = Audio.toggle();
        soundToggle.querySelector('.sound-icon').textContent = enabled ? '🔊' : '🔇';
    });
    soundToggle.querySelector('.sound-icon').textContent = audioEnabled ? '🔊' : '🔇';

    updateTitleScreen();
    requestAnimationFrame(gameLoop);
}

function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleAction(true);
    }
}

function handleKeyUp(e) {
    if (e.code === 'Space' || e.code === 'Enter') {
        handleAction(false);
    }
}

function handlePointerDown(e) {
    e.preventDefault();
    handleAction(true);
}

function handlePointerUp(e) {
    handleAction(false);
}

function handleAction(start) {
    if (gameState === 'title') {
        if (start) {
            startGame();
        }
    } else if (gameState === 'playing') {
        if (start && player.jumpCount < player.maxJumps) {
            jump();
        } else if (!start && player.isJumping && player.vy < 0) {
            player.isJumping = false;
        }
    } else if (gameState === 'gameover') {
        if (start) {
            startGame();
        }
    }
}

function startGame() {
    gameState = 'playing';
    score = 0;
    combo = 0;
    maxCombo = 0;
    multiplier = 1;
    obstaclesDodged = 0;
    nearMissCount = 0;
    obstacles = [];
    gameSpeed = CONFIG.BASE_SPEED;
    obstacleInterval = CONFIG.MAX_OBSTACLE_INTERVAL;
    lastObstacleTime = performance.now();
    lastSpeedIncrease = performance.now();
    gameStartTime = performance.now();
    isSlowMo = false;
    isHyperSpeed = false;
    isIntenseWave = false;
    lastComboMilestone = 0;
    shakeIntensity = 0;

    player.x = CONFIG.CANVAS_WIDTH * 0.18;
    player.y = CONFIG.GROUND_Y - player.height;
    player.vy = 0;
    player.width = CONFIG.PLAYER_SIZE;
    player.height = CONFIG.PLAYER_SIZE;
    player.isGrounded = true;
    player.isJumping = false;
    player.jumpCount = 0;
    player.maxJumps = 2;
    player.squashX = 1;
    player.squashY = 1;
    player.trail = [];
    player.rotation = 0;
    player.isDead = false;

    stored.totalRuns++;
    Storage.save(stored);

    document.getElementById('title-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    Audio.startBgMusic();
}

function jump() {
    if (player.jumpCount >= player.maxJumps) return;

    player.vy = CONFIG.JUMP_FORCE;
    player.isGrounded = false;
    player.isJumping = true;
    player.jumpCount++;
    player.jumpHoldTime = 0;

    player.squashX = 0.7;
    player.squashY = 1.3;

    const particleCount = player.jumpCount === 1 ? 8 : 12;
    const particleColor = player.jumpCount === 1 ? THEMES[stored.currentTheme].particles : COLORS.YELLOW;

    Audio.play('jump');

    if (player.jumpCount === 2) {
        particles.emit(player.x + player.width / 2, player.y + player.height / 2, 15, {
            color: COLORS.YELLOW,
            speed: CONFIG.CANVAS_WIDTH * 0.008,
            angleRange: [0, Math.PI * 2],
            lifeRange: [15, 25],
            gravity: 0.05,
        });
        triggerFlash('yellow');
    }

    particles.emit(player.x + player.width / 2, player.y + player.height, particleCount, {
        color: particleColor,
        speed: CONFIG.CANVAS_WIDTH * 0.004,
        angleRange: [-Math.PI * 0.8, -Math.PI * 0.2],
        lifeRange: [15, 30],
        gravity: 0.2,
    });
}

function variantSize(obs) {
    const scale = 0.6 + Math.random() * 0.9;
    obs.w = Math.round(obs.w * scale);
    obs.h = Math.round(obs.h * (0.7 + Math.random() * 0.8));
    if (obs.w < 10) obs.w = 10;
    if (obs.h < 10) obs.h = 10;
    return obs;
}

function variantShape(obs) {
    const shapes = ['square', 'triangle', 'diamond', 'circle'];
    if (Math.random() < 0.3) {
        obs.shape = shapes[Math.floor(Math.random() * shapes.length)];
    }
    return obs;
}

function spawnObstacle() {
    const elapsed = performance.now() - gameStartTime;
    const groundY = CONFIG.GROUND_Y;

    if (elapsed > 30000) {
        if (Math.random() < 0.03 && !isIntenseWave) {
            isIntenseWave = true;
            intenseWaveCount = 5;
        }
    }

    if (isIntenseWave && intenseWaveCount > 0) {
        if (intenseWaveCount === 5) {
            const pattern = Math.random() < 0.5 ? 'single' : 'gap';
            const obs = patterns[pattern](groundY);
            obstacles.push(...obs.map(o => variantShape(variantSize({ ...o, id: Math.random(), nearMissTriggered: false }))));
            intenseWaveCount--;
        } else if (intenseWaveCount > 0) {
            const obs = patterns.single(groundY);
            obstacles.push(...obs.map(o => variantShape(variantSize({ ...o, id: Math.random(), nearMissTriggered: false }))));
            intenseWaveCount--;
        }
        return;
    } else {
        isIntenseWave = false;
    }

    let patternIndex;
    if (elapsed < 15000) {
        patternIndex = Math.floor(Math.random() * 7);
    } else if (elapsed < 30000) {
        patternIndex = Math.floor(Math.random() * 12);
    } else {
        patternIndex = Math.floor(Math.random() * patternList.length);
    }

    const patternName = patternList[patternIndex];
    const newObstacles = patterns[patternName](groundY);
    obstacles.push(...newObstacles.map(o => variantShape(variantSize({ ...o, id: Math.random(), nearMissTriggered: false }))));
}

function updatePlayer(dt) {
    if (player.isDead) {
        player.rotation += 0.2 * dt;
        player.vy += CONFIG.GRAVITY * dt;
        player.y += player.vy * dt;
        return;
    }

    if (player.isJumping && player.vy < 0 && player.jumpHoldTime < CONFIG.MAX_JUMP_HOLD) {
        player.vy += CONFIG.JUMP_HOLD_FORCE * dt;
        player.jumpHoldTime += dt * 16;
    }

    player.vy += CONFIG.GRAVITY * dt;
    player.y += player.vy * dt;

    const groundLevel = CONFIG.GROUND_Y - player.height;
    if (player.y >= groundLevel) {
        player.y = groundLevel;
        if (!player.isGrounded && player.vy > 0) {
            player.squashX = 1.3;
            player.squashY = 0.7;
            particles.emit(player.x + player.width / 2, player.y + player.height, 5, {
                color: THEMES[stored.currentTheme].particles,
                speed: 2,
                angleRange: [Math.PI * 0.6, Math.PI * 1.4],
                lifeRange: [10, 20],
                gravity: 0.1,
            });
        }
        player.vy = 0;
        player.isGrounded = true;
        player.isJumping = false;
        player.jumpCount = 0;
    }

    player.squashX += (1 - player.squashX) * 0.2 * dt;
    player.squashY += (1 - player.squashY) * 0.2 * dt;

    player.trail.unshift({ x: player.x, y: player.y });
    if (player.trail.length > CONFIG.TRAIL_LENGTH) {
        player.trail.pop();
    }
}

function updateObstacles(dt) {
    const speed = gameSpeed * (isSlowMo ? CONFIG.SLOW_MO_SCALE : 1) * (isHyperSpeed ? 2 : 1);
    const nearMissMargin = CONFIG.PLAYER_SIZE * 1.2;
    const closeRange = CONFIG.PLAYER_SIZE * 0.8;
    const extremeRange = CONFIG.PLAYER_SIZE * 0.5;

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.x -= speed * dt;

        if (obs.x + obs.w < 0) {
            obstacles.splice(i, 1);
            continue;
        }

        if (!obs.nearMissTriggered && !player.isDead) {
            const playerCenterX = player.x + player.width / 2;
            const playerCenterY = player.y + player.height / 2;
            const playerRight = player.x + player.width;
            const playerBottom = player.y + player.height;
            const obsRight = obs.x + obs.w;
            const obsBottom = obs.y + obs.h;

            const horizontalOverlap = player.x < obsRight && playerRight > obs.x;
            const verticalOverlap = player.y < obsBottom && playerBottom > obs.y;

            if (horizontalOverlap && !verticalOverlap) {
                const gap = Math.min(
                    Math.abs(playerBottom - obs.y),
                    Math.abs(player.y - obsBottom)
                );

                if (gap < nearMissMargin && gap > 0) {
                    obs.nearMissTriggered = true;

                    if (gap < extremeRange) {
                        score += CONFIG.NEAR_MISS_EXTREME_POINTS;
                        nearMissCount++;
                        stored.nearMissCount++;
                        Audio.play('extremeMiss');
                        triggerFlash('orange');
                        triggerShake(8);

                        particles.emit(playerCenterX, playerCenterY, 30, {
                            color: COLORS.ORANGE,
                            speed: 8,
                            lifeRange: [20, 40],
                            gravity: 0.05,
                        });
                    } else if (gap < closeRange) {
                        score += CONFIG.NEAR_MISS_CLOSE_POINTS;
                        nearMissCount++;
                        stored.nearMissCount++;
                        Audio.play('nearMiss');
                        triggerFlash('cyan');
                        triggerShake(4);

                        particles.emit(playerCenterX, playerCenterY, 15, {
                            color: COLORS.CYAN,
                            speed: 5,
                            lifeRange: [15, 30],
                        });
                    }

                    combo++;
                    obstaclesDodged++;
                    multiplier = Math.min(3, 1 + combo * 0.1);
                    maxCombo = Math.max(maxCombo, combo);

                    if (combo > stored.longestCombo) {
                        stored.longestCombo = combo;
                        Storage.save(stored);
                    }

                    if (combo > 0 && combo % 5 === 0) {
                        Audio.play('score');
                    }

                    if (comboMilestones.includes(combo) && combo > lastComboMilestone) {
                        lastComboMilestone = combo;
                        triggerSlowMo();
                    }

                    updateComboDisplay();
                }
            }
        }

        if (!player.isDead && !obs.nearMissTriggered) {
            const playerRight = player.x + player.width;
            const playerBottom = player.y + player.height;
            const obsRight = obs.x + obs.w;
            const obsBottom = obs.y + obs.h;

            const horizontalOverlap = player.x < obsRight && playerRight > obs.x;
            const verticalOverlap = player.y < obsBottom && playerBottom > obs.y;

            if (!horizontalOverlap || !verticalOverlap) continue;

            let collision = false;

            switch (obs.shape) {
                case 'triangle':
                    collision = checkTriangleCollision(player, obs);
                    break;
                case 'diamond':
                    collision = checkDiamondCollision(player, obs);
                    break;
                case 'circle':
                    collision = checkCircleCollision(player, obs);
                    break;
                case 'square':
                default:
                    collision = true;
                    break;
            }

            if (collision) {
                gameOver();
                return;
            }
        }
    }
}

function checkTriangleCollision(player, obs) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const pr = player.width / 2;

    const cx = obs.x + obs.w / 2;
    const topY = obs.y;
    const bottomY = obs.y + obs.h;
    const leftX = obs.x;
    const rightX = obs.x + obs.w;

    if (px + pr < leftX || px - pr > rightX) return false;
    if (py + pr < topY || py - pr > bottomY) return false;

    const relX = (px - obs.x) / obs.w;
    const relY = (py - obs.y) / obs.h;

    if (relY <= 0) return true;
    if (relY >= 1) return false;

    const halfWidthAtY = relY * (obs.w / 2);
    const centerX = obs.x + obs.w / 2;
    const leftEdge = centerX - halfWidthAtY;
    const rightEdge = centerX + halfWidthAtY;

    if (px + pr > leftEdge && px - pr < rightEdge) {
        if (py + pr > topY && py - pr < bottomY) {
            return true;
        }
    }

    const closestX = Math.max(leftEdge, Math.min(px, rightEdge));
    const closestY = Math.max(topY, Math.min(py, bottomY));
    const dx = px - closestX;
    const dy = py - closestY;

    return (dx * dx + dy * dy) < (pr * pr);
}

function checkDiamondCollision(player, obs) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const pr = player.width / 2 * 0.85;

    const cx = obs.x + obs.w / 2;
    const cy = obs.y + obs.h / 2;

    const dx = Math.abs(px - cx) / (obs.w / 2);
    const dy = Math.abs(py - cy) / (obs.h / 2);

    if (dx + dy <= 1) return true;

    return (dx * dx + dy * dy) < 1 && dx < 1 && dy < 1;
}

function checkCircleCollision(player, obs) {
    const px = player.x + player.width / 2;
    const py = player.y + player.height / 2;
    const pr = player.width / 2 * 0.85;

    const cx = obs.x + obs.w / 2;
    const cy = obs.y + obs.h / 2;
    const or = obs.w / 2 * 0.85;

    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    return dist < (pr + or);
}

function gameOver() {
    player.isDead = true;
    player.vy = -8;
    gameState = 'gameover';

    Audio.stopBgMusic();

    Audio.play('death');
    triggerFlash('red');
    triggerShake(15);

    particles.emit(player.x + player.width / 2, player.y + player.height / 2, 50, {
        color: COLORS.RED,
        speed: CONFIG.CANVAS_WIDTH * 0.015,
        lifeRange: [30, 60],
        gravity: 0.1,
    });

    const isNewBest = score > stored.bestScore;

    if (isNewBest) {
        stored.bestScore = Math.floor(score);
        setTimeout(() => {
            Audio.play('highScore');
            triggerFlash('yellow');
        }, 500);
    }

    Storage.save(stored);

    setTimeout(() => {
        showGameOverScreen(isNewBest);
    }, 1000);
}

function showGameOverScreen(isNewBest) {
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');

    document.getElementById('final-score').textContent = Math.floor(score);
    document.getElementById('final-best').textContent = stored.bestScore;
    document.getElementById('obstacles-dodged').textContent = obstaclesDodged;
    document.getElementById('max-combo').textContent = maxCombo;
    document.getElementById('near-misses').textContent = nearMissCount;

    const newBestEl = document.getElementById('new-best');
    if (isNewBest) {
        newBestEl.classList.remove('hidden');
    } else {
        newBestEl.classList.add('hidden');
    }

    let medal = null;
    if (score >= MEDALS.NEON_GOD.score) {
        medal = MEDALS.NEON_GOD;
    } else if (score >= MEDALS.GOLD.score) {
        medal = MEDALS.GOLD;
    } else if (score >= MEDALS.SILVER.score) {
        medal = MEDALS.SILVER;
    } else if (score >= MEDALS.BRONZE.score) {
        medal = MEDALS.BRONZE;
    }

    const medalEl = document.getElementById('medal');
    if (medal) {
        medalEl.textContent = medal.symbol;
        medalEl.className = `medal ${medal.class}`;
    } else {
        medalEl.textContent = '';
        medalEl.className = 'medal';
    }
}

function triggerSlowMo() {
    isSlowMo = true;
    slowMoEndTime = performance.now() + CONFIG.SLOW_MO_DURATION;
    Audio.play('slowMo');
    triggerFlash('yellow');

    particles.emit(CONFIG.CANVAS_WIDTH / 2, CONFIG.CANVAS_HEIGHT / 2, 40, {
        color: COLORS.YELLOW,
        speed: 15,
        lifeRange: [40, 80],
        gravity: 0,
    });
}

function triggerHyperSpeed() {
    isHyperSpeed = true;
    hyperSpeedEndTime = performance.now() + CONFIG.HYPER_SPEED_DURATION;
    Audio.play('hyperSpeed');
}

function triggerFlash(color) {
    const flash = document.getElementById('flash-overlay');
    flash.className = color;
    setTimeout(() => {
        flash.className = '';
    }, 500);
}

function triggerShake(intensity) {
    shakeIntensity = Math.max(shakeIntensity, intensity);
}

function updateEffects(dt) {
    if (isSlowMo && performance.now() > slowMoEndTime) {
        isSlowMo = false;
    }

    if (isHyperSpeed && performance.now() > hyperSpeedEndTime) {
        isHyperSpeed = false;
    }

    if (shakeIntensity > 0) {
        shakeX = (Math.random() - 0.5) * shakeIntensity;
        shakeY = (Math.random() - 0.5) * shakeIntensity;
        shakeIntensity *= 0.9;
        if (shakeIntensity < 0.5) {
            shakeIntensity = 0;
            shakeX = 0;
            shakeY = 0;
        }
    }

    const comboBorder = document.getElementById('combo-flash');
    if (combo >= 25) {
        comboBorder.classList.add('active');
        if (combo >= 50) {
            comboBorder.style.borderColor = COLORS.PINK;
        } else {
            comboBorder.style.borderColor = COLORS.YELLOW;
        }
    } else {
        comboBorder.classList.remove('active');
    }
}

function updateComboDisplay() {
    const comboEl = document.getElementById('combo');
    const multEl = document.getElementById('multiplier');

    comboEl.textContent = combo;
    multEl.textContent = `x${multiplier.toFixed(1)}`;

    comboEl.classList.add('pop');
    setTimeout(() => comboEl.classList.remove('pop'), 100);
}

function updateScoreDisplay() {
    document.getElementById('score').textContent = Math.floor(score);
}

function updateDifficulty() {
    const elapsed = performance.now() - gameStartTime;

    if (elapsed - lastSpeedIncrease > CONFIG.SPEED_INCREMENT_INTERVAL) {
        gameSpeed = Math.min(CONFIG.MAX_SPEED, gameSpeed + CONFIG.SPEED_INCREMENT);
        obstacleInterval = Math.max(CONFIG.MIN_OBSTACLE_INTERVAL, obstacleInterval - 30);
        lastSpeedIncrease = elapsed;
    }

    if (!isHyperSpeed && elapsed > 60000 && Math.random() < 0.002) {
        triggerHyperSpeed();
    }
}

function updateTitleScreen() {
    document.getElementById('title-best-score').textContent = stored.bestScore;
    document.getElementById('total-runs').textContent = `${stored.totalRuns} runs`;
    document.getElementById('longest-combo').textContent = `Best: ${stored.longestCombo} combo`;
}

function drawBackground() {
    if (bgImage && bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.save();
        ctx.filter = 'blur(3px)';
        ctx.drawImage(bgImage, 0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);
        ctx.restore();
    }
    ctx.fillStyle = score >= 300 ? 'rgba(10,0,15,0.6)' : 'rgba(5,5,10,0.5)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    const time = performance.now() * 0.001;
    bgPulse = Math.sin(time * 2) * 0.5 + 0.5;

    const gridSize = 60;
    const perspectiveY = CONFIG.GROUND_Y;

    ctx.strokeStyle = COLORS.GRID;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.25 + bgPulse * 0.1;

    for (let i = 0; i <= CONFIG.CANVAS_WIDTH / gridSize; i++) {
        const x = (i * gridSize - (gridOffset % gridSize) + gridSize) % (CONFIG.CANVAS_WIDTH + gridSize);
        ctx.beginPath();
        ctx.moveTo(x, perspectiveY);
        ctx.lineTo(x, CONFIG.CANVAS_HEIGHT);
        ctx.stroke();
    }

    const gridLines = 6;
    for (let i = 0; i <= gridLines; i++) {
        const progress = i / gridLines;
        const y = perspectiveY + progress * (CONFIG.CANVAS_HEIGHT - perspectiveY);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CONFIG.CANVAS_WIDTH, y);
        ctx.stroke();
    }

    gridOffset += gameSpeed * 0.5 * (isSlowMo ? CONFIG.SLOW_MO_SCALE : 1) * (isHyperSpeed ? 2 : 1);
    if (gridOffset > gridSize) gridOffset -= gridSize;

    ctx.globalAlpha = 1;
}

function drawPlayer() {
    const theme = THEMES[stored.currentTheme];

    for (let i = 0; i < player.trail.length; i++) {
        const t = player.trail[i];
        const alpha = (1 - i / player.trail.length) * 0.4;
        const size = player.width * (1 - i / player.trail.length * 0.3);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = theme.trail;
        ctx.shadowColor = theme.trail;
        ctx.shadowBlur = 15;

        const offsetX = (player.width - size) / 2;
        ctx.fillRect(t.x + offsetX, t.y + offsetX, size, size);
        ctx.restore();
    }

    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);

    if (player.isDead) {
        ctx.rotate(player.rotation);
    }

    ctx.scale(player.squashX, player.squashY);

    ctx.fillStyle = theme.player;
    ctx.shadowColor = theme.player;
    ctx.shadowBlur = 20;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    ctx.shadowBlur = 40;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(-player.width / 2, -player.height / 2, player.width, player.height);

    ctx.restore();
}

function drawObstacles() {
    for (const obs of obstacles) {
        ctx.save();

        const flash = obs.nearMissTriggered;
        const color = flash ? COLORS.ORANGE : COLORS.PINK;

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;

        const cx = obs.x + obs.w / 2;
        const cy = obs.y + obs.h / 2;

        switch (obs.shape) {
            case 'triangle':
                ctx.beginPath();
                ctx.moveTo(cx, obs.y);
                ctx.lineTo(obs.x + obs.w, obs.y + obs.h);
                ctx.lineTo(obs.x, obs.y + obs.h);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 40;
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                break;

            case 'diamond':
                ctx.beginPath();
                ctx.moveTo(cx, obs.y);
                ctx.lineTo(obs.x + obs.w, cy);
                ctx.lineTo(cx, obs.y + obs.h);
                ctx.lineTo(obs.x, cy);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 40;
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                break;

            case 'circle':
                ctx.beginPath();
                ctx.arc(cx, cy, obs.w / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 40;
                ctx.globalAlpha = 0.5;
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.stroke();
                break;

            case 'square':
            default:
                ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
                ctx.shadowBlur = 40;
                ctx.globalAlpha = 0.5;
                ctx.fillRect(obs.x + obs.w * 0.1, obs.y + obs.h * 0.1, obs.w * 0.8, obs.h * 0.8);
                break;
        }

        ctx.restore();
    }
}

function drawGround() {
    const groundY = CONFIG.GROUND_Y;
    const glowColor = isHyperSpeed ? COLORS.RED : COLORS.CYAN;

    const gradient = ctx.createLinearGradient(0, groundY - 10, 0, groundY + 20);
    gradient.addColorStop(0, glowColor);
    gradient.addColorStop(1, 'transparent');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, groundY - 5, CONFIG.CANVAS_WIDTH, 30);

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 25;
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CONFIG.CANVAS_WIDTH, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
}

function gameLoop(timestamp) {
    deltaTime = Math.min((timestamp - lastTime) / 16.67, 3);
    lastTime = timestamp;

    if (gameState === 'playing') {
        const now = performance.now();
        const timeScale = isSlowMo ? CONFIG.SLOW_MO_SCALE : 1;

        updatePlayer(deltaTime * timeScale);
        updateObstacles(deltaTime * timeScale);
        updateEffects(deltaTime);
        updateDifficulty();

        if (!player.isDead) {
            score += 0.1 * multiplier * deltaTime;
            updateScoreDisplay();
        }

        if (now - lastObstacleTime > obstacleInterval / timeScale) {
            spawnObstacle();
            lastObstacleTime = now;
        }
    } else if (gameState === 'title' || gameState === 'gameover') {
        updateEffects(deltaTime);
    }

    particles.update(deltaTime);

    ctx.save();
    ctx.translate(shakeX, shakeY);

    drawBackground();

    if (gameState === 'playing' || gameState === 'gameover') {
        drawGround();
        drawObstacles();
        drawPlayer();
        particles.draw(ctx);
    }

    ctx.restore();

    requestAnimationFrame(gameLoop);
}

init();
