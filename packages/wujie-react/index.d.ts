import { bus, preloadApp, destroyApp, setupApp } from "wujie";
import React,{ReactElement} from 'react';

interface WujieReactProps {
  height?: string
  width?: string
  name: string
  loading?: ReactElement
  url: string
  alive?: boolean
  fetch?: (input: RequestInfo, init?: RequestInit) => Promise<Response>
  props?: object
  attrs?: object
  replace?: (codeText: string) => string
  sync?: boolean
  prefix?: object
  fiber?: boolean
  degrade?: boolean
  plugins?: any[]
  beforeLoad?: (appWindow: Window)=>void
  beforeMount?: (appWindow: Window)=>void
  afterMount?: (appWindow: Window)=>void
  beforeUnmount?: (appWindow: Window)=>void
  afterUnmount?: (appWindow: Window)=>void
  activated?: ()=>void
  deactivated?: ()=>void
  loadError?: (url: string, e: Error)=>void
}

interface IWujieReact extends React.FC<WujieReactProps> {
  bus: typeof bus;
  setupApp: typeof setupApp;
  preloadApp: typeof preloadApp;
  destroyApp: typeof destroyApp;
}

declare const WujieReact: IWujieReact;

export default WujieReact;
