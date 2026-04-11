import chalk from "chalk";
import type { Todo, Project, TadaStore } from "../core/types.js";
import { getProjectTodos } from "../core/views.js";
import { formatTodoLine, formatProjectLine } from "./formatters.js";

const accent = chalk.hex("#5B8DEF");
const dim = chalk.dim;
const border = chalk.hex("#374151");

function renderHeader(title: string): string {
  const padded = `  ▸ ${title}`;
  const width = 28;
  const inner = padded.padEnd(width - 2);
  return [
    "",
    border("╭" + "─".repeat(width - 2) + "╮"),
    border("│") + accent.bold(inner) + border("│"),
    border("╰" + "─".repeat(width - 2) + "╯"),
  ].join("\n");
}

function renderTodoSummary(todos: Todo[]): string {
  const total = todos.length;
  if (total === 0) return "";

  const today = new Date().toISOString().slice(0, 10);
  const overdue = todos.filter((t) => t.deadline && t.deadline < today).length;
  const high = todos.filter((t) => t.priority === "high").length;

  const parts = [dim(`${total} task${total !== 1 ? "s" : ""}`)];
  if (overdue > 0) parts.push(chalk.red(`${overdue} overdue`));
  if (high > 0) parts.push(chalk.hex("#EF4444")(`${high} high priority`));

  return `  ${parts.join(dim("  ·  "))}`;
}

function renderProjectSummary(projects: Project[], store: TadaStore): string {
  const total = projects.length;
  if (total === 0) return "";

  const totalTodos = projects.reduce((sum, p) => sum + getProjectTodos(store, p.id).length, 0);
  const parts = [
    dim(`${total} project${total !== 1 ? "s" : ""}`),
    dim(`${totalTodos} open todo${totalTodos !== 1 ? "s" : ""}`),
  ];

  return `  ${parts.join(dim("  ·  "))}`;
}

export function renderMiniView(title: string, todos: Todo[]): string {
  const lines: string[] = [];

  lines.push(renderHeader(title));
  lines.push("");

  if (todos.length === 0) {
    lines.push(`  ${dim("No items")}`);
  } else {
    for (const todo of todos) {
      lines.push(`  ${formatTodoLine(todo)}`);
    }
  }

  lines.push("");
  lines.push(renderTodoSummary(todos));
  lines.push("");

  return lines.join("\n");
}

export function renderMiniProjectView(store: TadaStore): string {
  const lines: string[] = [];
  const projects = store.projects.filter((p) => p.status === "active");

  lines.push(renderHeader("PROJECTS"));
  lines.push("");

  if (projects.length === 0) {
    lines.push(`  ${dim("No projects")}`);
  } else {
    for (const project of projects) {
      const todoCount = getProjectTodos(store, project.id).length;
      lines.push(`  ${formatProjectLine(project, todoCount)}`);
    }
  }

  lines.push("");
  lines.push(renderProjectSummary(projects, store));
  lines.push("");

  return lines.join("\n");
}
