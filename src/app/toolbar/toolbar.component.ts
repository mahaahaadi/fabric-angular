import { Component, inject, computed } from '@angular/core';
import { CanvasService, DrawingMode } from '../services/canvas.service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { ToolbarModule } from 'primeng/toolbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-toolbar',
  imports: [ButtonModule, TooltipModule, ToolbarModule, SplitButtonModule],
  template: `
    <div class="toolbar-container">
      <p-toolbar styleClass="toolbar-custom">
        <div class="p-toolbar-group-start">
          <div class="logo-section">
            <i class="pi pi-bolt" style="font-size: 1.25rem; color: #3DCD58;"></i>
            <span class="project-title">Himalayan - Schneider Electric</span>
          </div>
        </div>

        <div class="p-toolbar-group-center">
          <div class="tool-group">
            <p-button
              icon="pi pi-arrow-up-left"
              [class]="currentMode() === 'select' ? 'p-button-success' : 'p-button-outlined'"
              (onClick)="setMode('select')"
              pTooltip="Select (V)"
              tooltipPosition="bottom"
            />
            <p-button
              icon="pi pi-minus"
              [class]="currentMode() === 'line' ? 'p-button-success' : 'p-button-outlined'"
              (onClick)="setMode('line')"
              pTooltip="Draw Line (L)"
              tooltipPosition="bottom"
            />
            <p-button
              icon="pi pi-stop"
              [class]="currentMode() === 'rect' ? 'p-button-success' : 'p-button-outlined'"
              (onClick)="setMode('rect')"
              pTooltip="Rectangle (R)"
              tooltipPosition="bottom"
            />
            <p-button
              icon="pi pi-circle"
              [class]="currentMode() === 'circle' ? 'p-button-success' : 'p-button-outlined'"
              (onClick)="setMode('circle')"
              pTooltip="Circle (C)"
              tooltipPosition="bottom"
            />
            <p-button
              icon="pi pi-comment"
              (onClick)="addText()"
              class="p-button-outlined"
              pTooltip="Add Text (T)"
              tooltipPosition="bottom"
            />
          </div>

          <div class="divider"></div>

          <div class="tool-group">
            <p-button
              icon="pi pi-power-off"
              [class]="currentMode() === 'switch' ? 'p-button-info' : 'p-button-outlined'"
              (onClick)="setMode('switch')"
              pTooltip="Add Switch"
              tooltipPosition="bottom"
            />
            <p-button
              icon="pi pi-shield"
              [class]="currentMode() === 'breaker' ? 'p-button-danger' : 'p-button-outlined'"
              (onClick)="setMode('breaker')"
              pTooltip="Add Circuit Breaker"
              tooltipPosition="bottom"
            />
            <p-button
              icon="pi pi-globe"
              [class]="currentMode() === 'outlet' ? 'p-button-warning' : 'p-button-outlined'"
              (onClick)="setMode('outlet')"
              pTooltip="Add Outlet"
              tooltipPosition="bottom"
            />
          </div>
          <div class="divider"></div>

          <div class="tool-group">
            <p-button
              icon="pi pi-undo"
              (onClick)="undo()"
              [disabled]="!canUndo()"
              class="p-button-outlined p-button-secondary"
              pTooltip="Undo (Ctrl+Z)"
              tooltipPosition="bottom"
            />
            <p-button
              icon="pi pi-refresh"
              (onClick)="redo()"
              [disabled]="!canRedo()"
              class="p-button-outlined p-button-secondary"
              pTooltip="Redo (Ctrl+Y)"
              tooltipPosition="bottom"
            />
          </div>

          <div class="divider"></div>

          <div class="tool-group zoom-controls">
            <p-button
              icon="pi pi-minus"
              (onClick)="zoomOut()"
              class="p-button-outlined p-button-secondary"
              pTooltip="Zoom Out (-)"
              tooltipPosition="bottom"
            />
            <span class="zoom-level" (click)="resetZoom()" pTooltip="Reset Zoom">{{ zoomPercent() }}%</span>
            <p-button
              icon="pi pi-plus"
              (onClick)="zoomIn()"
              class="p-button-outlined p-button-secondary"
              pTooltip="Zoom In (+)"
              tooltipPosition="bottom"
            />
          </div>
        </div>

        <div class="p-toolbar-group-end">
          <div class="tool-group">
            <p-button
              icon="pi pi-trash"
              (onClick)="deleteSelected()"
              [disabled]="!canDelete()"
              class="p-button-outlined p-button-danger"
              pTooltip="Delete (Del)"
              tooltipPosition="bottom"
            />
            <p-splitButton
              label="Save"
              icon="pi pi-save"
              (onClick)="saveProject()"
              [model]="fileMenuItems"
              class="p-button-success"
            />
          </div>
        </div>
      </p-toolbar>
    </div>
  `,
  styles: [
    `
      .toolbar-container {
        width: 100%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        z-index: 100;
        flex-shrink: 0;
      }

      :host ::ng-deep .toolbar-custom {
        background: #000000;
        border: none;
        border-bottom: 2px solid #3DCD58;
        padding: 0.4rem 1.5rem;
        flex-wrap: nowrap;
        min-height: auto;
      }

      .logo-section {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
      }

      .project-title {
        font-size: 0.95rem;
        font-weight: 600;
        color: #e0e0e0;
        letter-spacing: 0.5px;
      }

      .tool-group {
        display: flex;
        gap: 0.2rem;
        align-items: center;
        flex-shrink: 0;
      }

      .zoom-controls {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        padding: 2px 6px;
      }

      .zoom-level {
        min-width: 45px;
        text-align: center;
        font-size: 0.8rem;
        font-weight: 600;
        color: #3DCD58;
        cursor: pointer;
        padding: 2px 6px;
        border-radius: 4px;
        transition: background 0.2s;
      }

      .zoom-level:hover {
        background: rgba(61, 205, 88, 0.15);
      }

      .divider {
        width: 1px;
        height: 24px;
        background: rgba(255, 255, 255, 0.15);
        margin: 0 0.5rem;
        flex-shrink: 0;
      }

      :host ::ng-deep .p-toolbar-group-center {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-shrink: 0;
      }

      :host ::ng-deep .p-toolbar-group-end {
        flex-shrink: 0;
      }

      /* Button base styles */
      :host ::ng-deep .p-button {
        min-width: 36px;
        min-height: 36px;
        width: 36px;
        height: 36px;
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        border-radius: 6px;
        position: relative;
        overflow: hidden;
      }

      :host ::ng-deep .p-button .p-button-icon {
        font-size: 1rem;
      }

      /* Outlined button styles (inactive) */
      :host ::ng-deep .p-button-outlined {
        background: transparent;
        border: none;
        color: #808080;
      }

      :host ::ng-deep .p-button-outlined:hover:not(:disabled) {
        background: rgba(61, 205, 88, 0.1);
        color: #3DCD58;
      }

      :host ::ng-deep .p-button-outlined:active:not(:disabled) {
        background: rgba(61, 205, 88, 0.2);
      }

      /* Active/Selected button styles - Schneider Green */
      :host ::ng-deep .p-button-success:not(.p-button-outlined) {
        background: #3DCD58;
        border: none;
        color: #ffffff;
        border-radius: 6px;
      }

      :host ::ng-deep .p-button-success:not(.p-button-outlined):hover {
        background: #2fb348;
      }

      :host ::ng-deep .p-button-success:not(.p-button-outlined) .p-button-icon {
        color: #ffffff;
      }

      /* Info button (Switch) - Schneider Blue */
      :host ::ng-deep .p-button-info:not(.p-button-outlined) {
        background: #42B4E6;
        border: none;
        color: #000000;
      }

      :host ::ng-deep .p-button-info:not(.p-button-outlined):hover {
        background: #329fd1;
      }

      :host ::ng-deep .p-button-info:not(.p-button-outlined) .p-button-icon {
        color: #000000;
      }

      /* Danger button (Breaker) */
      :host ::ng-deep .p-button-danger:not(.p-button-outlined) {
        background: #ef4444;
        border: none;
        color: #ffffff;
      }

      :host ::ng-deep .p-button-danger:not(.p-button-outlined):hover {
        background: #dc2626;
      }

      /* Warning button (Outlet) */
      :host ::ng-deep .p-button-warning:not(.p-button-outlined) {
        background: #f59e0b;
        border: none;
        color: #000000;
      }

      :host ::ng-deep .p-button-warning:not(.p-button-outlined):hover {
        background: #d97706;
      }

      /* Delete button */
      :host ::ng-deep .p-button-outlined.p-button-danger {
        color: #ef4444;
      }

      :host ::ng-deep .p-button-outlined.p-button-danger:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
      }

      /* Split button (Save) */
      :host ::ng-deep .p-splitbutton {
        flex-shrink: 0;
      }

      :host ::ng-deep .p-splitbutton .p-button {
        min-width: auto;
        width: auto;
        padding: 0.4rem 0.8rem;
        height: 36px;
      }

      :host ::ng-deep .p-splitbutton .p-button-success {
        background: #3DCD58;
        border: none;
        color: #000000;
        font-weight: 600;
      }

      :host ::ng-deep .p-splitbutton .p-button-success:hover {
        background: #2fb348;
      }

      :host ::ng-deep .p-splitbutton .p-splitbutton-menubutton {
        border-left: 1px solid rgba(0, 0, 0, 0.2);
      }

      /* Dropdown menu styling */
      :host ::ng-deep .p-tieredmenu,
      :host ::ng-deep .p-menu {
        background: #1a1a1a;
        border: 1px solid #333;
        border-radius: 6px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        padding: 0.5rem;
        min-width: 180px;
      }

      :host ::ng-deep .p-menuitem {
        margin: 0.25rem 0;
      }

      :host ::ng-deep .p-menuitem-link {
        padding: 0.6rem 1rem;
        border-radius: 4px;
        transition: all 0.15s ease;
      }

      :host ::ng-deep .p-menuitem-link:not(.p-disabled):hover {
        background: rgba(61, 205, 88, 0.15);
      }

      :host ::ng-deep .p-menuitem-link .p-menuitem-text {
        color: #e0e0e0;
        font-weight: 500;
      }

      :host ::ng-deep .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {
        color: #3DCD58;
      }

      :host ::ng-deep .p-menuitem-link .p-menuitem-icon {
        color: #808080;
        margin-right: 0.75rem;
      }

      :host ::ng-deep .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {
        color: #3DCD58;
      }
    `,
  ],
})
export class ToolbarComponent {
  private readonly canvasService = inject(CanvasService);

