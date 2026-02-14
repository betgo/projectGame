declare module "three" {
  export class Scene {
    add(...objects: unknown[]): void;
  }

  export class PerspectiveCamera {
    aspect: number;
    position: { set(x: number, y: number, z: number): void };
    constructor(fov: number, aspect: number, near: number, far: number);
    lookAt(x: number, y: number, z: number): void;
  }

  export class WebGLRenderer {
    domElement: HTMLCanvasElement;
    constructor(params?: unknown);
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
    dispose(): void;
  }

  export class DirectionalLight {
    position: { set(x: number, y: number, z: number): void };
    constructor(color: number, intensity?: number);
  }
}
