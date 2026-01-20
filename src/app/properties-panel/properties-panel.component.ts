import { Component, inject, effect } from '@angular/core';
import { CanvasService } from '../services/canvas.service';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ColorPickerModule } from 'primeng/colorpicker';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { DividerModule } from 'primeng/divider';

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
  ],
  template: `
    <div class="properties-panel">
      @if (selectedObject()) {
        <p-card header="Properties" styleClass="properties-card">
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
                      (ngModelChange)="updateProperty('stroke', $event)"
                      [inline]="false"
                    />
                    <input
                      type="text"
                      pInputText
                      [(ngModel)]="strokeColor"
                      (ngModelChange)="updateProperty('stroke', $event)"
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
                  <span class="slider-value">{{ strokeWidth }}</span>
                </div>
              }

              @if (hasFill) {
                <div class="property-field">
                  <label>Fill Color</label>
                  <div class="color-picker-wrapper">
                    <p-colorPicker
                      [(ngModel)]="fillColor"
                      (ngModelChange)="updateProperty('fill', $event)"
                      [inline]="false"
                    />
                    <input
                      type="text"
                      pInputText
                      [(ngModel)]="fillColor"
                      (ngModelChange)="updateProperty('fill', $event)"
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
          </div>
        </p-card>
      } @else {
        <p-card styleClass="properties-card empty-state">
          <div class="empty-message">
            <i class="pi pi-info-circle"></i>
            <p>Select an object to view and edit its properties</p>
          </div>
        </p-card>
      }
    </div>
  `,
  styles: [
    `
      .properties-panel {
        width: 320px;
        background: #252525;
        border-left: 1px solid #3a3a3a;
        overflow-y: auto;
        box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
      }

      :host ::ng-deep .properties-card {
        background: transparent;
        border: none;
        box-shadow: none;
      }

      :host ::ng-deep .properties-card .p-card-body {
        padding: 1rem;
      }

      :host ::ng-deep .properties-card .p-card-header {
        background: linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%);
        color: #00ff88;
        font-weight: 600;
        border-bottom: 2px solid #00ff88;
        padding: 1rem;
      }

      .property-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .property-group {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .property-label {
        font-size: 0.9rem;
        font-weight: 600;
        color: #00ff88;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .property-row {
        display: flex;
        gap: 0.75rem;
      }

      .property-field {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        flex: 1;
      }

      .property-field label {
        font-size: 0.85rem;
        color: #b0b0b0;
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
        font-size: 0.85rem;
        color: #e0e0e0;
        font-weight: 500;
        margin-top: 0.25rem;
      }

      .empty-state {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .empty-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        color: #808080;
        text-align: center;
        padding: 2rem;
      }

      .empty-message i {
        font-size: 3rem;
      }

      .empty-message p {
        margin: 0;
        line-height: 1.5;
      }

      :host ::ng-deep .p-inputnumber {
        width: 100%;
      }

      :host ::ng-deep .p-inputtext {
        background: #1a1a1a;
        border-color: #3a3a3a;
        color: #e0e0e0;
      }

      :host ::ng-deep .p-inputtext:focus {
        border-color: #00ff88;
        box-shadow: 0 0 0 0.2rem rgba(0, 255, 136, 0.25);
      }

      :host ::ng-deep .p-slider {
        background: #3a3a3a;
      }

      :host ::ng-deep .p-slider .p-slider-range {
        background: linear-gradient(90deg, #00ff88 0%, #00cc6a 100%);
      }

      :host ::ng-deep .p-slider .p-slider-handle {
        background: #00ff88;
        border-color: #00cc6a;
      }

      :host ::ng-deep .p-divider {
        margin: 0.5rem 0;
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
}
