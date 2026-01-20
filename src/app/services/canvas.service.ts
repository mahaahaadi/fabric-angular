import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Canvas, Rect, Circle, Line, IText, Group, FabricObject, ActiveSelection } from 'fabric';

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
  private zoomLevel = signal<number>(1);
  private isDrawing = false;
  private isPanning = false;
  private lastPosX = 0;
  private lastPosY = 0;
  private startX = 0;
  private startY = 0;
  private currentShape: FabricObject | null = null;

  readonly mode = this.drawingMode.asReadonly();
  readonly selection = this.selectedObject.asReadonly();
  readonly zoom = this.zoomLevel.asReadonly();
  readonly canDelete = computed(() => this.selectedObject() !== null);

  initCanvas(canvasElement: HTMLCanvasElement): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const parent = canvasElement.parentElement;
    
    // Use a base size that works well at 100% zoom
    // We'll use window.innerWidth/Height as reference since they're more stable
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate available space (accounting for sidebar ~320px and toolbar ~60px)
    const availableWidth = viewportWidth - 380;
    const availableHeight = viewportHeight - 100;
    
    const width = Math.max(availableWidth, 800);
    const height = Math.max(availableHeight, 500);

    this.canvas = new Canvas(canvasElement, {
      backgroundColor: '#2a2a2a',
      width: width,
      height: height,
      selection: true,
      preserveObjectStacking: true,
    });

    this.setupEventHandlers();
    this.renderGrid();
  }

  resizeCanvas(width: number, height: number): void {
    if (!this.canvas || !isPlatformBrowser(this.platformId)) {
      return;
    }

    // Use viewport-based calculation for more stable sizing
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate available space
    const availableWidth = viewportWidth - 380;
    const availableHeight = viewportHeight - 100;
    
    const adjustedWidth = Math.max(availableWidth, 800);
    const adjustedHeight = Math.max(availableHeight, 500);

    this.canvas.setDimensions({ width: adjustedWidth, height: adjustedHeight });
    this.canvas.requestRenderAll();
  }

  setDrawingMode(mode: DrawingMode): void {
    this.drawingMode.set(mode);
    if (this.canvas) {
      this.canvas.isDrawingMode = false;
      this.canvas.selection = mode === 'select';
      this.canvas.defaultCursor = mode === 'select' ? 'default' : 'crosshair';
      
      // Make all objects selectable/unselectable based on mode
      this.canvas.getObjects().forEach((obj: any) => {
        obj.selectable = mode === 'select';
        obj.evented = mode === 'select';
      });
      this.canvas.renderAll();
    }
  }

  private setupEventHandlers(): void {
    if (!this.canvas) return;

    this.canvas.on('mouse:down', (options: any) => this.handleMouseDown(options));
    this.canvas.on('mouse:move', (options: any) => this.handleMouseMove(options));
    this.canvas.on('mouse:up', () => this.handleMouseUp());
    this.canvas.on('mouse:wheel', (options: any) => this.handleMouseWheel(options));
    this.canvas.on('selection:created', (e: any) =>
      this.selectedObject.set(e.selected?.[0] || null),
    );
    this.canvas.on('selection:updated', (e: any) =>
      this.selectedObject.set(e.selected?.[0] || null),
    );
    this.canvas.on('selection:cleared', () => this.selectedObject.set(null));
    
    // Re-render grid before objects are rendered
    this.canvas.on('before:render', () => this.renderGrid());
  }

  private renderGrid(): void {
    if (!this.canvas) return;
    
    const ctx = this.canvas.getContext();
    const zoom = this.canvas.getZoom();
    const vpt = this.canvas.viewportTransform;
    if (!vpt) return;
    
    const gridSize = 20;
    const canvasWidth = this.canvas.width || 800;
    const canvasHeight = this.canvas.height || 600;
    
    // Save context state
    ctx.save();
    
    // Reset transform to draw in screen coordinates
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear and fill background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Apply viewport transform for grid
    ctx.setTransform(vpt[0], vpt[1], vpt[2], vpt[3], vpt[4], vpt[5]);
    
    // Calculate visible area in scene coordinates
    const visibleLeft = -vpt[4] / zoom;
    const visibleTop = -vpt[5] / zoom;
    const visibleRight = visibleLeft + canvasWidth / zoom;
    const visibleBottom = visibleTop + canvasHeight / zoom;
    
    // Calculate grid start and end points with some padding
    const startX = Math.floor(visibleLeft / gridSize) * gridSize - gridSize;
    const startY = Math.floor(visibleTop / gridSize) * gridSize - gridSize;
    const endX = Math.ceil(visibleRight / gridSize) * gridSize + gridSize;
    const endY = Math.ceil(visibleBottom / gridSize) * gridSize + gridSize;
    
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1 / zoom;
    
    // Draw vertical lines
    ctx.beginPath();
    for (let x = startX; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    
    // Draw horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
    
    ctx.restore();
  }

  private handleMouseWheel(options: any): void {
    if (!this.canvas) return;
    
    const evt = options.e;
    const delta = evt.deltaY;
    
    // Shift + scroll = pan horizontally, Ctrl + scroll = pan vertically
    if (evt.shiftKey || evt.ctrlKey) {
      evt.preventDefault();
      evt.stopPropagation();
      
      const vpt = this.canvas.viewportTransform;
      if (!vpt) return;
      
      const panAmount = 50; // pixels to pan per scroll
      
      if (evt.shiftKey) {
        // Horizontal pan
        vpt[4] -= delta > 0 ? panAmount : -panAmount;
      } else if (evt.ctrlKey) {
        // Vertical pan
        vpt[5] -= delta > 0 ? panAmount : -panAmount;
      }
      
      this.canvas.setViewportTransform(vpt);
      this.canvas.requestRenderAll();
      return;
    }
    
    // Default: zoom
    let zoom = this.canvas.getZoom();
    zoom *= 0.999 ** delta;
    
    // Limit zoom range
    if (zoom > 5) zoom = 5;
    if (zoom < 0.2) zoom = 0.2;
    
    // Zoom to mouse pointer position
    const pointer = this.canvas.getScenePoint(options.e);
    this.canvas.zoomToPoint(pointer, zoom);
    this.zoomLevel.set(zoom);
    this.canvas.requestRenderAll();
    
    evt.preventDefault();
    evt.stopPropagation();
  }

  zoomIn(): void {
    if (!this.canvas) return;
    let zoom = this.canvas.getZoom() * 1.2;
    if (zoom > 5) zoom = 5;
    
    const center = this.canvas.getCenterPoint();
    this.canvas.zoomToPoint(center, zoom);
    this.zoomLevel.set(zoom);
  }

  zoomOut(): void {
    if (!this.canvas) return;
    let zoom = this.canvas.getZoom() / 1.2;
    if (zoom < 0.2) zoom = 0.2;
    
    const center = this.canvas.getCenterPoint();
    this.canvas.zoomToPoint(center, zoom);
    this.zoomLevel.set(zoom);
  }

  resetZoom(): void {
    if (!this.canvas) return;
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.zoomLevel.set(1);
  }

  private handleMouseDown(options: any): void {
    if (!this.canvas) return;
    
    const evt = options.e;
    
    // Middle mouse button or Alt key for panning
    if (evt.button === 1 || evt.altKey) {
      this.isPanning = true;
      this.lastPosX = evt.clientX;
      this.lastPosY = evt.clientY;
      this.canvas.selection = false;
      this.canvas.defaultCursor = 'grabbing';
      return;
    }
    
    if (this.drawingMode() === 'select') return;

    const pointer = this.canvas.getScenePoint(options.e);
    this.isDrawing = true;
    this.startX = pointer.x;
    this.startY = pointer.y;

    const mode = this.drawingMode();

    if (mode === 'line') {
      this.currentShape = new Line([this.startX, this.startY, this.startX, this.startY], {
        stroke: '#00ff88',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: true,
      });
      this.canvas.add(this.currentShape);
    } else if (mode === 'rect') {
      this.currentShape = new Rect({
        left: this.startX,
        top: this.startY,
        width: 1,
        height: 1,
        fill: 'transparent',
        stroke: '#00ff88',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: true,
      });
      this.canvas.add(this.currentShape);
    } else if (mode === 'circle') {
      this.currentShape = new Circle({
        left: this.startX,
        top: this.startY,
        radius: 1,
        fill: 'transparent',
        stroke: '#00ff88',
        strokeWidth: 2,
        selectable: true,
        evented: true,
        hasControls: true,
      });
      this.canvas.add(this.currentShape);
    } else if (mode === 'switch' || mode === 'breaker' || mode === 'outlet') {
      this.addCircuitElement(mode, pointer.x, pointer.y);
      this.isDrawing = false;
      this.setDrawingMode('select');
    }
  }

  private handleMouseMove(options: any): void {
    if (!this.canvas) return;
    
    const evt = options.e;
    
    // Handle panning
    if (this.isPanning) {
      const vpt = this.canvas.viewportTransform;
      if (vpt) {
        vpt[4] += evt.clientX - this.lastPosX;
        vpt[5] += evt.clientY - this.lastPosY;
        this.lastPosX = evt.clientX;
        this.lastPosY = evt.clientY;
        this.canvas.requestRenderAll();
      }
      return;
    }
    
    if (!this.isDrawing || !this.currentShape) return;

    const pointer = this.canvas.getScenePoint(options.e);
    const mode = this.drawingMode();
    const isConstrained = evt.ctrlKey || evt.shiftKey; // Hold Ctrl or Shift for constrained drawing

    if (mode === 'line' && this.currentShape instanceof Line) {
      let x2 = pointer.x;
      let y2 = pointer.y;
      
      // Constrain to 45-degree angles
      if (isConstrained) {
        const dx = pointer.x - this.startX;
        const dy = pointer.y - this.startY;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);
        const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
        x2 = this.startX + Math.cos(snappedAngle) * distance;
        y2 = this.startY + Math.sin(snappedAngle) * distance;
      }
      
      this.currentShape.set({ x2, y2 });
    } else if (mode === 'rect' && this.currentShape instanceof Rect) {
      let width = pointer.x - this.startX;
      let height = pointer.y - this.startY;
      
      // Constrain to square
      if (isConstrained) {
        const size = Math.max(Math.abs(width), Math.abs(height));
        width = width < 0 ? -size : size;
        height = height < 0 ? -size : size;
      }
      
      this.currentShape.set({
        width: Math.abs(width),
        height: Math.abs(height),
        left: width < 0 ? this.startX + width : this.startX,
        top: height < 0 ? this.startY + height : this.startY,
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
    if (!this.canvas) return;
    
    // Stop panning
    if (this.isPanning) {
      this.isPanning = false;
      this.canvas.selection = this.drawingMode() === 'select';
      this.canvas.defaultCursor = this.drawingMode() === 'select' ? 'default' : 'crosshair';
      return;
    }
    
    if (!this.isDrawing) return;

    this.isDrawing = false;
    
    // Ensure the shape just created is selectable and has controls
    if (this.currentShape && this.canvas) {
      this.currentShape.set({
        selectable: true,
        evented: true,
        hasControls: true,
        hasBorders: true,
      });
      this.currentShape.setCoords();
      this.canvas.renderAll();
    }
    
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
      // Handle multiple selection (ActiveSelection)
      if (activeObject.type === 'activeselection') {
        (activeObject as ActiveSelection).forEachObject((obj) => {
          this.canvas?.remove(obj);
        });
        this.canvas.discardActiveObject();
      } else {
        this.canvas.remove(activeObject);
      }
      this.selectedObject.set(null);
      this.canvas.renderAll();
    }
  }

  selectAll(): void {
    if (!this.canvas) return;
    
    const objects = this.canvas.getObjects();
    if (objects.length === 0) return;
    
    this.canvas.discardActiveObject();
    const selection = new ActiveSelection(objects, {
      canvas: this.canvas,
    });
    this.canvas.setActiveObject(selection);
    this.canvas.requestRenderAll();
  }

  bringForward(): void {
    const obj = this.selectedObject();
    if (obj && this.canvas) {
      this.canvas.bringObjectForward(obj);
      this.canvas.requestRenderAll();
    }
  }

  sendBackward(): void {
    const obj = this.selectedObject();
    if (obj && this.canvas) {
      this.canvas.sendObjectBackwards(obj);
      this.canvas.requestRenderAll();
    }
  }

  bringToFront(): void {
    const obj = this.selectedObject();
    if (obj && this.canvas) {
      this.canvas.bringObjectToFront(obj);
      this.canvas.requestRenderAll();
    }
  }

  sendToBack(): void {
    const obj = this.selectedObject();
    if (obj && this.canvas) {
      this.canvas.sendObjectToBack(obj);
      this.canvas.requestRenderAll();
    }
  }

  moveSelected(deltaX: number, deltaY: number): void {
    const obj = this.selectedObject();
    if (obj && this.canvas) {
      obj.set({
        left: (obj.left || 0) + deltaX,
        top: (obj.top || 0) + deltaY,
      });
      obj.setCoords();
      this.canvas.requestRenderAll();
    }
  }

  private clipboard: FabricObject | null = null;

  copySelected(): void {
    const activeObject = this.canvas?.getActiveObject();
    if (!activeObject) return;
    
    activeObject.clone().then((cloned: FabricObject) => {
      this.clipboard = cloned;
    });
  }

  cutSelected(): void {
    this.copySelected();
    this.deleteSelected();
  }

  paste(): void {
    if (!this.clipboard || !this.canvas) return;
    
    this.clipboard.clone().then((cloned: FabricObject) => {
      this.canvas!.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
      });
      
      if (cloned.type === 'activeselection') {
        cloned.canvas = this.canvas!;
        (cloned as any).forEachObject((obj: FabricObject) => {
          this.canvas!.add(obj);
        });
        cloned.setCoords();
      } else {
        this.canvas!.add(cloned);
      }
      
      this.clipboard!.set({
        left: (this.clipboard!.left || 0) + 20,
        top: (this.clipboard!.top || 0) + 20,
      });
      
      this.canvas!.setActiveObject(cloned);
      this.canvas!.requestRenderAll();
    });
  }

  duplicateSelected(): void {
    const activeObject = this.canvas?.getActiveObject();
    if (!activeObject || !this.canvas) return;
    
    activeObject.clone().then((cloned: FabricObject) => {
      this.canvas!.discardActiveObject();
      cloned.set({
        left: (cloned.left || 0) + 20,
        top: (cloned.top || 0) + 20,
        evented: true,
      });
      
      if (cloned.type === 'activeselection') {
        cloned.canvas = this.canvas!;
        (cloned as any).forEachObject((obj: FabricObject) => {
          this.canvas!.add(obj);
        });
        cloned.setCoords();
      } else {
        this.canvas!.add(cloned);
      }
      
      this.canvas!.setActiveObject(cloned);
      this.canvas!.requestRenderAll();
    });
  }

  clearCanvas(): void {
    if (!this.canvas) return;

    this.canvas.clear();
    this.canvas.backgroundColor = '#2a2a2a';
    this.canvas.requestRenderAll();
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

  updateObjectProperty(property: string, value: any): void {
    const obj = this.selectedObject();
    if (!obj || !this.canvas) return;

    // Handle color properties - ensure proper format
    if (property === 'stroke' || property === 'fill') {
      // If value is an object with hex property (from color picker)
      if (value && typeof value === 'object' && 'hex' in value) {
        value = '#' + value.hex;
      }
      // Ensure the color is a string
      if (typeof value !== 'string') {
        value = String(value);
      }
    }

    obj.set(property as keyof typeof obj, value);
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
