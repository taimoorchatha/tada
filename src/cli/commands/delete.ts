import type { Command } from "commander";
import { Store, deleteTodo, findByPrefixOrThrow } from "../../core/index.js";
import { formatSuccess, formatError } from "../formatters.js";
import { confirm } from "../prompts.js";

export function registerDeleteCommand(program: Command) {
	program
		.command("delete <id>")
		.alias("rm")
		.description("Permanently delete a todo")
		.option("-f, --force", "Skip confirmation prompt")
		.action(async (id: string, opts) => {
			try {
				const store = new Store();
				const data = await store.load();
				const todo = findByPrefixOrThrow(data.todos, id, "todo");

				if (!opts.force) {
					const ok = await confirm(`Delete todo "${todo.title}"?`);
					if (!ok) {
						console.log("Cancelled");
						return;
					}
				}

				deleteTodo(data, todo.id);
				await store.saveWithBackup(data);
				console.log(formatSuccess(`Deleted "${todo.title}"`));
			} catch (err: any) {
				console.error(formatError(err.message));
				process.exit(1);
			}
		});
}
