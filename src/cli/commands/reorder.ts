import type { Command } from "commander";
import {
  Store,
  reorderTodo,
  reorderTodoRelative,
  findByPrefixOrThrow,
} from "../../core/index.js";
import { formatSuccess, formatError } from "../formatters.js";

export function registerReorderCommand(program: Command) {
  program
    .command("reorder <id>")
    .description("Reorder a todo within its list")
    .option("--pos <n>", "Move to position (0-indexed)")
    .option("--after <id>", "Place after another todo")
    .option("--before <id>", "Place before another todo")
    .option("--top", "Move to the top of the list")
    .option("--bottom", "Move to the bottom of the list")
    .action(async (id: string, opts) => {
      try {
        const store = new Store();
        const data = await store.load();

        let todo;

        if (opts.after) {
          todo = reorderTodoRelative(data, id, opts.after, "after");
        } else if (opts.before) {
          todo = reorderTodoRelative(data, id, opts.before, "before");
        } else if (opts.top) {
          todo = reorderTodo(data, id, 0);
        } else if (opts.bottom) {
          todo = reorderTodo(data, id, Infinity);
        } else if (opts.pos !== undefined) {
          const position = parseInt(opts.pos, 10);
          if (isNaN(position) || position < 0) {
            console.error(formatError("Position must be a non-negative number"));
            process.exit(1);
          }
          todo = reorderTodo(data, id, position);
        } else {
          console.error(
            formatError(
              "Specify --pos <n>, --after <id>, --before <id>, --top, or --bottom",
            ),
          );
          process.exit(1);
        }

        await store.saveWithBackup(data);
        console.log(
          formatSuccess(`Reordered "${todo.title}" to position ${todo.position}`),
        );
      } catch (err: any) {
        console.error(formatError(err.message));
        process.exit(1);
      }
    });
}
