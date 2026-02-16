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
  private readonly raycaster: THREE.Raycaster;
  private readonly pointerNdc: THREE.Vector2;
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

    this.replaceLayer(
      this.mapLayer,
      frame.map.map((cell) => this.createMapCellMesh(cell, frame.width, frame.height))
    );
    this.replaceLayer(
      this.pathLayer,
      frame.path.map((pathNode) => this.createPathNodeMesh(pathNode, frame.width, frame.height))
    );
    this.replaceLayer(
      this.towerLayer,
      frame.towers.map((tower) => this.createTowerMesh(tower, frame.width, frame.height))
    );
    this.replaceLayer(
      this.enemyLayer,
      frame.enemies.map((enemy) => this.createEnemyMesh(enemy, frame.width, frame.height))
    );

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

    this.clearLayer(this.mapLayer);
    this.clearLayer(this.pathLayer);
    this.clearLayer(this.towerLayer);
    this.clearLayer(this.enemyLayer);
    this.renderer.dispose();

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  private createMapCellMesh(cell: MapPlaceholder, width: number, height: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(MAP_CELL_SIZE, MAP_CELL_HEIGHT, MAP_CELL_SIZE),
      new THREE.MeshStandardMaterial({ color: MAP_CELL_COLORS[cell.kind] })
    );
    mesh.position.set(toWorldX(cell.x, width), 0, toWorldZ(cell.y, height));
    return mesh;
  }

  private createPathNodeMesh(pathNode: PathPlaceholder, width: number, height: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.08, 0.35),
      new THREE.MeshStandardMaterial({ color: PATH_COLOR })
    );
    mesh.position.set(
      toWorldX(pathNode.x, width),
      0.12 + pathNode.order * 0.0001,
      toWorldZ(pathNode.y, height)
    );
    return mesh;
  }

  private createTowerMesh(tower: TowerPlaceholder, width: number, height: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.34, 0.8, 12),
      new THREE.MeshStandardMaterial({ color: TOWER_COLOR })
    );
    mesh.position.set(toWorldX(tower.x, width), 0.45, toWorldZ(tower.y, height));
    this.registerSelectable(mesh, {
      kind: "tower",
      id: tower.id,
      baseColor: TOWER_COLOR,
      highlightColor: TOWER_HIGHLIGHT_COLOR
    });
    return mesh;
  }

  private createEnemyMesh(enemy: EnemyPlaceholder, width: number, height: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshStandardMaterial({ color: ENEMY_COLOR })
    );
    mesh.position.set(toWorldX(enemy.x, width), 0.24, toWorldZ(enemy.y, height));
    this.registerSelectable(mesh, {
      kind: "enemy",
      id: enemy.id,
      baseColor: ENEMY_COLOR,
      highlightColor: ENEMY_HIGHLIGHT_COLOR
    });
    return mesh;
  }

  private replaceLayer(layer: THREE.Group, objects: THREE.Object3D[]): void {
    this.clearLayer(layer);
    for (const object of objects) {
      layer.add(object);
    }
  }

  private clearLayer(layer: THREE.Group): void {
    for (const child of [...layer.children]) {
      layer.remove(child);
      const mesh = child as {
        geometry?: { dispose?: () => void };
        material?: unknown;
      };

      if (mesh.geometry && typeof mesh.geometry.dispose === "function") {
        mesh.geometry.dispose();
      }
      disposeMaterial(mesh.material);
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
