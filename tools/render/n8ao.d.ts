// n8ao ships JavaScript only; this covers the part the renderer uses.
declare module "n8ao" {
  import type { Camera, Scene } from "three";
  import { Pass } from "three/examples/jsm/postprocessing/Pass.js";
  export class N8AOPass extends Pass {
    constructor(scene: Scene, camera: Camera, width?: number, height?: number);
    configuration: {
      aoRadius: number;
      distanceFalloff: number;
      intensity: number;
      halfRes: boolean;
      aoSamples: number;
      denoiseRadius: number;
      gammaCorrection: boolean;
    };
  }
}
