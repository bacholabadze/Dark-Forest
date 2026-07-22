import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { PALETTE } from './constants.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);
const cache = new Map();

window.__dbg = window.__dbg || { loadFail: 0, loaded: [] };

function loadWithRetry(url, tries = 3) {
  return new Promise((resolve, reject) => {
    const attempt = (n) => {
      loader.load(
        url,
        (gltf) => { window.__dbg.loaded.push(url); resolve(gltf); },
        undefined,
        (err) => {
          if (n < tries) setTimeout(() => attempt(n + 1), 250 * n);
          else { window.__dbg.loadFail++; reject(err); }
        }
      );
    };
    attempt(1);
  });
}

export function loadGLB(url) {
  if (!cache.has(url)) cache.set(url, loadWithRetry(url));
  return cache.get(url);
}

/**
 * Clone a GLTF scene safely. Plain Object3D.clone() does NOT remap skeleton
 * bones — a cloned SkinnedMesh keeps bone references into the ORIGINAL scene
 * graph and renders invisible/misplaced. SkeletonUtils.clone rebinds them.
 */
export function cloneScene(scene) {
  return SkeletonUtils.clone(scene);
}

/**
 * Measure a rig at its RENDERED size. Box3.setFromObject lies for skinned
 * rigs: bones can carry x100 scale that the mesh node cancels, so geometry
 * bounds and bone spans disagree wildly. For skinned meshes we sample the
 * actual skinned vertex positions (applyBoneTransform), which is exactly
 * what the GPU renders.
 */
function measure(obj) {
  obj.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const v = new THREE.Vector3();
  let found = false;

  obj.traverse((n) => {
    if (n.isSkinnedMesh && n.geometry?.attributes?.position) {
      const pos = n.geometry.attributes.position;
      const stride = Math.max(1, Math.floor(pos.count / 400));
      for (let i = 0; i < pos.count; i += stride) {
        n.getVertexPosition(i, v);   // skinned position, local to mesh
        v.applyMatrix4(n.matrixWorld);
        if (!found) { box.min.copy(v); box.max.copy(v); found = true; }
        else box.expandByPoint(v);
      }
    } else if (n.isMesh && n.geometry) {
      if (!n.geometry.boundingBox) n.geometry.computeBoundingBox();
      const b = n.geometry.boundingBox.clone().applyMatrix4(n.matrixWorld);
      found ? box.union(b) : box.copy(b);
      found = true;
    }
  });
  if (!found) box.setFromObject(obj);
  return box;
}

export function normalise(obj, targetHeight) {
  const box = measure(obj);
  const size = box.getSize(new THREE.Vector3());
  const s = targetHeight / (size.y || 1);
  obj.scale.multiplyScalar(s);

  const box2 = measure(obj);
  const c = box2.getCenter(new THREE.Vector3());
  obj.position.x -= c.x;
  obj.position.z -= c.z;
  obj.position.y -= box2.min.y;

  // Skinned meshes animate outside their bind-pose bounds; without this the
  // camera frustum culls them mid-walk and the character blinks out.
  obj.traverse((n) => { if (n.isSkinnedMesh) n.frustumCulled = false; });
  return obj;
}

export function stylise(obj, tint = PALETTE.blue, emissive = 0.65) {
  obj.traverse((n) => {
    if (!n.isMesh) return;
    n.castShadow = true;
    const m = n.material;
    if (!m) return;
    const mats = Array.isArray(m) ? m : [m];
    for (const mat of mats) {
      if (mat.color) {
        mat.color.lerp(new THREE.Color(tint), 0.45);
        const hsl = mat.color.getHSL({ h: 0, s: 0, l: 0 });
        mat.color.setHSL(hsl.h, Math.min(1, hsl.s * 1.25), Math.max(hsl.l, 0.55));
      }
      if ('metalness' in mat) mat.metalness = 0.45;
      if ('roughness' in mat) mat.roughness = 0.38;
      if ('emissive' in mat) {
        mat.emissive = new THREE.Color(tint);
        mat.emissiveIntensity = emissive;
      }
      mat.needsUpdate = true;
    }
  });
  return obj;
}

export function countTriangles(obj) {
  let t = 0;
  obj.traverse((n) => {
    if (n.isMesh && n.geometry) {
      const g = n.geometry;
      t += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
    }
  });
  return Math.round(t);
}

/** Pick walk/run/idle clip from GLB animations. */
export function pickClip(clips, prefer = 'walk') {
  if (!clips?.length) return null;
  const lower = (n) => n.toLowerCase();
  const find = (keys) => clips.find((c) => keys.some((k) => lower(c.name).includes(k)));
  if (prefer === 'run') return find(['run', 'sprint', 'jog']) || find(['walk']) || clips[0];
  if (prefer === 'idle') return find(['idle', 'stand']) || clips[0];
  return find(['walk', 'walking']) || find(['run']) || clips[0];
}

export function bindAnimations(root, clips, prefer = 'walk') {
  if (!clips?.length) return null;
  const mixer = new THREE.AnimationMixer(root);
  const clip = pickClip(clips, prefer);
  const action = mixer.clipAction(clip);
  action.play();
  return { mixer, action, clip, clips };
}

export function setAnimState(anim, prefer, fade = 0.2) {
  if (!anim?.mixer) return;
  const hasIdle = anim.clips.some((c) => /idle|stand/i.test(c.name));

  // Meshy packs often ship walk/run only. Pausing mid-stride looks frozen
  // mid-step — reset to time 0 (near bind / feet-together) then pause.
  if (prefer === 'idle' && !hasIdle) {
    if (!anim.frozenIdle) {
      anim.action.reset();
      anim.action.time = 0;
      anim.action.paused = true;
      anim.action.timeScale = 0;
      anim.mixer.update(0);
      anim.frozenIdle = true;
    }
    return;
  }

  if (anim.frozenIdle) {
    anim.action.paused = false;
    anim.action.timeScale = 1;
    anim.frozenIdle = false;
  }

  const clip = pickClip(anim.clips, prefer);
  if (!clip) return;
  if (clip === anim.clip) {
    anim.action.timeScale = prefer === 'run' ? 1.35 : prefer === 'idle' ? 0.85 : 1;
    anim.action.paused = false;
    return;
  }
  const next = anim.mixer.clipAction(clip);
  next.reset().fadeIn(fade).play();
  anim.action.fadeOut(fade);
  anim.action = next;
  anim.clip = clip;
}
