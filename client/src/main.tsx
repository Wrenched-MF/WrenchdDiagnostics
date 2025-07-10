import { createRoot } from "react-dom/client";
import AppDebug from "./App-debug";
import "./index.css";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<AppDebug />);
}
