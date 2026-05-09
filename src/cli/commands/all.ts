import type { Command } from "commander";
import { Store, getAllTodos } from "../../core/index.js";
import type { SortMode } from "../../core/index.js";
import { formatError } from "../formatters.js";
import { renderMiniView } from "../mini-view.js";

export function registerAllCommand(program: Command) {
	program
		.command("all")
		.description("List all open todos (across projects, scheduled or not)")
		.option("--sort <mode>", "Sort by: created, alpha, due", "created")
		.action(async (opts) => {
			try {
				const store = new Store();
				const data = await store.load();
				const todos = getAllTodos(data, opts.sort as SortMode);
				console.log(renderMiniView("ALL", todos));
			} catch (err: any) {
				console.error(formatError(err.message));
				process.exit(1);
			}
		});
}
