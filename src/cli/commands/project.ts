import type { Command } from "commander";
import {
	Store,
	createProject,
	getProject,
	completeProject,
	deleteProject,
	getProjectTodos,
	reorderProject,
	reorderProjectRelative,
	findByPrefixOrThrow,
} from "../../core/index.js";
import type { ProjectStatus } from "../../core/index.js";
import {
	formatProjectDetail,
	formatSuccess,
	formatError,
} from "../formatters.js";
import { renderMiniProjectView } from "../mini-view.js";
import { confirm } from "../prompts.js";

export function registerProjectCommand(program: Command) {
	const cmd = program.command("project").description("Manage projects");

	cmd
		.command("add <title>")
		.description("Create a new project")
		.option("-n, --notes <text>", "Add notes")
		.option("-a, --area <id>", "Assign to area")
		.option(
			"-t, --tag <tag>",
			"Add tag (repeatable)",
			(val: string, prev: string[]) => [...prev, val],
			[] as string[],
		)
		.option("-d, --deadline <date>", "Set deadline (YYYY-MM-DD)")
		.action(async (title: string, opts) => {
			try {
				const store = new Store();
				const data = await store.load();

				const project = createProject(data, {
					title,
					notes: opts.notes,
					areaId: opts.area,
					tags: opts.tag,
					deadline: opts.deadline,
				});

				await store.saveWithBackup(data);
				console.log(
					formatSuccess(
						`Created project "${project.title}" ${project.id.slice(0, 6)}`,
					),
				);
			} catch (err: any) {
				console.error(formatError(err.message));
				process.exit(1);
			}
		});

	cmd
		.command("list")
		.alias("ls")
		.description("List projects (active by default)")
		.option("-a, --all", "Show all projects including completed/on_hold")
		.option(
			"-s, --status <status>",
			"Filter by status: active | completed | on_hold",
		)
		.action(async (opts) => {
			try {
				const store = new Store();
				const data = await store.load();
				const filter = resolveStatusFilter(opts);
				console.log(renderMiniProjectView(data, filter));
			} catch (err: any) {
				console.error(formatError(err.message));
				process.exit(1);
			}
		});

	cmd
		.command("show <id>")
		.description("Show project details and todos")
		.action(async (id: string) => {
			try {
				const store = new Store();
				const data = await store.load();

				const project = getProject(data, id);
				if (!project)
					throw new Error(`No project found with ID prefix "${id}"`);

				const todos = getProjectTodos(data, project.id);
				console.log(formatProjectDetail(project, todos));
			} catch (err: any) {
				console.error(formatError(err.message));
				process.exit(1);
			}
		});

	cmd
		.command("done <id>")
		.description("Complete a project")
		.action(async (id: string) => {
			try {
				const store = new Store();
				const data = await store.load();
				const project = completeProject(data, id);
				await store.saveWithBackup(data);
				console.log(formatSuccess(`Completed project "${project.title}"`));
			} catch (err: any) {
				console.error(formatError(err.message));
				process.exit(1);
			}
		});

	cmd
		.command("delete <id>")
		.alias("rm")
		.description("Delete a project (todos move to inbox)")
		.option("-f, --force", "Skip confirmation prompt")
		.action(async (id: string, opts) => {
			try {
				const store = new Store();
				const data = await store.load();
				const project = findByPrefixOrThrow(data.projects, id, "project");
				const todoCount = getProjectTodos(data, project.id).length;

				if (!opts.force) {
					const suffix =
						todoCount > 0
							? ` (${todoCount} todo${todoCount === 1 ? "" : "s"} will move to inbox)`
							: "";
					const ok = await confirm(
						`Delete project "${project.title}"?${suffix}`,
					);
					if (!ok) {
						console.log("Cancelled");
						return;
					}
				}

				deleteProject(data, project.id);
				await store.saveWithBackup(data);
				console.log(
					formatSuccess(
						todoCount > 0
							? `Deleted "${project.title}" (${todoCount} todo${todoCount === 1 ? "" : "s"} moved to inbox)`
							: `Deleted "${project.title}"`,
					),
				);
			} catch (err: any) {
				console.error(formatError(err.message));
				process.exit(1);
			}
		});

	cmd
		.command("reorder <id>")
		.description("Reorder a project within its area")
		.option("--pos <n>", "Move to position (0-indexed)")
		.option("--after <id>", "Place after another project")
		.option("--before <id>", "Place before another project")
		.option("--top", "Move to the top of the list")
		.option("--bottom", "Move to the bottom of the list")
		.action(async (id: string, opts) => {
			try {
				const store = new Store();
				const data = await store.load();

				let project;
				if (opts.after) {
					project = reorderProjectRelative(data, id, opts.after, "after");
				} else if (opts.before) {
					project = reorderProjectRelative(data, id, opts.before, "before");
				} else if (opts.top) {
					project = reorderProject(data, id, 0);
				} else if (opts.bottom) {
					project = reorderProject(data, id, Infinity);
				} else if (opts.pos !== undefined) {
					const position = parseInt(opts.pos, 10);
					if (isNaN(position) || position < 0) {
						console.error(
							formatError("Position must be a non-negative number"),
						);
						process.exit(1);
					}
					project = reorderProject(data, id, position);
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
					formatSuccess(
						`Reordered "${project.title}" to position ${project.position}`,
					),
				);
			} catch (err: any) {
				console.error(formatError(err.message));
				process.exit(1);
			}
		});
}

function resolveStatusFilter(opts: {
	all?: boolean;
	status?: string;
}): ProjectStatus | "all" | undefined {
	if (opts.all) return "all";
	if (opts.status) {
		const valid = ["active", "completed", "on_hold"] as const;
		if (!valid.includes(opts.status as ProjectStatus)) {
			throw new Error(
				`Invalid --status "${opts.status}". Expected: active, completed, or on_hold`,
			);
		}
		return opts.status as ProjectStatus;
	}
	return undefined;
}
