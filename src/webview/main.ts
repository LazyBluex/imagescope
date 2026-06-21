import "./app.css";
import App from "./app.svelte";
import { mount } from "svelte";

try {
  const target = document.getElementById("app");
  if (!target) {
    throw new Error("Could not find #app element");
  }
  mount(App, { target });
} catch (err) {
  console.error("[ImageScope] Mount failed:", err);
  const el = document.getElementById("app");
  if (el) {
    el.innerHTML =
      '<p style="color:red;padding:16px;font-family:sans-serif">ImageScope Error: ' +
      String(err) +
      "</p>";
  }
}
