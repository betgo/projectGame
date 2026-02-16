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
const ENEMY_COLOR = 0xdc2626;

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

export class ThreeRenderAdapter {
  private readonly scene: THREE.Scene;
  private readonly camera: THREE.PerspectiveCamera;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly mapLayer: THREE.Group;
  private readonly pathLayer: THREE.Group;
  private readonly towerLayer: THREE.Group;
  private readonly enemyLayer: THREE.Group;

  constructor(private readonly container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 200);
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
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
  }

  applySnapshot(snapshot: RenderSnapshot): void {
    const frame = buildPlaceholderFrame(snapshot);

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

    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
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
    return mesh;
  }

  private createEnemyMesh(enemy: EnemyPlaceholder, width: number, height: number): THREE.Mesh {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 12, 12),
      new THREE.MeshStandardMaterial({ color: ENEMY_COLOR })
    );
    mesh.position.set(toWorldX(enemy.x, width), 0.24, toWorldZ(enemy.y, height));
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
}
