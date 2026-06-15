import Wujie from "./sandbox";
import { cacheOptions } from "./index";
export interface SandboxCache {
    wujie?: Wujie;
    options?: cacheOptions;
}
export type appAddEventListenerOptions = AddEventListenerOptions & {
    targetWindow?: Window;
};
export declare const idToSandboxCacheMap: Map<String, SandboxCache>;
export declare function getWujieById(id: String): Wujie | null;
export declare function getOptionsById(id: String): cacheOptions | null;
export declare function addSandboxCacheWithWujie(id: string, sandbox: Wujie): void;
export declare function deleteWujieById(id: string): void;
export declare function addSandboxCacheWithOptions(id: string, options: cacheOptions): void;
export declare const documentProxyProperties: {
    modifyLocalProperties: string[];
    modifyProperties: string[];
    shadowProperties: string[];
    shadowMethods: string[];
    documentProperties: string[];
    documentMethods: string[];
    documentEvents: string[];
    ownerProperties: string[];
};
export declare const appDocumentAddEventListenerEvents: string[];
export declare const appDocumentOnEvents: string[];
export declare const mainDocumentAddEventListenerEvents: string[];
export declare const mainAndAppAddEventListenerEvents: string[];
export declare const appWindowAddEventListenerEvents: string[];
export declare const appWindowOnEvent: string[];
export declare const relativeElementTagAttrMap: {
    IMG: string;
    A: string;
    SOURCE: string;
};
export declare const windowProxyProperties: string[];
export declare const windowRegWhiteList: RegExp[];
export declare const rawElementAppendChild: <T extends Node>(node: T) => T;
export declare const rawElementRemoveChild: <T extends Node>(child: T) => T;
export declare const rawElementContains: (other: Node) => boolean;
export declare const rawHeadInsertBefore: <T extends Node>(node: T, child: Node) => T;
export declare const rawBodyInsertBefore: <T extends Node>(node: T, child: Node) => T;
export declare const rawInsertAdjacentElement: (where: InsertPosition, element: Element) => Element;
export declare const rawAddEventListener: (type: string, callback: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) => void;
export declare const rawRemoveEventListener: (type: string, callback: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions) => void;
export declare const rawWindowAddEventListener: {
    <K extends keyof WindowEventMap>(type: K, listener: (this: Window, ev: WindowEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
} & typeof addEventListener;
export declare const rawWindowRemoveEventListener: {
    <K extends keyof WindowEventMap>(type: K, listener: (this: Window, ev: WindowEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
} & typeof removeEventListener;
export declare const rawAppendChild: <T extends Node>(node: T) => T;
export declare const rawDocumentQuerySelector: {
    <K extends keyof HTMLElementTagNameMap>(selectors: K): HTMLElementTagNameMap[K];
    <K_1 extends keyof SVGElementTagNameMap>(selectors: K_1): SVGElementTagNameMap[K_1];
    <E extends Element = Element>(selectors: string): E;
};
