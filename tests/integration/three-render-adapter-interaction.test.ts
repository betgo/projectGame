import { afterEach, describe, expect, it, vi } from "vitest";

import type { RenderSnapshot } from "@runtime/core/types";

const threeMock = vi.hoisted(() => {
  type Listener = (event: unknown) => void;

  class MockCanvasElement {
    private readonly listeners = new Map<string, Set<Listener>>();
    private width = 1;
    private height = 1;

    setViewportSize(width: number, height: number): void {
      this.width = width;
      this.height = height;
    }

    addEventListener(type: string, listener: Listener): void {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }
      this.listeners.get(type)?.add(listener);
    }

    removeEventListener(type: string, listener: Listener): void {
      this.listeners.get(type)?.delete(listener);
    }

    dispatch(type: string, event: unknown): void {
      for (const listener of this.listeners.get(type) ?? []) {
        listener(event);
      }
    }

    getBoundingClientRect(): { left: number; top: number; width: number; height: number } {
      return {
        left: 0,
        top: 0,
        width: this.width,
        height: this.height
      };
    }
  }

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
    projectionUpdates = 0;

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

    updateProjectionMatrix(): void {
      this.projectionUpdates += 1;
    }
  }

  class MockGeometry {
    dispose(): void {
      return;
    }
  }

  class MockMaterial {
    private hex: number;
    color: {
      getHex: () => number;
      setHex: (hex: number) => void;
    };

    constructor(parameters?: { color?: number }) {
      this.hex = parameters?.color ?? 0;
      this.color = {
        getHex: () => this.hex,
        setHex: (hex: number) => {
          this.hex = hex;
        }
      };
    }

    dispose(): void {
      return;
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

  class MockVector2 {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }

    set(x: number, y: number): void {
      this.x = x;
      this.y = y;
    }
  }

  class MockRaycaster {
    private pointerX = 0;

    setFromCamera(coords: MockVector2, camera: MockPerspectiveCamera): void {
      this.pointerX = coords.x;
      void camera;
    }

    intersectObjects(objects: MockObject3D[], recursive?: boolean): Array<{ object: MockObject3D }> {
      void recursive;
      if (this.pointerX < -0.2 && objects[0]) {
        return [{ object: objects[0] }];
      }
      if (this.pointerX > 0.2 && objects[1]) {
        return [{ object: objects[1] }];
      }
      return [];
    }
  }

  class MockRenderer {
    domElement = new MockCanvasElement() as unknown as HTMLCanvasElement;
    width = 0;
    height = 0;
    renderCalls = 0;
    disposed = false;

    constructor(params?: unknown) {
      void params;
    }

    setSize(width: number, height: number): void {
      this.width = width;
      this.height = height;
      (this.domElement as unknown as MockCanvasElement).setViewportSize(width, height);
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
    MockCanvasElement,
    MockGroup,
    MockMaterial,
    MockPerspectiveCamera,
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
      Mesh: MockMesh,
      Vector2: MockVector2,
      Raycaster: MockRaycaster
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
    tick: 5,
    elapsedMs: 500,
    status: "running",
    map: {
      width: 12,
      height: 8,
      cells: Array.from({ length: 8 }, () => Array.from({ length: 12 }, () => 0 as const))
    },
    path: [
      { x: 0, y: 4 },
      { x: 4, y: 4 },
      { x: 11, y: 4 }
    ],
    towers: [{ id: "tower-1", x: 3, y: 3, cooldown: 0 }],
    enemies: [{ id: "enemy-1", x: 6, y: 4, hp: 40 }],
    metrics: {
      kills: 0,
      leaks: 0,
      damageDealt: 0,
      shotsFired: 0,
      goldEarned: 0
    }
  };
}

function createContainer(width: number, height: number): { container: MockContainer; children: unknown[] } {
  const children: unknown[] = [];
  return {
    container: {
      clientWidth: width,
      clientHeight: height,
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
    },
    children
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("three render adapter interaction", () => {
  it("applies deterministic orbit/pan/zoom clamps via pointer and wheel mappings", () => {
    const { container } = createContainer(400, 300);
    const adapter = new ThreeRenderAdapter(container as unknown as HTMLElement);
    adapter.applySnapshot(createSnapshot());

    const internals = adapter as unknown as {
      renderer: InstanceType<typeof threeMock.MockRenderer>;
      cameraState: {
        pitch: number;
        distance: number;
        focusX: number;
        focusZ: number;
      };
      panLimit: {
        x: number;
        z: number;
      };
    };
    const canvas = internals.renderer.domElement as unknown as InstanceType<typeof threeMock.MockCanvasElement>;

    canvas.dispatch("pointerdown", {
      button: 0,
      pointerId: 1,
      clientX: 200,
      clientY: 150,
      shiftKey: false,
      preventDefault: vi.fn()
    });
    canvas.dispatch("pointermove", {
      pointerId: 1,
      clientX: 200,
      clientY: -10000
    });
    expect(internals.cameraState.pitch).toBe(1.35);

    canvas.dispatch("pointermove", {
      pointerId: 1,
      clientX: 200,
      clientY: 10000
    });
    expect(internals.cameraState.pitch).toBe(0.4);

    canvas.dispatch("pointerup", {
      pointerId: 1
    });

    canvas.dispatch("pointerdown", {
      button: 2,
      pointerId: 2,
      clientX: 200,
      clientY: 150,
      shiftKey: false,
      preventDefault: vi.fn()
    });
    canvas.dispatch("pointermove", {
      pointerId: 2,
      clientX: -10000,
      clientY: 10000
    });

    expect(internals.cameraState.focusX).toBe(internals.panLimit.x);
    expect(internals.cameraState.focusZ).toBe(internals.panLimit.z);

    canvas.dispatch("pointerup", {
      pointerId: 2
    });

    canvas.dispatch("wheel", {
      deltaY: -100000,
      preventDefault: vi.fn()
    });
    expect(internals.cameraState.distance).toBe(8);

    canvas.dispatch("wheel", {
      deltaY: 100000,
      preventDefault: vi.fn()
    });
    expect(internals.cameraState.distance).toBe(48);

    adapter.dispose();
  });

  it("keeps renderer size and camera aspect synchronized across resize lifecycle", () => {
    const { container } = createContainer(320, 180);
    const disconnect = vi.fn();

    class MockResizeObserver {
      private static callback: (() => void) | null = null;

      constructor(callback: () => void) {
        MockResizeObserver.callback = callback;
      }

      observe(target: unknown): void {
        void target;
      }

      disconnect(): void {
        disconnect();
      }

      static trigger(): void {
        MockResizeObserver.callback?.();
      }
    }

    vi.stubGlobal("ResizeObserver", MockResizeObserver);

    const adapter = new ThreeRenderAdapter(container as unknown as HTMLElement);
    const internals = adapter as unknown as {
      renderer: InstanceType<typeof threeMock.MockRenderer>;
      camera: InstanceType<typeof threeMock.MockPerspectiveCamera>;
    };

    expect(internals.renderer.width).toBe(320);
    expect(internals.renderer.height).toBe(180);
    expect(internals.camera.aspect).toBeCloseTo(320 / 180, 6);

    container.clientWidth = 800;
    container.clientHeight = 400;
    MockResizeObserver.trigger();

    expect(internals.renderer.width).toBe(800);
    expect(internals.renderer.height).toBe(400);
    expect(internals.camera.aspect).toBe(2);

    adapter.dispose();

    expect(disconnect).toHaveBeenCalledTimes(1);
  });

  it("highlights tower/enemy selection on hover and restores fallback on exit", () => {
    const { container } = createContainer(300, 300);
    const onSelectionChange = vi.fn();
    const adapter = new ThreeRenderAdapter(container as unknown as HTMLElement, {
      onSelectionChange
    });
    adapter.applySnapshot(createSnapshot());

    const internals = adapter as unknown as {
      renderer: InstanceType<typeof threeMock.MockRenderer>;
      towerLayer: InstanceType<typeof threeMock.MockGroup>;
      enemyLayer: InstanceType<typeof threeMock.MockGroup>;
    };

    const canvas = internals.renderer.domElement as unknown as InstanceType<typeof threeMock.MockCanvasElement>;
    const towerMesh = internals.towerLayer.children[0] as unknown as {
      material: InstanceType<typeof threeMock.MockMaterial>;
    };
    const enemyMesh = internals.enemyLayer.children[0] as unknown as {
      material: InstanceType<typeof threeMock.MockMaterial>;
    };

    expect(towerMesh.material.color.getHex()).toBe(0x0f766e);
    expect(enemyMesh.material.color.getHex()).toBe(0xdc2626);

    canvas.dispatch("pointermove", {
      pointerId: 0,
      clientX: 10,
      clientY: 150
    });

    expect(towerMesh.material.color.getHex()).toBe(0x14b8a6);
    expect(enemyMesh.material.color.getHex()).toBe(0xdc2626);
    expect(onSelectionChange).toHaveBeenLastCalledWith({ kind: "tower", id: "tower-1" });

    canvas.dispatch("pointermove", {
      pointerId: 0,
      clientX: 290,
      clientY: 150
    });

    expect(towerMesh.material.color.getHex()).toBe(0x0f766e);
    expect(enemyMesh.material.color.getHex()).toBe(0xfb7185);
    expect(onSelectionChange).toHaveBeenLastCalledWith({ kind: "enemy", id: "enemy-1" });

    canvas.dispatch("pointerleave", {});

    expect(towerMesh.material.color.getHex()).toBe(0x0f766e);
    expect(enemyMesh.material.color.getHex()).toBe(0xdc2626);
    expect(onSelectionChange).toHaveBeenLastCalledWith(null);

    adapter.dispose();
  });
});
