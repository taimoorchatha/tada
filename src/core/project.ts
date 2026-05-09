import { generateId, findByPrefixOrThrow } from "./ids.js";
import type {
	TadaStore,
	Project,
	CreateProjectInput,
	UpdateProjectInput,
	ProjectFilter,
} from "./types.js";

function now(): string {
	return new Date().toISOString();
}

export function createProject(
	store: TadaStore,
	input: CreateProjectInput,
): Project {
	const areaId = input.areaId ?? null;
	const siblingMaxPos = store.projects
		.filter((p) => p.status === "active" && p.areaId === areaId)
		.reduce((max, p) => Math.max(max, p.position ?? -1), -1);

	const project: Project = {
		id: generateId(),
		title: input.title,
		notes: input.notes ?? "",
		areaId,
		status: "active",
		tags: input.tags ?? [],
		deadline: input.deadline ?? null,
		position: siblingMaxPos + 1,
		createdAt: now(),
		updatedAt: now(),
	};
	store.projects.push(project);
	return project;
}

export function updateProject(
	store: TadaStore,
	id: string,
	input: UpdateProjectInput,
): Project {
	const project = findByPrefixOrThrow(store.projects, id, "project");
	if (input.title !== undefined) project.title = input.title;
	if (input.notes !== undefined) project.notes = input.notes;
	if (input.areaId !== undefined) project.areaId = input.areaId;
	if (input.status !== undefined) project.status = input.status;
	if (input.tags !== undefined) project.tags = input.tags;
	if (input.deadline !== undefined) project.deadline = input.deadline;
	project.updatedAt = now();
	return project;
}

export function completeProject(store: TadaStore, id: string): Project {
	const project = findByPrefixOrThrow(store.projects, id, "project");
	project.status = "completed";
	project.updatedAt = now();
	return project;
}

export function deleteProject(store: TadaStore, id: string): void {
	const project = findByPrefixOrThrow(store.projects, id, "project");
	// Orphan todos to inbox
	store.todos
		.filter((t) => t.projectId === project.id)
		.forEach((t) => {
			t.projectId = null;
		});
	const idx = store.projects.indexOf(project);
	store.projects.splice(idx, 1);
}

export function getProject(store: TadaStore, id: string): Project | undefined {
	return store.projects.find((p) => p.id.startsWith(id));
}

export function listProjects(
	store: TadaStore,
	filter?: ProjectFilter,
): Project[] {
	let projects = store.projects;

	if (filter?.status) {
		projects = projects.filter((p) => p.status === filter.status);
	} else {
		projects = projects.filter((p) => p.status === "active");
	}

	if (filter?.areaId) {
		projects = projects.filter((p) => p.areaId === filter.areaId);
	}

	return [...projects].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

// Siblings for reorder = same area and same status (active projects
// reorder among themselves; completed among themselves).
function projectSiblings(
	store: TadaStore,
	project: Project,
	excludeId?: string,
): Project[] {
	return store.projects
		.filter(
			(p) =>
				p.status === project.status &&
				p.areaId === project.areaId &&
				p.id !== excludeId,
		)
		.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

function reassignPositions(projects: Project[]): void {
	const stamp = now();
	for (let i = 0; i < projects.length; i++) {
		projects[i].position = i;
		projects[i].updatedAt = stamp;
	}
}

export function reorderProject(
	store: TadaStore,
	id: string,
	targetIndex: number,
): Project {
	const project = findByPrefixOrThrow(store.projects, id, "project");
	const siblings = projectSiblings(store, project, project.id);
	const clamped = Math.max(0, Math.min(targetIndex, siblings.length));
	siblings.splice(clamped, 0, project);
	reassignPositions(siblings);
	return project;
}

export function reorderProjectRelative(
	store: TadaStore,
	id: string,
	anchorId: string,
	relation: "before" | "after",
): Project {
	const project = findByPrefixOrThrow(store.projects, id, "project");
	const anchor = findByPrefixOrThrow(store.projects, anchorId, "project");

	if (project.id === anchor.id) {
		throw new Error("Cannot reorder a project relative to itself");
	}
	if (project.status !== anchor.status) {
		throw new Error(
			"Cannot reorder across different project statuses (active/completed/on_hold)",
		);
	}

	// Move project into anchor's area if different.
	project.areaId = anchor.areaId;

	const siblings = projectSiblings(store, anchor, project.id);
	const anchorIndex = siblings.findIndex((p) => p.id === anchor.id);
	if (anchorIndex === -1) {
		throw new Error("Anchor project not found in context");
	}

	const insertIndex = relation === "before" ? anchorIndex : anchorIndex + 1;
	siblings.splice(insertIndex, 0, project);
	reassignPositions(siblings);
	return project;
}

/**
 * Convert a top-level todo into a new project. The todo's subtasks become
 * top-level todos inside the new project. The original todo is removed.
 *
 * Throws if the todo is a subtask, is not open, or does not exist.
 */
export function convertTodoToProject(
	store: TadaStore,
	todoId: string,
): Project {
	const todo = findByPrefixOrThrow(store.todos, todoId, "todo");

	if (todo.parentId) {
		throw new Error(
			"Cannot convert a subtask to a project; convert its parent todo instead",
		);
	}
	if (todo.status !== "open") {
		throw new Error("Only open todos can be converted into projects");
	}

	const project = createProject(store, {
		title: todo.title,
		notes: todo.notes,
		areaId: todo.areaId,
		tags: todo.tags,
		deadline: todo.deadline,
	});

	// Migrate subtasks as top-level todos inside the new project, preserving
	// their relative order via position.
	const subtasks = store.todos
		.filter((t) => t.parentId === todo.id)
		.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

	const stamp = now();
	subtasks.forEach((sub, idx) => {
		sub.parentId = null;
		sub.projectId = project.id;
		sub.areaId = todo.areaId;
		sub.position = idx;
		sub.updatedAt = stamp;
	});

	// Remove the original todo
	const todoIdx = store.todos.indexOf(todo);
	if (todoIdx >= 0) store.todos.splice(todoIdx, 1);

	return project;
}
