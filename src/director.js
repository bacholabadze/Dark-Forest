import { STATE } from './constants.js';

/** Wait until game state reaches target or predicate returns true. */
export function waitForState(getState, target, timeoutMs = 300000) {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    const tick = () => {
      if (getState() === target) return resolve();
      if (performance.now() - t0 > timeoutMs) return reject(new Error('director timeout'));
      requestAnimationFrame(tick);
    };
    tick();
  });
}

/**
 * Run the 7-scene film/game timeline.
 * Film steps freeze player and run async; game steps hand control to player.
 */
export async function runTimeline(steps, ctx) {
  for (const step of steps) {
    if (step.type === 'film') {
      ctx.player.frozen = true;
      if (step.onEnter) step.onEnter(ctx);
      await step.fn(ctx);
      if (step.onExit) step.onExit(ctx);
    } else if (step.type === 'game') {
      ctx.state = step.state;
      ctx.player.frozen = false;
      if (step.onEnter) step.onEnter(ctx);
      if (step.until != null) {
        await waitForState(() => ctx.state, step.until);
      }
      if (step.onExit) step.onExit(ctx);
    }
  }
}

export { STATE };
