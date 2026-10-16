/**
 * 15-second loop timeline.
 * Returns which keys to press and how intense the moth burst should be.
 */
export class Sequence {
  constructor(duration = 15) {
    this.duration = duration;
    this.time = 0;
  }

  update(dt) {
    this.time = (this.time + dt) % this.duration;
    return this._evaluate(this.time);
  }

  _evaluate(t) {
    const events = [];

    // Quiet open — single key
    if (t > 0.6 && t < 1.4) events.push({ key: 12, intensity: 0.4 });
    if (t > 1.8 && t < 2.4) events.push({ key: 15, intensity: 0.5 });

    // Sparse moths
    if (t > 3.2 && t < 3.8) events.push({ key: 8, intensity: 0.7 });
    if (t > 4.1 && t < 4.6) events.push({ key: 18, intensity: 0.6 });
    if (t > 4.9 && t < 5.4) events.push({ key: 11, intensity: 0.8 });

    // Build
    if (t > 6.2 && t < 6.7) events.push({ key: 20, intensity: 1.0 });
    if (t > 6.8 && t < 7.3) events.push({ key: 6, intensity: 0.9 });
    if (t > 7.4 && t < 7.9) events.push({ key: 22, intensity: 1.1 });
    if (t > 8.0 && t < 8.5) events.push({ key: 9, intensity: 1.0 });
    if (t > 8.6 && t < 9.1) events.push({ key: 16, intensity: 1.2 });

    // Peak — dense
    if (t > 9.6 && t < 10.1) events.push({ key: 4, intensity: 1.4 });
    if (t > 10.2 && t < 10.7) events.push({ key: 13, intensity: 1.3 });
    if (t > 10.8 && t < 11.3) events.push({ key: 19, intensity: 1.5 });
    if (t > 11.4 && t < 11.9) events.push({ key: 7, intensity: 1.2 });
    if (t > 12.0 && t < 12.5) events.push({ key: 24, intensity: 1.4 });

    // Snap back — sparse again
    if (t > 13.2 && t < 13.7) events.push({ key: 14, intensity: 0.5 });
    if (t > 14.0 && t < 14.5) events.push({ key: 10, intensity: 0.3 });

    return events;
  }
}
