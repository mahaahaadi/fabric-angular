import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Canvas, Rect, Circle, Line, IText, Group, FabricObject } from 'fabric';

export type DrawingMode =
  | 'select'
  | 'line'
  | 'rect'
  | 'circle'
  | 'text'
  | 'switch'
  | 'breaker'
  | 'outlet';

export interface CircuitElement {
  id: string;
  type: string;
  label: string;
  icon?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  private readonly platformId = inject(PLATFORM_ID);
  private canvas: Canvas | null = null;
  private drawingMode = signal<DrawingMode>('select');
  private selectedObject = signal<FabricObject | null>(null);
  private isDrawing = false;
  private startX = 0;
  private startY = 0;
  private currentShape: FabricObject | null = null;

  readonly mode = this.drawingMode.asReadonly();
  readonly selection = this.selectedObject.asReadonly();
  readonly canDelete = computed(() => this.selectedObject() !== null);

  initCanvas(canvasElement: HTMLCanvasElement): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const parent = canvasElement.parentElement;
    console.log('Canvas parent:', parent);
    console.log('Parent dimensions:', parent?.clientWidth, parent?.clientHeight);

    const width = parent ? Math.max(parent.clientWidth - 40, 800) : 1200;
    const height = parent ? Math.max(parent.clientHeight - 40, 500) : 700;

    console.log('Canvas dimensions:', width, height);

    this.canvas = new Canvas(canvasElement, {
      backgroundColor: '#2a2a2a',
      width: width,
      height: height,
      selection: true,
      preserveObjectStacking: true,
    });

