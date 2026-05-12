# Neon Dash - Game Specification

## Concept & Vision

A fast-paced, one-button arcade game where players control a glowing neon square dashing through an endless obstacle course. The game captures the "one more try" addiction of Geometry Dash meets the visual intensity of Super Hexagon. Every death should make you want to try again immediately, and every near-miss should feel exhilarating.

## Design Language

### Aesthetic Direction
Cyberpunk synthwave with deep purple/black backgrounds, electric neon accents, and pulsing glow effects. Think Tron meets 80s arcade.

### Color Palette
- `--bg-deep`: #0a0a12 (deep space black)
- `--bg-grid`: #1a1a2e (subtle grid color)
- `--neon-cyan`: #00f5ff (primary player color)
- `--neon-pink`: #ff00ff (accent/obstacles)
- `--neon-yellow`: #ffff00 (score/combo)
- `--neon-orange`: #ff6600 (near-miss)
- `--neon-red`: #ff0044 (danger/death)
- `--neon-green`: #00ff88 (success)
- `--text-primary`: #ffffff
- `--text-glow`: rgba(0, 245, 255, 0.8)

### Typography
- Primary: system-ui with fallbacks
- Numbers: Tabular/monospace for scores
- Titles: Bold, uppercase with heavy glow

### Motion Philosophy
- Snappy, responsive actions (0-100ms feel instant)
- Squash/stretch on player for weight
- Motion trails persist 200-500ms
- Particles burst on events, fade over 300-800ms
- Screen shake intensity scales with impact
- All transitions use ease-out curves

## Layout & Structure

### Game Canvas
- Full viewport canvas element
- Fixed aspect ratio game world (800x600 logical)
- Responsive scaling to fit screen
- Ground line at bottom 20%

### UI Layers (z-order)
1. Background (animated grid)
2. Game world (obstacles, player, particles)
3. Effects (screen shake container)
4. UI overlay (score, combo, menus)

### Screen States
1. **Title Screen**: Logo, best score, "Press Space", controls hint
2. **Playing**: Minimal HUD, score top-left, combo top-right
3. **Game Over**: Overlay with stats, best score comparison, restart prompt

## Features & Interactions

### Core Mechanics

#### Player Control
- **Jump**: Space/Click/Tap triggers jump
- Jump has fixed arc (quick rise, slower fall for control)
- No double jump - one action, instant response
- Player can hold for slightly higher jump (variable height)

#### Obstacle System
- **Spawn**: Procedural from right side, move left
- **Patterns** (selected randomly with weighting):
  - Single block (easiest)
  - Double stack (requires timing)
  - Triple wave (rhythm pattern)
  - Gap sequence (precision)
  - Corridor (height change)
  - Spike cluster (dense)
- **Speed**: Starts at 5, increases 0.1 every 5 seconds
- **Frequency**: Starts at 1.5s interval, decreases to 0.5s minimum

#### Near-Miss System
- Detection: Player passes within 15-30px of obstacle
- **Close** (15-20px): 50 bonus points, small particles
- **Extreme** (<15px): 100 bonus points, big particles, screen flash
- Visual: Obstacle flashes, trail intensifies

#### Combo System
- +1 combo for each obstacle dodged
- Combo resets on: death, missing 3 obstacles
- **Combo tiers**:
  - 5+: Yellow glow intensifies
  - 10+: Speed boost +10%
  - 25+: Screen border glow
  - 50+: Camera zoom pulse
- Score multiplier: 1x base, +0.1x per combo (caps at 3x)

### Special Moments

#### Slow Motion (rare)
- Triggers on combo milestones (10, 25, 50)
- Game slows to 30% for 1.5 seconds
- Dramatic particle burst, screen flash
- Audio pitch drops

#### Hyper Speed (rare)
- Triggers every ~60 seconds if player alive
- Speed doubles for 3 seconds
- Visual: intense motion blur, color shift to red
- High risk/reward

