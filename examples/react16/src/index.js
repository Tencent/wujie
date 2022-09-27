import "react-app-polyfill/stable";
import "react-app-polyfill/ie11";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import "./styles.css";

const basename = process.env.NODE_ENV === "production" ? "/demo-react16/" : "";

if (window.__POWERED_BY_WUJIE__) {
  // eslint-disable-next-line no-undef
  window.__WUJIE_MOUNT = () => {
    ReactDOM.render(
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>,
      document.getElementById("root")
    );
  };
  window.__WUJIE_UNMOUNT = () => {
    ReactDOM.unmountComponentAtNode(document.getElementById("root"));
  };
} else {
  ReactDOM.render(
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>,
    document.getElementById("root")
  );
}
