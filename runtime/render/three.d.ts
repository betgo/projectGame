declare module "three" {
  export class Object3D {
    children: Object3D[];
    position: { set(x: number, y: number, z: number): void };
  }

  export class Scene extends Object3D {
    add(...objects: unknown[]): void;
  }

  export class Group extends Object3D {
    add(...objects: unknown[]): void;
    remove(...objects: unknown[]): void;
  }

  export class PerspectiveCamera extends Object3D {
    aspect: number;
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

  export class DirectionalLight extends Object3D {
    constructor(color: number, intensity?: number);
  }

  export class AmbientLight extends Object3D {
    constructor(color: number, intensity?: number);
  }

  export class BoxGeometry {
    constructor(width?: number, height?: number, depth?: number);
    dispose(): void;
  }

  export class CylinderGeometry {
    constructor(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number);
    dispose(): void;
  }

  export class SphereGeometry {
    constructor(radius?: number, widthSegments?: number, heightSegments?: number);
    dispose(): void;
  }

  export class MeshStandardMaterial {
    constructor(parameters?: { color?: number });
    dispose(): void;
  }

  export class Mesh extends Object3D {
    geometry: { dispose(): void };
    material: unknown;
    constructor(geometry?: unknown, material?: unknown);
  }
}
