import { Component, inject, effect, computed } from '@angular/core';
import { CanvasService } from '../services/canvas.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ColorPickerModule } from 'primeng/colorpicker';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { trigger, state, style, animate, transition } from '@angular/animations';

@Component({
  selector: 'app-properties-panel',
  imports: [
    CardModule,
    InputTextModule,
    InputNumberModule,
    ColorPickerModule,
    FormsModule,
    SliderModule,
    DividerModule,
    TooltipModule,
  ],
  animations: [
    trigger('slideInOut', [
      state('hidden', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('visible', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition('hidden => visible', [
        animate('300ms ease-out')
      ]),
      transition('visible => hidden', [
        animate('200ms ease-in')
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms 100ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  template: `
    <div 
      class="properties-panel" 
      [@slideInOut]="selectedObject() ? 'visible' : 'hidden'"
      [class.has-selection]="selectedObject()"
    >
      @if (selectedObject()) {
        <div class="panel-header">
          <i class="pi pi-sliders-h"></i>
          <span>Properties</span>
        </div>
        <div class="panel-content" @fadeIn>
          <div class="property-section">
            <div class="property-group">
              <label class="property-label">Position</label>
              <div class="property-row">
                <div class="property-field">
                  <label>X</label>
                  <p-inputNumber
                    [(ngModel)]="left"
                    (ngModelChange)="updateProperty('left', $event)"
                    [showButtons]="true"
                    [step]="1"
                    mode="decimal"
                  />
                </div>
                <div class="property-field">
                  <label>Y</label>
                  <p-inputNumber
                    [(ngModel)]="top"
                    (ngModelChange)="updateProperty('top', $event)"
                    [showButtons]="true"
                    [step]="1"
                    mode="decimal"
                  />
                </div>
              </div>
            </div>

            <p-divider />

            <div class="property-group">
              <label class="property-label">Size</label>
              <div class="property-row">
                @if (hasWidth) {
                  <div class="property-field">
                    <label>Width</label>
                    <p-inputNumber
                      [(ngModel)]="width"
                      (ngModelChange)="updateProperty('width', $event)"
                      [showButtons]="true"
                      [step]="1"
                      [min]="1"
                      mode="decimal"
                    />
                  </div>
                }
                @if (hasHeight) {
                  <div class="property-field">
                    <label>Height</label>
                    <p-inputNumber
                      [(ngModel)]="height"
                      (ngModelChange)="updateProperty('height', $event)"
                      [showButtons]="true"
                      [step]="1"
                      [min]="1"
                      mode="decimal"
                    />
                  </div>
                }
                @if (hasRadius) {
                  <div class="property-field">
                    <label>Radius</label>
                    <p-inputNumber
                      [(ngModel)]="radius"
                      (ngModelChange)="updateProperty('radius', $event)"
                      [showButtons]="true"
                      [step]="1"
                      [min]="1"
                      mode="decimal"
                    />
                  </div>
                }
              </div>
            </div>

            <p-divider />

            <div class="property-group">
              <label class="property-label">Appearance</label>

              @if (hasStroke) {
                <div class="property-field">
                  <label>Stroke Color</label>
                  <div class="color-picker-wrapper">
                    <p-colorPicker
                      [(ngModel)]="strokeColor"
                      (onChange)="onColorChange('stroke', $event)"
                      [inline]="false"
                      format="hex"
                    />
                    <input
                      type="text"
                      pInputText
                      [(ngModel)]="strokeColor"
                      (change)="updateProperty('stroke', strokeColor)"
                      class="color-input"
                    />
                  </div>
                </div>

                <div class="property-field">
                  <label>Stroke Width</label>
                  <p-slider
                    [(ngModel)]="strokeWidth"
                    (ngModelChange)="updateProperty('strokeWidth', $event)"
                    [min]="0"
                    [max]="20"
                    [step]="1"
                  />
                  <span class="slider-value">{{ strokeWidth }}px</span>
                </div>
              }

              @if (hasFill) {
                <div class="property-field">
                  <label>Fill Color</label>
                  <div class="color-picker-wrapper">
                    <p-colorPicker
                      [(ngModel)]="fillColor"
                      (onChange)="onColorChange('fill', $event)"
                      [inline]="false"
                      format="hex"
                    />
                    <input
                      type="text"
                      pInputText
                      [(ngModel)]="fillColor"
                      (change)="updateProperty('fill', fillColor)"
                      class="color-input"
                    />
                  </div>
                </div>
              }
            </div>

            <p-divider />

            <div class="property-group">
              <label class="property-label">Transform</label>
              <div class="property-field">
                <label>Rotation</label>
                <p-slider
                  [(ngModel)]="angle"
                  (ngModelChange)="updateProperty('angle', $event)"
                  [min]="0"
                  [max]="360"
                  [step]="1"
                />
                <span class="slider-value">{{ angle }}°</span>
              </div>

              <div class="property-field">
                <label>Opacity</label>
                <p-slider
                  [(ngModel)]="opacity"
                  (ngModelChange)="updateProperty('opacity', $event)"
                  [min]="0"
                  [max]="1"
                  [step]="0.1"
                />
                <span class="slider-value">{{ (opacity * 100).toFixed(0) }}%</span>
              </div>
            </div>

            <p-divider />

            <div class="property-group">
              <label class="property-label">Layer Order</label>
              <div class="layer-controls">
                <button 
                  class="layer-btn" 
                  (click)="bringToFront()" 
                  pTooltip="Bring to Front"
                  tooltipPosition="top"
                >
                  <i class="pi pi-angle-double-up"></i>
                </button>
                <button 
                  class="layer-btn" 
                  (click)="bringForward()" 
                  pTooltip="Bring Forward"
                  tooltipPosition="top"
                >
                  <i class="pi pi-angle-up"></i>
                </button>
                <button 
                  class="layer-btn" 
                  (click)="sendBackward()" 
                  pTooltip="Send Backward"
                  tooltipPosition="top"
                >
                  <i class="pi pi-angle-down"></i>
                </button>
                <button 
                  class="layer-btn" 
                  (click)="sendToBack()" 
                  pTooltip="Send to Back"
                  tooltipPosition="top"
                >
                  <i class="pi pi-angle-double-down"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .properties-panel {
        width: 300px;
        height: 100%;
        max-height: 100%;
        background: #1a1a1a;
        border-left: 1px solid #333;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .properties-panel:not(.has-selection) {
        width: 0;
        min-width: 0;
        border: none;
        overflow: hidden;
      }

      .panel-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1rem;
        background: #000000;
        border-bottom: 2px solid #3DCD58;
        color: #3DCD58;
        font-weight: 600;
        font-size: 0.9rem;
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }

      .panel-header i {
        font-size: 1rem;
      }

      .panel-content {
        padding: 1rem;
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .panel-content::-webkit-scrollbar {
        width: 5px;
      }

      .panel-content::-webkit-scrollbar-track {
        background: #1a1a1a;
      }

      .panel-content::-webkit-scrollbar-thumb {
        background: #3DCD58;
        border-radius: 3px;
      }

      .panel-content::-webkit-scrollbar-thumb:hover {
        background: #2fb348;
      }

      .property-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding-bottom: 0.75rem;
      }

      .property-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .property-label {
        font-size: 0.7rem;
        font-weight: 600;
        color: #3DCD58;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .property-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }

      .property-field {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        min-width: 0;
      }

      .property-field label {
        font-size: 0.75rem;
        color: #808080;
        font-weight: 500;
      }

      .color-picker-wrapper {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }

      .color-input {
        flex: 1;
      }

      .slider-value {
        font-size: 0.75rem;
        color: #3DCD58;
        font-weight: 600;
        margin-top: 0.2rem;
      }

      :host ::ng-deep .p-inputnumber {
        width: 100%;
        display: flex;
        height: 2.5rem;
      }

      :host ::ng-deep .p-inputnumber .p-inputtext {
        width: 100%;
        min-width: 0;
        height: 2.5rem;
      }

      :host ::ng-deep .p-inputnumber-input {
        width: 100% !important;
        min-width: 0;
        text-align: left;
        padding: 0.5rem 2.5rem 0.5rem 0.75rem;
      }

      :host ::ng-deep .p-inputtext {
        background: #1a1a1a;
        border-color: #3a3a3a;
        color: #e0e0e0;
        font-size: 0.9rem;
        padding: 0.5rem 0.75rem;
      }

      :host ::ng-deep .p-inputtext:focus {
        border-color: #00ff88;
        box-shadow: 0 0 0 0.2rem rgba(0, 255, 136, 0.2);
      }

      :host ::ng-deep .p-inputnumber-button-group {
        display: flex;
        flex-direction: column;
        height: 2.5rem !important;
        overflow: hidden;
      }

      :host ::ng-deep .p-inputnumber-button-group > button,
      :host ::ng-deep .p-inputnumber-button-group > .p-button,
      :host ::ng-deep .p-inputnumber-stacked .p-inputnumber-button-group > button {
        background: #3a3a3a !important;
        border-color: #3a3a3a !important;
        color: #e0e0e0 !important;
        padding: 0 !important;
        width: 1.5rem !important;
        height: 1.25rem !important;
        min-height: 0 !important;
        max-height: 1.25rem !important;
        flex: 0 0 1.25rem !important;
      }

      :host ::ng-deep .p-inputnumber-button-group > button .p-icon,
      :host ::ng-deep .p-inputnumber-button-group > button svg {
        width: 0.5rem !important;
        height: 0.5rem !important;
      }

      :host ::ng-deep .p-inputnumber-button-group > button:hover {
        background: #3DCD58 !important;
        border-color: #3DCD58 !important;
        color: #000000 !important;
      }

      :host ::ng-deep .p-slider {
        background: #333;
        height: 5px;
      }

      :host ::ng-deep .p-slider .p-slider-range {
        background: #3DCD58;
      }

      :host ::ng-deep .p-slider .p-slider-handle {
        background: #3DCD58;
        border: 2px solid #2fb348;
        width: 14px;
        height: 14px;
        margin-top: -6px;
        transition: transform 0.15s ease;
      }

      :host ::ng-deep .p-slider .p-slider-handle:hover {
        transform: scale(1.15);
      }

      :host ::ng-deep .p-divider {
        margin: 0.5rem 0;
        border-color: #333;
      }

      :host ::ng-deep .p-colorpicker-preview {
        width: 28px;
        height: 28px;
        border-radius: 4px;
        border: 1px solid #333;
      }

      .layer-controls {
        display: flex;
        gap: 0.35rem;
        justify-content: space-between;
      }

      .layer-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5rem;
        background: transparent;
        border: none;
        border-radius: 4px;
        color: #808080;
        cursor: pointer;
        transition: all 0.15s ease;
      }

      .layer-btn:hover {
        background: rgba(61, 205, 88, 0.15);
        color: #3DCD58;
      }

      .layer-btn:active {
        background: rgba(61, 205, 88, 0.25);
      }

      .layer-btn i {
        font-size: 1rem;
      }
    `,
  ],
})
export class PropertiesPanelComponent {
  private readonly canvasService = inject(CanvasService);
  protected readonly selectedObject = this.canvasService.selection;

  protected left = 0;
  protected top = 0;
  protected width = 0;
  protected height = 0;
  protected radius = 0;
  protected angle = 0;
  protected opacity = 1;
  protected strokeColor = '#000000';
  protected fillColor = '#000000';
  protected strokeWidth = 1;

  protected hasWidth = false;
  protected hasHeight = false;
  protected hasRadius = false;
  protected hasStroke = false;
  protected hasFill = false;

  constructor() {
    effect(() => {
      const obj = this.selectedObject();
      if (obj) {
        this.updatePropertiesFromObject(obj);
      }
    });
  }

  private updatePropertiesFromObject(obj: any): void {
    this.left = obj.left || 0;
    this.top = obj.top || 0;
    this.angle = obj.angle || 0;
    this.opacity = obj.opacity !== undefined ? obj.opacity : 1;

    this.hasWidth = 'width' in obj && obj.type !== 'line';
    this.hasHeight = 'height' in obj && obj.type !== 'line';
    this.hasRadius = 'radius' in obj;
    this.hasStroke = 'stroke' in obj;
    this.hasFill = 'fill' in obj;

    if (this.hasWidth) this.width = obj.width || 0;
    if (this.hasHeight) this.height = obj.height || 0;
    if (this.hasRadius) this.radius = obj.radius || 0;
    if (this.hasStroke) {
      this.strokeColor = obj.stroke || '#000000';
      this.strokeWidth = obj.strokeWidth || 1;
    }
    if (this.hasFill) this.fillColor = obj.fill || '#000000';
  }

  protected updateProperty(property: string, value: any): void {
    this.canvasService.updateObjectProperty(property, value);
  }

  protected onColorChange(property: string, event: any): void {
    const color = event.value;
    if (property === 'stroke') {
      this.strokeColor = color;
    } else if (property === 'fill') {
      this.fillColor = color;
    }
    this.canvasService.updateObjectProperty(property, color);
  }

  protected bringToFront(): void {
    this.canvasService.bringToFront();
  }

  protected bringForward(): void {
    this.canvasService.bringForward();
  }

  protected sendBackward(): void {
    this.canvasService.sendBackward();
  }

  protected sendToBack(): void {
    this.canvasService.sendToBack();
  }
}
