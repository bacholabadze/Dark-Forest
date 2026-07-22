import { STATE } from './constants.js';
import { filmState, clearSkip } from './film/shots.js';
import { askChoice, film } from './ui.js';

/** Wait until game state reaches target. */
export function waitForState(getState, target, timeoutMs = 600000) {
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
 * Run the sujet graph. Three step types:
 * - film:   player frozen, automated shots/actors; ENTER fast-forwards.
 * - game:   control handed to player until ctx.state reaches step.until.
 * - choice: two buttons + countdown that auto-picks the recommended option,
 *           so the stage demo can never stall. Result lands in ctx.choices.
 */
export async function runTimeline(steps, ctx) {
  ctx.choices = ctx.choices || {};
  for (const step of steps) {
    if (step.type === 'film') {
      ctx.player.frozen = true;
      filmState.active = true;
      film.skipHint(true);
      step.onEnter?.(ctx);
      await step.fn(ctx);
      step.onExit?.(ctx);
      film.skipHint(false);
      filmState.active = false;
      filmState.paused = false;
      clearSkip();
    } else if (step.type === 'choice') {
      ctx.player.frozen = true;
      clearSkip();
      ctx.choices[step.id] = await askChoice(
        step.prompt, step.options, step.recommended ?? 0, step.seconds ?? 8
      );
    } else if (step.type === 'game') {
      ctx.state = step.state;
      ctx.player.frozen = false;
      step.onEnter?.(ctx);
      if (step.until != null) await waitForState(() => ctx.state, step.until);
      step.onExit?.(ctx);
    }
  }
}

export { STATE };