    this.setupEventHandlers();
    this.addGrid();
  }

  resizeCanvas(width: number, height: number): void {
    if (!this.canvas || !isPlatformBrowser(this.platformId)) {
      return;
    }

    const adjustedWidth = Math.max(width, 800);
    const adjustedHeight = Math.max(height, 500);

    this.canvas.setDimensions({ width: adjustedWidth, height: adjustedHeight });
    this.clearAndRedrawGrid(adjustedWidth, adjustedHeight);
    this.canvas.renderAll();
  }

  private clearAndRedrawGrid(width: number, height: number): void {
    if (!this.canvas) return;

    // Remove old grid lines
    const objects = this.canvas.getObjects();
    objects.forEach((obj: any) => {
      if (obj.selectable === false && obj.evented === false) {
        this.canvas?.remove(obj);
      }
    });

    // Redraw grid
    const gridSize = 20;

    // Vertical lines
    for (let i = 0; i < width / gridSize; i++) {
      const line = new Line([i * gridSize, 0, i * gridSize, height], {
        stroke: '#3a3a3a',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      this.canvas.add(line);
      this.canvas.sendObjectToBack(line);
    }

    // Horizontal lines
    for (let i = 0; i < height / gridSize; i++) {
      const line = new Line([0, i * gridSize, width, i * gridSize], {
        stroke: '#3a3a3a',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      this.canvas.add(line);
      this.canvas.sendObjectToBack(line);
    }
  }

  setDrawingMode(mode: DrawingMode): void {
    this.drawingMode.set(mode);
    if (this.canvas) {
      this.canvas.isDrawingMode = false;
      this.canvas.selection = mode === 'select';
      this.canvas.defaultCursor = mode === 'select' ? 'default' : 'crosshair';
    }
  }

  private setupEventHandlers(): void {
    if (!this.canvas) return;

    this.canvas.on('mouse:down', (options: any) => this.handleMouseDown(options));
    this.canvas.on('mouse:move', (options: any) => this.handleMouseMove(options));
    this.canvas.on('mouse:up', () => this.handleMouseUp());
    this.canvas.on('selection:created', (e: any) =>
      this.selectedObject.set(e.selected?.[0] || null),
    );
    this.canvas.on('selection:updated', (e: any) =>
      this.selectedObject.set(e.selected?.[0] || null),
    );
    this.canvas.on('selection:cleared', () => this.selectedObject.set(null));
  }

  private handleMouseDown(options: any): void {
    if (!this.canvas || this.drawingMode() === 'select') return;

    const pointer = this.canvas.getScenePoint(options.e);
    this.isDrawing = true;
    this.startX = pointer.x;
    this.startY = pointer.y;

    const mode = this.drawingMode();

    if (mode === 'line') {
      this.currentShape = new Line([this.startX, this.startY, this.startX, this.startY], {
        stroke: '#00ff88',
        strokeWidth: 3,
        selectable: true,
        hasControls: true,
      });
      this.canvas.add(this.currentShape);
    } else if (mode === 'rect') {
      this.currentShape = new Rect({
        left: this.startX,
        top: this.startY,
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: '#4285f4',
        strokeWidth: 2,
        selectable: true,
      });
      this.canvas.add(this.currentShape);
    } else if (mode === 'circle') {
      this.currentShape = new Circle({
        left: this.startX,
        top: this.startY,
        radius: 1,
        fill: 'transparent',
        stroke: '#f4b400',
        strokeWidth: 2,
        selectable: true,
      });
      this.canvas.add(this.currentShape);
    } else if (mode === 'switch' || mode === 'breaker' || mode === 'outlet') {
      this.addCircuitElement(mode, pointer.x, pointer.y);
      this.isDrawing = false;
      this.setDrawingMode('select');
    }
  }

  private handleMouseMove(options: any): void {
    if (!this.canvas || !this.isDrawing || !this.currentShape) return;

    const pointer = this.canvas.getScenePoint(options.e);
    const mode = this.drawingMode();

    if (mode === 'line' && this.currentShape instanceof Line) {
      this.currentShape.set({ x2: pointer.x, y2: pointer.y });
    } else if (mode === 'rect' && this.currentShape instanceof Rect) {
      const width = pointer.x - this.startX;
      const height = pointer.y - this.startY;
      this.currentShape.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? pointer.x : this.startX,
        top: height < 0 ? pointer.y : this.startY,
      });
    } else if (mode === 'circle' && this.currentShape instanceof Circle) {
      const radius = Math.sqrt(
        Math.pow(pointer.x - this.startX, 2) + Math.pow(pointer.y - this.startY, 2),
      );
      this.currentShape.set({ radius });
    }

    this.canvas.renderAll();
  }

  private handleMouseUp(): void {
    if (!this.isDrawing) return;

    this.isDrawing = false;
    this.currentShape = null;

    if (this.canvas && this.drawingMode() !== 'select') {
      this.setDrawingMode('select');
    }
  }

  private addCircuitElement(type: string, x: number, y: number): void {
    if (!this.canvas) return;

    const size = 40;
    let group: Group;

    if (type === 'switch') {
      const rect = new Rect({
        width: size,
        height: size,
        fill: '#34a853',
        stroke: '#1e8e3e',
        strokeWidth: 2,
        rx: 5,
        ry: 5,
      });
      const line1 = new Line([10, 10, 30, 30], {
        stroke: 'white',
        strokeWidth: 3,
      });
      const line2 = new Line([30, 10, 10, 30], {
        stroke: 'white',
        strokeWidth: 3,
      });
      group = new Group([rect, line1, line2], {
        left: x - size / 2,
        top: y - size / 2,
      });
    } else if (type === 'breaker') {
      const rect = new Rect({
        width: size * 1.5,
        height: size,
        fill: '#ea4335',
        stroke: '#c5221f',
        strokeWidth: 2,
        rx: 3,
        ry: 3,
      });
      const text = new IText('CB', {
        fontSize: 16,
        fill: 'white',
        fontWeight: 'bold',
        left: size * 0.35,
        top: size * 0.3,
      });
      group = new Group([rect, text], {
        left: x - (size * 1.5) / 2,
        top: y - size / 2,
      });
    } else {
      // outlet
      const circle = new Circle({
        radius: size / 2,
        fill: '#fbbc04',
        stroke: '#f29900',
        strokeWidth: 2,
      });
      const dot1 = new Circle({
        radius: 3,
        fill: 'white',
        left: size / 2 - 8,
        top: size / 2 - 3,
      });
      const dot2 = new Circle({
        radius: 3,
        fill: 'white',
        left: size / 2 + 2,
        top: size / 2 - 3,
      });
      group = new Group([circle, dot1, dot2], {
        left: x - size / 2,
        top: y - size / 2,
      });
    }

    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.canvas.renderAll();
  }

  addText(): void {
    if (!this.canvas) return;

    const text = new IText('Label', {
      left: 100,
      top: 100,
      fontSize: 16,
      fill: '#ffffff',
      fontFamily: 'Arial',
    });

    this.canvas.add(text);
    this.canvas.setActiveObject(text);
    this.canvas.renderAll();
  }

  deleteSelected(): void {
    if (!this.canvas || !this.selectedObject()) return;

    const activeObject = this.canvas.getActiveObject();
    if (activeObject) {
      this.canvas.remove(activeObject);
      this.selectedObject.set(null);
      this.canvas.renderAll();
    }
  }

  clearCanvas(): void {
    if (!this.canvas) return;

    this.canvas.clear();
    this.canvas.backgroundColor = '#2a2a2a';
    this.addGrid();
    this.canvas.renderAll();
  }

  exportToJSON(): string {
    if (!this.canvas) return '{}';
    return JSON.stringify(this.canvas.toJSON());
  }

  loadFromJSON(json: string): void {
    if (!this.canvas) return;

    this.canvas.loadFromJSON(json, () => {
      this.canvas?.renderAll();
    });
  }

  exportToPNG(): string {
    if (!this.canvas) return '';
    return this.canvas.toDataURL({ format: 'png', quality: 1, multiplier: 1 });
  }

  private addGrid(): void {
    if (!this.canvas) return;

    const gridSize = 20;
    const width = this.canvas.width || 800;
    const height = this.canvas.height || 600;

    // Vertical lines
    for (let i = 0; i < width / gridSize; i++) {
      const line = new Line([i * gridSize, 0, i * gridSize, height], {
        stroke: '#3a3a3a',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      this.canvas.add(line);
      this.canvas.sendObjectToBack(line);
    }

    // Horizontal lines
    for (let i = 0; i < height / gridSize; i++) {
      const line = new Line([0, i * gridSize, width, i * gridSize], {
        stroke: '#3a3a3a',
        strokeWidth: 1,
        selectable: false,
        evented: false,
      });
      this.canvas.add(line);
      this.canvas.sendObjectToBack(line);
    }
  }

  updateObjectProperty(property: string, value: any): void {
    const obj = this.selectedObject();
    if (!obj || !this.canvas) return;

    (obj as any)[property] = value;
    obj.setCoords();
    this.canvas.renderAll();
  }

  getCanvas(): Canvas | null {
    return this.canvas;
  }

  dispose(): void {
    if (this.canvas) {
      this.canvas.dispose();
      this.canvas = null;
    }
  }
}
