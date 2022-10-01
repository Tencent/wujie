import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from "@angular/core";
import { bus, startApp as rawStartApp, destroyApp, loadErrorHandler } from "wujie";

declare type lifecycle = (appWindow: Window) => any;

@Component({
  selector: "wujie-ngx",
  template: `<div [style.width]="width" [style.height]="height"></div>`,
})
export class WujieComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @Input() width: string;
  @Input() height: string;
  @Input() name: string;
  @Input() loading: HTMLElement;
  @Input() url: string;
  @Input() sync: boolean;
  @Input() prefix: { [key: string]: string };
  @Input() alive: boolean;
  @Input() props: object;
  @Input() attrs: object;
  @Input() replace: (code: string) => string;
  @Input() fetch: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  @Input() fiber: boolean;
  @Input() degrade: boolean;
  @Input() plugins: Array<any>;
  @Input() beforeLoad: lifecycle;
  @Input() beforeMount: lifecycle;
  @Input() afterMount: lifecycle;
  @Input() beforeUnmount: lifecycle;
  @Input() afterUnmount: lifecycle;
  @Input() activated: lifecycle;
  @Input() deactivated: lifecycle;
  @Input() loadError: loadErrorHandler;
  @Output() change = new EventEmitter();

  private startAppQueue = Promise.resolve();

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {}

  ngAfterViewInit(): void {
    bus.$onAll(this.handleEmit.bind(this));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      changes.name?.currentValue !== changes.name?.previousValue ||
      changes.url?.currentValue !== changes.url?.previousValue
    ) {
      this.execStartApp();
    }
  }

  ngOnDestroy() {
    bus.$offAll(this.handleEmit);
    !this.alive && destroyApp(this.name);
  }

  private handleEmit(event, ...args) {
    this.change.emit({ event, args });
  }

  private async startApp() {
    try {
      await rawStartApp({
        name: this.name,
        url: this.url,
        el: this.elementRef.nativeElement,
        loading: this.loading,
        alive: this.alive,
        fetch: this.fetch,
        props: this.props,
        attrs: this.attrs,
        replace: this.replace,
        sync: this.sync,
        prefix: this.prefix,
        fiber: this.fiber,
        degrade: this.degrade,
        plugins: this.plugins,
        beforeLoad: this.beforeLoad,
        beforeMount: this.beforeMount,
        afterMount: this.afterMount,
        beforeUnmount: this.beforeUnmount,
        afterUnmount: this.afterUnmount,
        activated: this.activated,
        deactivated: this.deactivated,
        loadError: this.loadError,
      });
    } catch (error) {
      console.log(error);
    }
  }

  private execStartApp() {
    this.startAppQueue = this.startAppQueue.then(this.startApp.bind(this));
  }
}
