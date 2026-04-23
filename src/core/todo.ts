import { format } from "date-fns";
import { generateId, findByPrefixOrThrow } from "./ids.js";
import { computeNextOccurrence } from "./recurrence.js";
import type {
  TadaStore,
  Todo,
  AddTodoInput,
  UpdateTodoInput,
  TodoFilter,
} from "./types.js";

function now(): string {
  return new Date().toISOString();
}

function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function nextPosition(store: TadaStore): number {
  if (store.todos.length === 0) return 0;
  return Math.max(...store.todos.map((t) => t.position ?? 0)) + 1;
}

export function addTodo(store: TadaStore, input: AddTodoInput): Todo {
  if (input.parentId) {
    const parent = store.todos.find((t) => t.id === input.parentId);
    if (!parent) throw new Error(`No todo found with ID "${input.parentId}"`);
    if (parent.parentId) throw new Error("Cannot create subtask of a subtask");
  }

  const todo: Todo = {
    id: generateId(),
    title: input.title,
    notes: input.notes ?? "",
    status: "open",
    priority: input.priority ?? "none",
    tags: input.tags ?? [],
    projectId: input.projectId ?? null,
    areaId: input.areaId ?? null,
    scheduledDate: input.scheduledDate ?? null,
    deadline: input.deadline ?? null,
    recurrence: input.recurrence ?? null,
    parentId: input.parentId ?? null,
    position: nextPosition(store),
    completedAt: null,
    createdAt: now(),
    updatedAt: now(),
  };
  store.todos.push(todo);
  return todo;
}

export function updateTodo(
  store: TadaStore,
  id: string,
  input: UpdateTodoInput,
): Todo {
  const todo = findByPrefixOrThrow(store.todos, id, "todo");
  if (input.title !== undefined) todo.title = input.title;
  if (input.notes !== undefined) todo.notes = input.notes;
  if (input.priority !== undefined) todo.priority = input.priority;
  if (input.tags !== undefined) todo.tags = input.tags;
  if (input.projectId !== undefined) todo.projectId = input.projectId;
  if (input.areaId !== undefined) todo.areaId = input.areaId;
  if (input.scheduledDate !== undefined) todo.scheduledDate = input.scheduledDate;
  if (input.deadline !== undefined) todo.deadline = input.deadline;
  if (input.recurrence !== undefined) todo.recurrence = input.recurrence;
  todo.updatedAt = now();
  return todo;
}

export function completeTodo(store: TadaStore, id: string): Todo {
  const todo = findByPrefixOrThrow(store.todos, id, "todo");

  const openSubs = store.todos.filter(
    (t) => t.parentId === todo.id && t.status === "open",
  );
  if (openSubs.length > 0) {
    throw new Error("Complete all subtasks first");
  }

  todo.status = "completed";
  todo.completedAt = now();
  todo.updatedAt = now();

  // Spawn next occurrence if recurring
  if (todo.recurrence) {
    const fromDate = todo.scheduledDate ?? today();
    const nextDate = computeNextOccurrence(todo.recurrence, fromDate);
    if (nextDate) {
      addTodo(store, {
        title: todo.title,
        notes: todo.notes,
        priority: todo.priority,
        tags: [...todo.tags],
        projectId: todo.projectId,
        areaId: todo.areaId,
        scheduledDate: nextDate,
        deadline: null,
        recurrence: todo.recurrence,
      });
    }
  }

  return todo;
}

export function reopenTodo(store: TadaStore, id: string): Todo {
  const todo = findByPrefixOrThrow(store.todos, id, "todo");
  if (todo.status === "open") {
    throw new Error("Todo is already open");
  }
  todo.status = "open";
  todo.completedAt = null;
  todo.updatedAt = now();
  return todo;
}

export function cancelTodo(store: TadaStore, id: string): Todo {
  const todo = findByPrefixOrThrow(store.todos, id, "todo");
  todo.status = "cancelled";
  todo.updatedAt = now();
  return todo;
}

export function deleteTodo(store: TadaStore, id: string): void {
  const idx = store.todos.findIndex((t) => t.id.startsWith(id));
  if (idx === -1) throw new Error(`No todo found with ID prefix "${id}"`);
  const todoId = store.todos[idx].id;
  // Cascade delete subtasks
  store.todos = store.todos.filter(
    (t) => t.id !== todoId && t.parentId !== todoId,
  );
}

export function getTodo(store: TadaStore, id: string): Todo | undefined {
  return store.todos.find((t) => t.id.startsWith(id));
}

export function getSubtasks(store: TadaStore, parentId: string): Todo[] {
  return store.todos.filter((t) => t.parentId === parentId);
}

export function getOpenSubtasks(store: TadaStore, parentId: string): Todo[] {
  return store.todos.filter(
    (t) => t.parentId === parentId && t.status === "open",
  );
}

export function reorderTodo(
  store: TadaStore,
  id: string,
  targetIndex: number,
): Todo {
  const todo = findByPrefixOrThrow(store.todos, id, "todo");

  // Determine context: siblings are todos sharing the same parent and project
  const siblings = store.todos
    .filter(
      (t) =>
        t.status === "open" &&
        t.parentId === todo.parentId &&
        t.projectId === todo.projectId &&
        t.id !== todo.id,
    )
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  // Clamp target index
  const clampedIndex = Math.max(0, Math.min(targetIndex, siblings.length));

  // Insert the todo at the target position
  siblings.splice(clampedIndex, 0, todo);

  // Reassign positions for all siblings
  for (let i = 0; i < siblings.length; i++) {
    siblings[i].position = i;
    siblings[i].updatedAt = now();
  }

  return todo;
}

export function reorderTodoRelative(
  store: TadaStore,
  id: string,
  anchorId: string,
  relation: "before" | "after",
): Todo {
  const todo = findByPrefixOrThrow(store.todos, id, "todo");
  const anchor = findByPrefixOrThrow(store.todos, anchorId, "todo");

  if (todo.id === anchor.id) {
    throw new Error("Cannot reorder a todo relative to itself");
  }

  // Determine siblings in same context as the anchor
  const siblings = store.todos
    .filter(
      (t) =>
        t.status === "open" &&
        t.parentId === anchor.parentId &&
        t.projectId === anchor.projectId &&
        t.id !== todo.id,
    )
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  const anchorIndex = siblings.findIndex((t) => t.id === anchor.id);
  if (anchorIndex === -1) {
    throw new Error("Anchor todo not found in context");
  }

  // Move todo to same context as anchor
  todo.parentId = anchor.parentId;
  todo.projectId = anchor.projectId;

  const insertIndex = relation === "before" ? anchorIndex : anchorIndex + 1;
  siblings.splice(insertIndex, 0, todo);

  // Reassign positions
  for (let i = 0; i < siblings.length; i++) {
    siblings[i].position = i;
    siblings[i].updatedAt = now();
  }

  return todo;
}

export function listTodos(store: TadaStore, filter?: TodoFilter): Todo[] {
  let todos = store.todos;

  // Exclude subtasks by default
  todos = todos.filter((t) => !t.parentId);

  if (filter?.status) {
    todos = todos.filter((t) => t.status === filter.status);
  } else {
    // Default: only open
    todos = todos.filter((t) => t.status === "open");
  }

  if (filter?.projectId) {
    todos = todos.filter((t) => t.projectId === filter.projectId);
  }

  if (filter?.areaId) {
    todos = todos.filter((t) => t.areaId === filter.areaId);
  }

  if (filter?.tag) {
    todos = todos.filter((t) => t.tags.includes(filter.tag!));
  }

  return todos;
}
