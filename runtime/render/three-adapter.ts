import * as THREE from "three";

import type { RenderSnapshot } from "../core/types";

import { buildPlaceholderFrame, type EnemyPlaceholder, type MapPlaceholder, type PathPlaceholder, type TowerPlaceholder } from "./placeholder-model";

const MAP_CELL_SIZE = 0.96;
const MAP_CELL_HEIGHT = 0.1;

const MAP_CELL_COLORS: Record<MapPlaceholder["kind"], number> = {
  empty: 0x1f2937,
  path: 0x1d4ed8,
  tower: 0x9a3412
};

const PATH_COLOR = 0xf59e0b;
const TOWER_COLOR = 0x0f766e;
const TOWER_HIGHLIGHT_COLOR = 0x14b8a6;
const ENEMY_COLOR = 0xdc2626;
const ENEMY_HIGHLIGHT_COLOR = 0xfb7185;

const DEFAULT_CAMERA_DISTANCE = 28;
const DEFAULT_CAMERA_YAW = 0;
const DEFAULT_CAMERA_PITCH = Math.PI / 4;
const CAMERA_MIN_DISTANCE = 8;
const CAMERA_MAX_DISTANCE = 48;
const CAMERA_MIN_PITCH = 0.4;
const CAMERA_MAX_PITCH = 1.35;
const CAMERA_ORBIT_SENSITIVITY = 0.005;
const CAMERA_PAN_SENSITIVITY = 0.0025;
const CAMERA_ZOOM_SENSITIVITY = 0.015;
const CAMERA_MIN_PAN_LIMIT = 4;

type SelectionKind = "tower" | "enemy";
type LayerKind = "map" | "path" | "tower" | "enemy";

export type RenderSelection = {
  kind: SelectionKind;
  id: string;
};

export type ThreeRenderAdapterOptions = {
  onSelectionChange?: (selection: RenderSelection | null) => void;
};

type SelectionMeta = RenderSelection & {
  baseColor: number;
  highlightColor: number;
};

type CameraState = {
  yaw: number;
  pitch: number;
  distance: number;
  focusX: number;
  focusZ: number;
};

type DragState = {
  pointerId: number;
  mode: "orbit" | "pan";
  lastClientX: number;
  lastClientY: number;
};

type LayerCounts = Record<LayerKind, number>;

export type RenderAdapterLayerMetrics = LayerCounts & {
  total: number;
};

export type RenderAdapterPerformanceStats = {
  allocations: RenderAdapterLayerMetrics;
  poolCapacity: RenderAdapterLayerMetrics;
  activeObjects: RenderAdapterLayerMetrics;
};

function createLayerCounts(): LayerCounts {
  return {
    map: 0,
    path: 0,
    tower: 0,
    enemy: 0
  };
}

function withTotal(counts: LayerCounts): RenderAdapterLayerMetrics {
  return {
    ...counts,
    total: counts.map + counts.path + counts.tower + counts.enemy
  };
}

function toWorldX(gridX: number, width: number): number {
  return gridX - width / 2 + 0.5;
}

function toWorldZ(gridY: number, height: number): number {
  return gridY - height / 2 + 0.5;
}