#### Intense Waves
- Every 30 seconds: wave of 5+ obstacles rapid succession
- Pattern: small gap, small gap, medium gap, tiny gap
- Survival test

### Difficulty Progression
- 0-30s: Tutorial zone, single obstacles
- 30-60s: Introduce patterns
- 60-120s: Mixed patterns, increasing speed
- 120s+: Full chaos, all patterns, max speed

## Component Inventory

### Player
- 30x30px neon square with 3-layer glow
- **States**: Running, Jumping, Falling, Dead
- **Animations**:
  - Squash on land (scaleY: 0.7, scaleX: 1.3, 100ms)
  - Stretch on jump (scaleY: 1.3, scaleX: 0.7, 100ms)
  - Spin on death
- **Trail**: 5 ghost images, fading opacity

### Obstacles
- Neon pink/magenta blocks with glow
- Size varies: 30x30 to 60x60
- Flash white on near-miss
- Explode into particles on collision

### Particles
- Small circles (2-6px)
- Colors match event (cyan=jump, yellow=score, orange=near-miss, red=death)
- Physics: gravity, velocity, fade
- Pool size: 200 particles max

### Background
- Animated grid perspective (parallax)
- Subtle scan lines
- Pulsing ambient glow
- Color shifts with combo

### HUD Elements
- Score: Large, top-left, counting animation
- Combo: Top-right, scales on increase
- Multiplier: Below combo, subtle

### Menus
- Semi-transparent dark overlay
- Centered content with glow borders
- Buttons: Neon bordered, hover glow increase

## Audio Design

### Sound Effects (Web Audio API generated)

| Sound | Frequency | Duration | Character |
|-------|-----------|----------|-----------|
| Jump | 400→800Hz sweep | 100ms | Quick, light |
| Score | 800Hz tone | 50ms | Satisfying click |
| NearMiss | 600Hz + 900Hz chord | 150ms | Electric buzz |
| Combo | Rising arpeggio (C-E-G) | 300ms | Triumphant |
| Death | 200→50Hz sweep | 500ms | Harsh, impactful |
| HighScore | Fanfare melody | 1000ms | Celebratory |

### Dynamic Music (optional, simple)
- Base: 110Hz bass drone
- Kick on obstacles
- Hi-hat on player actions
- Intensity scales with speed

## Technical Approach

### Architecture
```
script.js
├── Config (constants)
├── State (game state object)
├── Audio (Web Audio manager)
├── Particles (pool + emitter)
├── Player (position, velocity, render)
├── Obstacles (spawner, array, render)
├── Effects (screen shake, flash, zoom)
├── Patterns (obstacle sequence generators)
├── UI (score, combo, menus)
├── Storage (localStorage wrapper)
├── Themes (cosmetic options)
├── Achievements (medal system)
└── Game (loop, init, events)
```

### Performance Targets
- 60 FPS stable
- Max 200 particles
- Object pooling for particles and obstacles
- RequestAnimationFrame loop
- No DOM manipulation in game loop

### Responsive Design
- Canvas scales to fit viewport
- Touch events for mobile
- Minimum playable: 320px width
- Optimal: 800px+

## Unlockables & Progression

### Themes (unlockable)
1. **Cyan** (default) - Cyan player, cyan effects
2. **Magenta** - Pink player, unlocks at 1000 points
3. **Solar** - Orange/yellow, unlocks at 5000 points
4. **Toxic** - Green, unlocks at 10000 points
5. **Void** - White/dark, unlocks at 25000 points

### Medals
- **Bronze**: Reach 100 points
- **Silver**: Reach 1000 points
- **Gold**: Reach 5000 points
- **Neon God**: Reach 25000 points

### Stats Tracked
- Best score
- Total runs
- Longest combo
- Total playtime
- Near-misses count

## File Structure
```
index.html  - Single file, canvas + UI
style.css   - All styling, animations, effects
script.js   - Complete game logic
README.md   - Instructions
```
