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
        overflow: auto;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 20px;
        min-width: 0;
        background-color: #1a1a1a;
      }

      canvas {
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        border-radius: 4px;
        flex-shrink: 0;
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

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    // Don't trigger shortcuts when typing in input fields
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'z':
        if (event.ctrlKey && !event.shiftKey) {
          event.preventDefault();
          this.canvasService.undo();
        }
        break;
      case 'y':
        if (event.ctrlKey) {
          event.preventDefault();
          this.canvasService.redo();
        }
        break;
      case 'a':
        if (event.ctrlKey) {
          event.preventDefault();
          this.canvasService.selectAll();
        }
        break;
      case 'c':
        if (event.ctrlKey) {
          event.preventDefault();
          this.canvasService.copySelected();
        } else {
          this.canvasService.setDrawingMode('circle');
        }
        break;
      case 'v':
        if (event.ctrlKey) {
          event.preventDefault();
          this.canvasService.paste();
        } else {
          this.canvasService.setDrawingMode('select');
        }
        break;
      case 'x':
        if (event.ctrlKey) {
          event.preventDefault();
          this.canvasService.cutSelected();
        }
        break;
      case 'd':
        if (event.ctrlKey) {
          event.preventDefault();
          this.canvasService.duplicateSelected();
        }
        break;
      case 'l':
        this.canvasService.setDrawingMode('line');
        break;
      case 'r':
        this.canvasService.setDrawingMode('rect');
        break;
      case 't':
        this.canvasService.addText();
        break;
      case 'delete':
      case 'backspace':
        event.preventDefault();
        this.canvasService.deleteSelected();
        break;
      case 'escape':
        this.canvasService.setDrawingMode('select');
        break;
      case '=':
      case '+':
        event.preventDefault();
        this.canvasService.zoomIn();
        break;
      case '-':
        event.preventDefault();
        this.canvasService.zoomOut();
        break;
      case '0':
        if (event.ctrlKey) {
          event.preventDefault();
          this.canvasService.resetZoom();
        }
        break;
      case 'arrowup':
        event.preventDefault();
        this.canvasService.moveSelected(0, event.shiftKey ? -10 : -1);
        break;
      case 'arrowdown':
        event.preventDefault();
        this.canvasService.moveSelected(0, event.shiftKey ? 10 : 1);
        break;
      case 'arrowleft':
        event.preventDefault();
        this.canvasService.moveSelected(event.shiftKey ? -10 : -1, 0);
        break;
      case 'arrowright':
        event.preventDefault();
        this.canvasService.moveSelected(event.shiftKey ? 10 : 1, 0);
        break;
    }
  }

  private resizeCanvas(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.canvasService.resizeCanvas(0, 0);
    }
  }

  ngOnDestroy(): void {
    this.canvasService.dispose();
  }
}
