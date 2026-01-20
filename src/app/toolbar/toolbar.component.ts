import { Component, inject } from '@angular/core';
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
            <i class="pi pi-bolt" style="font-size: 1.5rem; color: #00ff88;"></i>
            <span class="project-title">Himalayan - Schneider Electric</span>
          </div>
        </div>

        <div class="p-toolbar-group-center">
          <div class="tool-group">
            <p-button
              icon="pi pi-cursor"
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
      }

      :host ::ng-deep .toolbar-custom {
        background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
        border: none;
        border-bottom: 2px solid #00ff88;
        padding: 0.75rem 1.5rem;
      }

      .logo-section {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .project-title {
        font-size: 1.1rem;
        font-weight: 600;
        color: #e0e0e0;
        letter-spacing: 0.5px;
      }

      .tool-group {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .divider {
        width: 1px;
        height: 30px;
        background: rgba(255, 255, 255, 0.2);
        margin: 0 1rem;
      }

      :host ::ng-deep .p-button {
        transition: all 0.2s ease;
      }

      :host ::ng-deep .p-button:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
      }

      :host ::ng-deep .p-button-success:not(.p-button-outlined) {
        background: linear-gradient(135deg, #00ff88 0%, #00cc6a 100%);
        border-color: #00ff88;
      }

      :host ::ng-deep .p-toolbar-group-center {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
    `,
  ],
})
export class ToolbarComponent {
  private readonly canvasService = inject(CanvasService);

  protected readonly currentMode = this.canvasService.mode;
  protected readonly canDelete = this.canvasService.canDelete;

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
