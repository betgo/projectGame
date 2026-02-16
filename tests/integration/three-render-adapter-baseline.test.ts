import { describe, expect, it, vi } from "vitest";

import type { RenderSnapshot } from "@runtime/core/types";

const threeMock = vi.hoisted(() => {
  class MockObject3D {
    children: MockObject3D[] = [];
    position = {
      set: (...coords: number[]) => {
        void coords;
        return undefined;
      }
    };
  }

  class MockScene extends MockObject3D {
    add(...objects: MockObject3D[]): void {
      this.children.push(...objects);
    }
  }

  class MockGroup extends MockObject3D {
    add(...objects: MockObject3D[]): void {
      this.children.push(...objects);
    }

    remove(...objects: MockObject3D[]): void {
      this.children = this.children.filter((child) => !objects.includes(child));
    }
  }

  class MockPerspectiveCamera extends MockObject3D {
    aspect: number;

    constructor(fov: number, aspect: number, near: number, far: number) {
      super();
      void fov;
      void near;
      void far;
      this.aspect = aspect;
    }

    lookAt(x: number, y: number, z: number): void {
      void x;
      void y;
      void z;
      return;
    }
  }

  class MockGeometry {
    disposed = false;

    dispose(): void {
      this.disposed = true;
    }
  }

  class MockMaterial {
    disposed = false;

    dispose(): void {
      this.disposed = true;
    }
  }

  class MockMesh extends MockObject3D {
    geometry: MockGeometry;
    material: MockMaterial;

    constructor(geometry?: MockGeometry, material?: MockMaterial) {
      super();
      this.geometry = geometry ?? new MockGeometry();
      this.material = material ?? new MockMaterial();
    }
  }

  class MockRenderer {
    domElement = { id: "mock-canvas" } as unknown as HTMLCanvasElement;
    disposed = false;
    renderCalls = 0;
    width = 0;
    height = 0;

    constructor(params?: unknown) {
      void params;
    }

    setSize(width: number, height: number): void {
      this.width = width;
      this.height = height;
    }

    render(scene: MockScene, camera: MockPerspectiveCamera): void {
      void scene;
      void camera;
      this.renderCalls += 1;
    }

    dispose(): void {
      this.disposed = true;
    }
  }

  return {
    MockGroup,
    MockRenderer,
    module: {
      Object3D: MockObject3D,
      Scene: MockScene,
      Group: MockGroup,
      PerspectiveCamera: MockPerspectiveCamera,
      WebGLRenderer: MockRenderer,
      DirectionalLight: class extends MockObject3D {},
      AmbientLight: class extends MockObject3D {},
      BoxGeometry: MockGeometry,
      CylinderGeometry: MockGeometry,
      SphereGeometry: MockGeometry,
      MeshStandardMaterial: MockMaterial,
      Mesh: MockMesh
    }
  };
});

vi.mock("three", () => threeMock.module);

import { ThreeRenderAdapter } from "@runtime/render/three-adapter";

type MockContainer = {
  clientWidth: number;
  clientHeight: number;
  appendChild: (child: unknown) => void;
  removeChild: (child: unknown) => void;
  contains: (child: unknown) => boolean;
};

function createSnapshot(): RenderSnapshot {
  return {
    tick: 1,
    elapsedMs: 100,
    status: "running",
    map: {
      width: 2,
      height: 2,
      cells: [
        [0, 1],
        [2, 0]
      ]
    },
    path: [
      { x: 0, y: 0 },
      { x: 1, y: 0 }
    ],
    towers: [{ id: "tower-1", x: 1, y: 1, cooldown: 100 }],
    enemies: [{ id: "enemy-1", x: 0.4, y: 0.6, hp: 20 }],
    metrics: {
      kills: 0,
      leaks: 0,
      damageDealt: 0,
      shotsFired: 0,
      goldEarned: 0
    }
  };
}

describe("three render adapter baseline", () => {
  it("renders map/path/tower/enemy placeholders and cleans up lifecycle resources", () => {
    const children: unknown[] = [];
    const container: MockContainer = {
      clientWidth: 640,
      clientHeight: 360,
      appendChild: (child) => {
        children.push(child);
      },
      removeChild: (child) => {
        const index = children.indexOf(child);
        if (index >= 0) {
          children.splice(index, 1);
        }
      },
      contains: (child) => children.includes(child)
    };

    const adapter = new ThreeRenderAdapter(container as unknown as HTMLElement);
    const snapshot = createSnapshot();
    const snapshotBefore = structuredClone(snapshot);

    adapter.applySnapshot(snapshot);

    const internals = adapter as unknown as {
      mapLayer: InstanceType<typeof threeMock.MockGroup>;
      pathLayer: InstanceType<typeof threeMock.MockGroup>;
      towerLayer: InstanceType<typeof threeMock.MockGroup>;
      enemyLayer: InstanceType<typeof threeMock.MockGroup>;
      renderer: InstanceType<typeof threeMock.MockRenderer>;
    };

    expect(internals.mapLayer.children).toHaveLength(4);
    expect(internals.pathLayer.children).toHaveLength(2);
    expect(internals.towerLayer.children).toHaveLength(1);
    expect(internals.enemyLayer.children).toHaveLength(1);
    expect(internals.renderer.renderCalls).toBe(1);
    expect(snapshot).toEqual(snapshotBefore);

    adapter.applySnapshot({
      ...snapshot,
      map: {
        width: 1,
        height: 1,
        cells: [[1]]
      },
      path: [{ x: 0, y: 0 }],
      towers: [],
      enemies: []
    });

    expect(internals.mapLayer.children).toHaveLength(1);
    expect(internals.pathLayer.children).toHaveLength(1);
    expect(internals.towerLayer.children).toHaveLength(0);
    expect(internals.enemyLayer.children).toHaveLength(0);
    expect(internals.renderer.renderCalls).toBe(2);

    const canvas = internals.renderer.domElement;
    expect(children).toContain(canvas);

    adapter.dispose();

    expect(children).not.toContain(canvas);
    expect(internals.renderer.disposed).toBe(true);
  });
});
