#!/usr/bin/env node

import { Command } from "commander";
import { registerInitCommand } from "./commands/init.js";
import { registerAddCommand } from "./commands/add.js";
import { registerListCommand } from "./commands/list.js";
import { registerTodayCommand } from "./commands/today.js";
import { registerUpcomingCommand } from "./commands/upcoming.js";
import { registerDoneCommand } from "./commands/done.js";
import { registerCancelCommand } from "./commands/cancel.js";
import { registerEditCommand } from "./commands/edit.js";
import { registerDeleteCommand } from "./commands/delete.js";
import { registerShowCommand } from "./commands/show.js";
import { registerMoveCommand } from "./commands/move.js";
import { registerTagCommand } from "./commands/tag.js";
import { registerUntagCommand } from "./commands/untag.js";
import { registerSearchCommand } from "./commands/search.js";
import { registerProjectCommand } from "./commands/project.js";
import { registerAreaCommand } from "./commands/area.js";
import { registerStoresCommand } from "./commands/stores.js";
import { Store, getInbox } from "../core/index.js";
import { formatTodoList, formatError } from "./formatters.js";

const program = new Command();

program
  .name("tada")
  .description("A sleek CLI todo manager")
  .version("0.1.0")
  .option("-g, --global", "Use global ~/.tada/ store")
  .option("-l, --local", "Use local .tada/ store");

program.hook("preAction", (thisCommand) => {
  const opts = { ...program.opts(), ...thisCommand.opts() };
  if (opts.local) {
    Store.defaultMode = "local";
  } else if (opts.global || !Store.findRoot()) {
    Store.defaultMode = "global";
  } else {
    // Local .tada/ found and no explicit flag — use local
    Store.defaultMode = "local";
  }
});

registerInitCommand(program);
registerAddCommand(program);
registerListCommand(program);
registerTodayCommand(program);
registerUpcomingCommand(program);
registerDoneCommand(program);
registerCancelCommand(program);
registerEditCommand(program);
registerDeleteCommand(program);
registerShowCommand(program);
registerMoveCommand(program);
registerTagCommand(program);
registerUntagCommand(program);
registerSearchCommand(program);
registerProjectCommand(program);
registerAreaCommand(program);
registerStoresCommand(program);

// MCP server subcommand
program
  .command("mcp")
  .description("Start the MCP server (for AI assistant integration)")
  .action(async () => {
    const { startMcpServer } = await import("../mcp/index.js");
    await startMcpServer();
  });

// TUI subcommand
program
  .command("ui")
  .description("Launch interactive terminal UI")
  .action(async () => {
    const { startTui } = await import("../tui/index.js");
    await startTui();
  });

// Default action: launch TUI if TTY, otherwise show inbox
program.action(async () => {
  if (process.stdout.isTTY) {
    const { startTui } = await import("../tui/index.js");
    await startTui();
  } else {
    try {
      const store = new Store();
      const data = await store.load();
      const todos = getInbox(data);
      console.log(formatTodoList(todos, "Inbox"));
    } catch (err: any) {
      console.error(formatError(err.message));
      process.exit(1);
    }
  }
});

// Add -g and -l flags to all subcommands so `tada ls -g` / `tada ls -l` works
for (const cmd of program.commands) {
  if (!cmd.options.some((o: any) => o.long === "--global")) {
    cmd.option("-g, --global", "Use global ~/.tada/ store");
  }
  if (!cmd.options.some((o: any) => o.long === "--local")) {
    cmd.option("-l, --local", "Use local .tada/ store");
  }
}

program.parse();
