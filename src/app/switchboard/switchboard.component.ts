import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
  AfterViewInit,
  inject,
  PLATFORM_ID,
  HostListener,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanvasService } from '../services/canvas.service';
import { ToolbarComponent } from '../toolbar/toolbar.component';
import { PropertiesPanelComponent } from '../properties-panel/properties-panel.component';

@Component({
  selector: 'app-switchboard',
  imports: [ToolbarComponent, PropertiesPanelComponent],
  template: `
    <div class="switchboard-layout">
      <app-toolbar class="toolbar" />
      <div class="main-content">
        <div class="canvas-wrapper">
          <canvas #fabricCanvas></canvas>
        </div>
        <app-properties-panel class="properties" />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        overflow: hidden;
      }

      .switchboard-layout {
        display: flex;
        flex-direction: column;
        height: 100vh;
        width: 100vw;
        background-color: #1e1e1e;
      }

      .toolbar {
        flex-shrink: 0;
      }

      .main-content {
        display: flex;
        flex: 1;
        overflow: hidden;
        min-height: 0;
      }

      .canvas-wrapper {
        flex: 1;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        min-width: 0;
      }

      canvas {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        max-width: 100%;
        max-height: 100%;
      }

      .properties {
        flex-shrink: 0;
      }
    `,
  ],
})
export class SwitchboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('fabricCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;

  private readonly canvasService = inject(CanvasService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId) && this.canvasRef?.nativeElement) {
      this.canvasService.initCanvas(this.canvasRef.nativeElement);
      setTimeout(() => this.resizeCanvas(), 100);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.resizeCanvas();
  }

  private resizeCanvas(): void {
    if (isPlatformBrowser(this.platformId) && this.canvasRef?.nativeElement) {
      const parent = this.canvasRef.nativeElement.parentElement;
      if (parent) {
        const width = parent.clientWidth - 40;
        const height = parent.clientHeight - 40;
        this.canvasService.resizeCanvas(width, height);
      }
    }
  }

  ngOnDestroy(): void {
    this.canvasService.dispose();
  }
}
