import React from "react";
import { render } from "ink";
import { App } from "./App.js";

export function startTui() {
  // Enter alternate screen buffer (like vim/nvim)
  process.stdout.write("\x1b[?1049h");
  process.stdout.write("\x1b[H");

  const { waitUntilExit } = render(<App />);
  return waitUntilExit().finally(() => {
    // Leave alternate screen buffer, restoring original terminal content
    process.stdout.write("\x1b[?1049l");
  });
}