function disposeMaterial(material: unknown): void {
  if (Array.isArray(material)) {
    for (const item of material) {
      disposeMaterial(item);
    }
    return;
  }

  if (!material || typeof material !== "object") {
    return;
  }

  const maybe = material as { dispose?: () => void };
  if (typeof maybe.dispose === "function") {
    maybe.dispose();
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeAngle(value: number): number {
  const twoPi = Math.PI * 2;
  const normalized = value % twoPi;
  return normalized >= Math.PI ? normalized - twoPi : normalized < -Math.PI ? normalized + twoPi : normalized;
}

function getNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function selectionsEqual(left: RenderSelection | null, right: RenderSelection | null): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return left.kind === right.kind && left.id === right.id;
}

export class ThreeRenderAdapter {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly mapLayer: THREE.Group;
  private readonly pathLayer: THREE.Group;
  private readonly towerLayer: THREE.Group;
  private readonly enemyLayer: THREE.Group;
  private readonly mapGeometry: THREE.BoxGeometry;
  private readonly pathGeometry: THREE.BoxGeometry;
  private readonly towerGeometry: THREE.CylinderGeometry;
  private readonly enemyGeometry: THREE.SphereGeometry;
  private readonly mapMaterials: Record<MapPlaceholder["kind"], THREE.MeshStandardMaterial>;
  private readonly pathMaterial: THREE.MeshStandardMaterial;
  private readonly raycaster: THREE.Raycaster;
  private readonly pointerNdc: THREE.Vector2;
  private readonly mapPool: THREE.Mesh[] = [];
  private readonly pathPool: THREE.Mesh[] = [];
  private readonly towerPool: THREE.Mesh[] = [];
  private readonly enemyPool: THREE.Mesh[] = [];
  private readonly allocationCounts: LayerCounts = createLayerCounts();
  private readonly activeCounts: LayerCounts = createLayerCounts();
  private readonly cameraState: CameraState = {
    yaw: DEFAULT_CAMERA_YAW,
    pitch: DEFAULT_CAMERA_PITCH,
    distance: DEFAULT_CAMERA_DISTANCE,
    focusX: 0,
    focusZ: 0
  };
  private readonly selectableObjects: THREE.Object3D[] = [];
  private readonly selectionByObject = new WeakMap<THREE.Object3D, SelectionMeta>();
  private panLimit = {
    x: CAMERA_MIN_PAN_LIMIT,
    z: CAMERA_MIN_PAN_LIMIT
  };
  private currentSelection: RenderSelection | null = null;
  private dragState: DragState | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private windowResizeHandler: (() => void) | null = null;

  constructor(
    private readonly container: HTMLElement,
    private readonly options: ThreeRenderAdapterOptions = {}
  ) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    container.appendChild(this.renderer.domElement);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 20, 8);
    this.scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambientLight);

    this.mapLayer = new THREE.Group();
    this.pathLayer = new THREE.Group();
    this.towerLayer = new THREE.Group();
    this.enemyLayer = new THREE.Group();
    this.scene.add(this.mapLayer, this.pathLayer, this.towerLayer, this.enemyLayer);

    this.mapGeometry = new THREE.BoxGeometry(MAP_CELL_SIZE, MAP_CELL_HEIGHT, MAP_CELL_SIZE);
    this.pathGeometry = new THREE.BoxGeometry(0.35, 0.08, 0.35);
    this.towerGeometry = new THREE.CylinderGeometry(0.24, 0.34, 0.8, 12);
    this.enemyGeometry = new THREE.SphereGeometry(0.22, 12, 12);
    this.mapMaterials = {
      empty: new THREE.MeshStandardMaterial({ color: MAP_CELL_COLORS.empty }),
      path: new THREE.MeshStandardMaterial({ color: MAP_CELL_COLORS.path }),
      tower: new THREE.MeshStandardMaterial({ color: MAP_CELL_COLORS.tower })
    };
    this.pathMaterial = new THREE.MeshStandardMaterial({ color: PATH_COLOR });

    this.raycaster = new THREE.Raycaster();
    this.pointerNdc = new THREE.Vector2(0, 0);

    this.updateCameraPose();
    this.syncViewportSize();
    this.bindInteractionEvents();
    this.bindResizeEvents();
  }

  applySnapshot(snapshot: RenderSnapshot): void {
    const frame = buildPlaceholderFrame(snapshot);
    this.panLimit = {
      x: Math.max(CAMERA_MIN_PAN_LIMIT, frame.width * 0.75),
      z: Math.max(CAMERA_MIN_PAN_LIMIT, frame.height * 0.75)
    };
    this.cameraState.focusX = clamp(this.cameraState.focusX, -this.panLimit.x, this.panLimit.x);
    this.cameraState.focusZ = clamp(this.cameraState.focusZ, -this.panLimit.z, this.panLimit.z);
    this.updateCameraPose();

    const previousSelection = this.currentSelection;
    this.selectableObjects.length = 0;
    this.syncMapLayer(frame.map, frame.width, frame.height);
    this.syncPathLayer(frame.path, frame.width, frame.height);
    this.syncTowerLayer(frame.towers, frame.width, frame.height);
    this.syncEnemyLayer(frame.enemies, frame.width, frame.height);

    if (previousSelection && this.selectableContains(previousSelection)) {
      this.applySelectionColor(previousSelection);
    } else {
      this.setSelection(null);
    }

    this.renderFrame();
  }

  dispose(): void {
    this.unbindInteractionEvents();
    this.unbindResizeEvents();
    this.selectableObjects.length = 0;
    this.currentSelection = null;

    for (const mesh of this.towerPool) {
      disposeMaterial((mesh as { material?: unknown }).material);
    }
    for (const mesh of this.enemyPool) {
      disposeMaterial((mesh as { material?: unknown }).material);
    }

    this.towerPool.length = 0;
    this.enemyPool.length = 0;
    this.mapPool.length = 0;
    this.pathPool.length = 0;

    this.mapGeometry.dispose();
    this.pathGeometry.dispose();
    this.towerGeometry.dispose();
    this.enemyGeometry.dispose();
    disposeMaterial(this.mapMaterials.empty);
    disposeMaterial(this.mapMaterials.path);
    disposeMaterial(this.mapMaterials.tower);
    disposeMaterial(this.pathMaterial);

    this.detachLayerChildren(this.mapLayer);
    this.detachLayerChildren(this.pathLayer);
    this.detachLayerChildren(this.towerLayer);
    this.detachLayerChildren(this.enemyLayer);
    this.renderer.dispose();

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  getPerformanceStats(): RenderAdapterPerformanceStats {
    const poolCapacity: LayerCounts = {
      map: this.mapPool.length,
      path: this.pathPool.length,
      tower: this.towerPool.length,
      enemy: this.enemyPool.length
    };
    return {
      allocations: withTotal(this.allocationCounts),
      poolCapacity: withTotal(poolCapacity),
      activeObjects: withTotal(this.activeCounts)
    };
  }

  private syncMapLayer(cells: MapPlaceholder[], width: number, height: number): void {
    this.activeCounts.map = cells.length;
    this.ensurePool(this.mapPool, this.mapLayer, cells.length, "map", () =>
      new THREE.Mesh(this.mapGeometry, this.mapMaterials.empty)
    );
    this.applyLayerVisibility(this.mapPool, cells.length);

    for (let index = 0; index < cells.length; index += 1) {
      const cell = cells[index];
      const mesh = this.mapPool[index];
      mesh.position.set(toWorldX(cell.x, width), 0, toWorldZ(cell.y, height));
      (mesh as { material: unknown }).material = this.mapMaterials[cell.kind];
    }
  }

  private syncPathLayer(pathNodes: PathPlaceholder[], width: number, height: number): void {
    this.activeCounts.path = pathNodes.length;
    this.ensurePool(this.pathPool, this.pathLayer, pathNodes.length, "path", () =>
      new THREE.Mesh(this.pathGeometry, this.pathMaterial)
    );
    this.applyLayerVisibility(this.pathPool, pathNodes.length);

    for (let index = 0; index < pathNodes.length; index += 1) {
      const pathNode = pathNodes[index];
      const mesh = this.pathPool[index];
      mesh.position.set(
        toWorldX(pathNode.x, width),
        0.12 + pathNode.order * 0.0001,
        toWorldZ(pathNode.y, height)
      );
      (mesh as { material: unknown }).material = this.pathMaterial;
    }
  }

  private syncTowerLayer(towers: TowerPlaceholder[], width: number, height: number): void {
    this.activeCounts.tower = towers.length;
    this.ensurePool(this.towerPool, this.towerLayer, towers.length, "tower", () =>
      new THREE.Mesh(this.towerGeometry, new THREE.MeshStandardMaterial({ color: TOWER_COLOR }))
    );
    this.applyLayerVisibility(this.towerPool, towers.length);

    for (let index = 0; index < towers.length; index += 1) {
      const tower = towers[index];
      const mesh = this.towerPool[index];
      mesh.position.set(toWorldX(tower.x, width), 0.45, toWorldZ(tower.y, height));

      const material = (mesh as { material: THREE.MeshStandardMaterial }).material;
      material.color.setHex(TOWER_COLOR);
      this.registerSelectable(mesh, {
        kind: "tower",
        id: tower.id,
        baseColor: TOWER_COLOR,
        highlightColor: TOWER_HIGHLIGHT_COLOR
      });
    }
  }

  private syncEnemyLayer(enemies: EnemyPlaceholder[], width: number, height: number): void {
    this.activeCounts.enemy = enemies.length;
    this.ensurePool(this.enemyPool, this.enemyLayer, enemies.length, "enemy", () =>
      new THREE.Mesh(this.enemyGeometry, new THREE.MeshStandardMaterial({ color: ENEMY_COLOR }))
    );
    this.applyLayerVisibility(this.enemyPool, enemies.length);

    for (let index = 0; index < enemies.length; index += 1) {
      const enemy = enemies[index];
      const mesh = this.enemyPool[index];
      mesh.position.set(toWorldX(enemy.x, width), 0.24, toWorldZ(enemy.y, height));

      const material = (mesh as { material: THREE.MeshStandardMaterial }).material;
      material.color.setHex(ENEMY_COLOR);
      this.registerSelectable(mesh, {
        kind: "enemy",
        id: enemy.id,
        baseColor: ENEMY_COLOR,
        highlightColor: ENEMY_HIGHLIGHT_COLOR
      });
    }
  }

  private ensurePool(
    pool: THREE.Mesh[],
    layer: THREE.Group,
    required: number,
    kind: LayerKind,
    create: () => THREE.Mesh
  ): void {
    while (pool.length < required) {
      const mesh = create();
      layer.add(mesh);
      pool.push(mesh);
      this.allocationCounts[kind] += 1;
    }
  }

  private applyLayerVisibility(pool: THREE.Mesh[], visibleCount: number): void {
    for (let index = 0; index < pool.length; index += 1) {
      (pool[index] as { visible: boolean }).visible = index < visibleCount;
    }
  }

  private detachLayerChildren(layer: THREE.Group): void {
    for (const child of [...layer.children]) {
      layer.remove(child);
    }
  }

  private registerSelectable(object: THREE.Object3D, meta: SelectionMeta): void {
    this.selectableObjects.push(object);
    this.selectionByObject.set(object, meta);
  }

  private selectableContains(selection: RenderSelection): boolean {
    return this.selectableObjects.some((object) => {
      const meta = this.selectionByObject.get(object);
      return Boolean(meta && meta.kind === selection.kind && meta.id === selection.id);
    });
  }

  private bindInteractionEvents(): void {
    const canvas = this.renderer.domElement;
    canvas.addEventListener("contextmenu", this.onContextMenu);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerCancel);
    canvas.addEventListener("pointerleave", this.onPointerLeave);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
  }

  private unbindInteractionEvents(): void {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("contextmenu", this.onContextMenu);
    canvas.removeEventListener("pointerdown", this.onPointerDown);
    canvas.removeEventListener("pointermove", this.onPointerMove);
    canvas.removeEventListener("pointerup", this.onPointerUp);
    canvas.removeEventListener("pointercancel", this.onPointerCancel);
    canvas.removeEventListener("pointerleave", this.onPointerLeave);
    canvas.removeEventListener("wheel", this.onWheel);
  }

  private bindResizeEvents(): void {
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => {
        this.syncViewportSize();
        this.renderFrame();
      });
      this.resizeObserver.observe(this.container);
      return;
    }

    if (typeof window !== "undefined") {
      this.windowResizeHandler = () => {
        this.syncViewportSize();
        this.renderFrame();
      };
      window.addEventListener("resize", this.windowResizeHandler);
    }
  }

  private unbindResizeEvents(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.windowResizeHandler && typeof window !== "undefined") {
      window.removeEventListener("resize", this.windowResizeHandler);
      this.windowResizeHandler = null;
    }
  }

  private syncViewportSize(): void {
    const width = Math.max(1, Math.floor(this.container.clientWidth));
    const height = Math.max(1, Math.floor(this.container.clientHeight));
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  private updateCameraPose(): void {
    const radialDistance = this.cameraState.distance * Math.cos(this.cameraState.pitch);
    const cameraX = this.cameraState.focusX + radialDistance * Math.sin(this.cameraState.yaw);
    const cameraY = this.cameraState.distance * Math.sin(this.cameraState.pitch);
    const cameraZ = this.cameraState.focusZ + radialDistance * Math.cos(this.cameraState.yaw);

    this.camera.position.set(cameraX, cameraY, cameraZ);
    this.camera.lookAt(this.cameraState.focusX, 0, this.cameraState.focusZ);
  }

  private updateSelectionFromPointer(pointer: PointerEvent): void {
    if (this.selectableObjects.length === 0) {
      this.setSelection(null);
      return;
    }

    const bounds = this.renderer.domElement.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const clientX = getNumber(pointer.clientX, bounds.left + width / 2);
    const clientY = getNumber(pointer.clientY, bounds.top + height / 2);
    this.pointerNdc.set(((clientX - bounds.left) / width) * 2 - 1, -((clientY - bounds.top) / height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointerNdc, this.camera);

    const hit = this.raycaster.intersectObjects(this.selectableObjects, false)[0];
    if (!hit) {
      this.setSelection(null);
      return;
    }

    const meta = this.selectionByObject.get(hit.object);
    this.setSelection(meta ? { kind: meta.kind, id: meta.id } : null);
  }

  private setSelection(selection: RenderSelection | null): void {
    if (selectionsEqual(this.currentSelection, selection)) {
      return;
    }

    this.currentSelection = selection;
    this.applySelectionColor(selection);
    this.options.onSelectionChange?.(selection);
  }

  private applySelectionColor(selection: RenderSelection | null): void {
    for (const object of this.selectableObjects) {
      const meta = this.selectionByObject.get(object);
      if (!meta) {
        continue;
      }
      const isSelected = Boolean(selection && selection.kind === meta.kind && selection.id === meta.id);
      const material = (object as { material?: THREE.MeshStandardMaterial }).material;
      if (!material) {
        continue;
      }
      material.color.setHex(isSelected ? meta.highlightColor : meta.baseColor);
    }
  }

  private renderFrame(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private readonly onContextMenu = (event: MouseEvent): void => {
    event.preventDefault();
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    const pointerId = getNumber(event.pointerId, 0);
    const clientX = getNumber(event.clientX, 0);
    const clientY = getNumber(event.clientY, 0);
    const button = getNumber(event.button, 0);
    const mode =
      button === 0 && !event.shiftKey ? ("orbit" as const) : button === 2 || button === 1 || event.shiftKey ? ("pan" as const) : null;

    if (!mode) {
      return;
    }

    event.preventDefault();
    this.dragState = {
      pointerId,
      mode,
      lastClientX: clientX,
      lastClientY: clientY
    };
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const pointerId = getNumber(event.pointerId, 0);
    const clientX = getNumber(event.clientX, 0);
    const clientY = getNumber(event.clientY, 0);
    const dragState = this.dragState;

    if (!dragState || dragState.pointerId !== pointerId) {
      this.updateSelectionFromPointer(event);
      return;
    }

    const deltaX = clientX - dragState.lastClientX;
    const deltaY = clientY - dragState.lastClientY;
    this.dragState = {
      ...dragState,
      lastClientX: clientX,
      lastClientY: clientY
    };

    if (dragState.mode === "orbit") {
      this.cameraState.yaw = normalizeAngle(this.cameraState.yaw - deltaX * CAMERA_ORBIT_SENSITIVITY);
      this.cameraState.pitch = clamp(
        this.cameraState.pitch - deltaY * CAMERA_ORBIT_SENSITIVITY,
        CAMERA_MIN_PITCH,
        CAMERA_MAX_PITCH
      );
    } else {
      const scale = Math.max(0.01, this.cameraState.distance * CAMERA_PAN_SENSITIVITY);
      this.cameraState.focusX = clamp(this.cameraState.focusX - deltaX * scale, -this.panLimit.x, this.panLimit.x);
      this.cameraState.focusZ = clamp(this.cameraState.focusZ + deltaY * scale, -this.panLimit.z, this.panLimit.z);
    }

    this.updateCameraPose();
    this.renderFrame();
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const pointerId = getNumber(event.pointerId, 0);
    if (this.dragState?.pointerId === pointerId) {
      this.dragState = null;
    }
  };

  private readonly onPointerCancel = (event: PointerEvent): void => {
    this.onPointerUp(event);
  };

  private readonly onPointerLeave = (): void => {
    this.dragState = null;
    this.setSelection(null);
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.cameraState.distance = clamp(
      this.cameraState.distance + event.deltaY * CAMERA_ZOOM_SENSITIVITY,
      CAMERA_MIN_DISTANCE,
      CAMERA_MAX_DISTANCE
    );
    this.updateCameraPose();
    this.renderFrame();
  };
}
