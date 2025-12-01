import { AfterViewInit, Directive, ElementRef, Input, NgZone, OnDestroy } from '@angular/core';

@Directive({
  selector: '[appAutoFitText]'
})
export class AutoFitTextDirective implements AfterViewInit, OnDestroy {
  @Input() minFontSize = 10; // px
  @Input() step = 1; // px

  private resizeObserver: any;
  private originalFontSizePx: number | null = null;

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    const el = this.el.nativeElement as HTMLElement;
    const computed = window.getComputedStyle(el).fontSize;
    this.originalFontSizePx = parseFloat(computed);

    // Run initial fit
    this.fitText();

    // Observe resize
    if ((window as any).ResizeObserver) {
      this.resizeObserver = new (window as any).ResizeObserver(() => {
        this.ngZone.run(() => this.fitText());
      });
      this.resizeObserver.observe(el);
    } else {
      window.addEventListener('resize', this.onWindowResize);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', this.onWindowResize);
    }
  }

  private onWindowResize = () => {
    this.fitText();
  };

  private fitText() {
    const el = this.el.nativeElement as HTMLElement;
    if (!el) return;

    // Reset to original first
    if (this.originalFontSizePx) {
      el.style.fontSize = `${this.originalFontSizePx}px`;
    }

    let fontSize = this.originalFontSizePx || 16;

    // Only single-line fitting, keep whitespace nowrap to avoid wrap
    el.style.whiteSpace = 'nowrap';
    el.style.overflow = 'hidden';

    // If it already fits, set original size and exit
    if (el.scrollWidth <= el.clientWidth) {
      return;
    }

    // Decrease font size until it fits or hits minFontSize
    while (el.scrollWidth > el.clientWidth && fontSize > this.minFontSize) {
      fontSize -= this.step;
      el.style.fontSize = `${fontSize}px`;

      // Avoid infinite loops in unusual conditions
      if (fontSize <= this.minFontSize) break;
    }
  }
}