  protected readonly currentMode = this.canvasService.mode;
  protected readonly canDelete = this.canvasService.canDelete;
  protected readonly zoomPercent = computed(() => Math.round(this.canvasService.zoom() * 100));

  protected fileMenuItems: MenuItem[] = [
    {
      label: 'Open',
      icon: 'pi pi-folder-open',
      command: () => this.openProject(),
    },
    {
      label: 'Export as PNG',
      icon: 'pi pi-image',
      command: () => this.exportPNG(),
    },
    {
      label: 'Clear Canvas',
      icon: 'pi pi-times-circle',
      command: () => this.clearCanvas(),
    },
  ];

  protected setMode(mode: DrawingMode): void {
    this.canvasService.setDrawingMode(mode);
  }

  protected addText(): void {
    this.canvasService.addText();
  }

  protected deleteSelected(): void {
    this.canvasService.deleteSelected();
  }

  protected undo(): void {
    this.canvasService.undo();
  }

  protected redo(): void {
    this.canvasService.redo();
  }

  protected canUndo(): boolean {
    return this.canvasService.canUndo();
  }

  protected canRedo(): boolean {
    return this.canvasService.canRedo();
  }

  protected zoomIn(): void {
    this.canvasService.zoomIn();
  }

  protected zoomOut(): void {
    this.canvasService.zoomOut();
  }

  protected resetZoom(): void {
    this.canvasService.resetZoom();
  }

  protected saveProject(): void {
    const json = this.canvasService.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `himalayan-switchboard-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected openProject(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const json = event.target?.result as string;
          this.canvasService.loadFromJSON(json);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  protected exportPNG(): void {
    const dataURL = this.canvasService.exportToPNG();
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `himalayan-switchboard-${Date.now()}.png`;
    link.click();
  }

  protected clearCanvas(): void {
    if (confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      this.canvasService.clearCanvas();
    }
  }
}
