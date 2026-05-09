import { addTodo, reorderTodo, reorderTodoRelative } from "../../core/todo.js";
import {
	createProject,
	listProjects,
	reorderProject,
	reorderProjectRelative,
} from "../../core/project.js";
import { emptyStore, makeTodo } from "./helpers.js";

describe("reorderTodo", () => {
	it("moves a todo to a specific position", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });

		// Move C to position 0 (top)
		reorderTodo(store, c.id, 0);

		expect(c.position).toBe(0);
		expect(a.position).toBe(1);
		expect(b.position).toBe(2);
	});

	it("moves a todo to the end", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });

		// Move A to end
		reorderTodo(store, a.id, Infinity);

		expect(b.position).toBe(0);
		expect(c.position).toBe(1);
		expect(a.position).toBe(2);
	});

	it("moves a todo to the middle", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });
		const d = addTodo(store, { title: "D" });

		// Move D to position 1
		reorderTodo(store, d.id, 1);

		expect(a.position).toBe(0);
		expect(d.position).toBe(1);
		expect(b.position).toBe(2);
		expect(c.position).toBe(3);
	});

	it("clamps negative position to 0", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });

		reorderTodo(store, b.id, -5);

		expect(b.position).toBe(0);
		expect(a.position).toBe(1);
	});

	it("only reorders within same context (project)", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A", projectId: "proj1" });
		const b = addTodo(store, { title: "B", projectId: "proj1" });
		const c = addTodo(store, { title: "C", projectId: "proj2" });

		// Move B to top within proj1
		reorderTodo(store, b.id, 0);

		expect(b.position).toBe(0);
		expect(a.position).toBe(1);
		// C (different project) should be unaffected
		expect(c.position).toBe(2);
	});

	it("only reorders within same parent (subtasks)", () => {
		const store = emptyStore();
		const parent = addTodo(store, { title: "Parent" });
		const sub1 = addTodo(store, { title: "Sub 1", parentId: parent.id });
		const sub2 = addTodo(store, { title: "Sub 2", parentId: parent.id });
		const sub3 = addTodo(store, { title: "Sub 3", parentId: parent.id });

		// Move sub3 to top of subtasks
		reorderTodo(store, sub3.id, 0);

		expect(sub3.position).toBe(0);
		expect(sub1.position).toBe(1);
		expect(sub2.position).toBe(2);
		// Parent should be unaffected
		expect(parent.position).toBe(0);
	});

	it("works with prefix ID", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });

		const prefix = b.id.slice(0, 4);
		reorderTodo(store, prefix, 0);

		expect(b.position).toBe(0);
		expect(a.position).toBe(1);
	});

	it("no-op when moving to same position", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });

		reorderTodo(store, a.id, 0);

		expect(a.position).toBe(0);
		expect(b.position).toBe(1);
	});

	it("ignores completed todos when reordering", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });
		b.status = "completed";

		// Move C to top among open todos (A and C)
		reorderTodo(store, c.id, 0);

		expect(c.position).toBe(0);
		expect(a.position).toBe(1);
		// Completed todo B is not part of reordering
	});
});

describe("reorderTodoRelative", () => {
	it("places a todo after another", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });

		reorderTodoRelative(store, c.id, a.id, "after");

		expect(a.position).toBe(0);
		expect(c.position).toBe(1);
		expect(b.position).toBe(2);
	});

	it("places a todo before another", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });

		reorderTodoRelative(store, c.id, b.id, "before");

		expect(a.position).toBe(0);
		expect(c.position).toBe(1);
		expect(b.position).toBe(2);
	});

	it("places before the first item", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });

		reorderTodoRelative(store, c.id, a.id, "before");

		expect(c.position).toBe(0);
		expect(a.position).toBe(1);
		expect(b.position).toBe(2);
	});

	it("places after the last item", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });

		reorderTodoRelative(store, a.id, c.id, "after");

		expect(b.position).toBe(0);
		expect(c.position).toBe(1);
		expect(a.position).toBe(2);
	});

	it("throws when reordering relative to itself", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });

		expect(() => reorderTodoRelative(store, a.id, a.id, "after")).toThrow(
			"Cannot reorder a todo relative to itself",
		);
	});

	it("moves todo into anchor's project context", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A", projectId: "proj1" });
		const b = addTodo(store, { title: "B", projectId: "proj1" });
		const c = addTodo(store, { title: "C" }); // inbox

		reorderTodoRelative(store, c.id, a.id, "after");

		expect(c.projectId).toBe("proj1");
		expect(a.position).toBe(0);
		expect(c.position).toBe(1);
		expect(b.position).toBe(2);
	});

	it("works with prefix IDs", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });

		reorderTodoRelative(store, c.id.slice(0, 4), a.id.slice(0, 4), "after");

		expect(a.position).toBe(0);
		expect(c.position).toBe(1);
		expect(b.position).toBe(2);
	});
});

describe("addTodo assigns sequential positions", () => {
	it("assigns incrementing positions", () => {
		const store = emptyStore();
		const a = addTodo(store, { title: "A" });
		const b = addTodo(store, { title: "B" });
		const c = addTodo(store, { title: "C" });

		expect(a.position).toBe(0);
		expect(b.position).toBe(1);
		expect(c.position).toBe(2);
	});
});

describe("reorderProject", () => {
	it("moves a project to a specific position", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		const b = createProject(store, { title: "B" });
		const c = createProject(store, { title: "C" });

		reorderProject(store, c.id, 0);

		expect(c.position).toBe(0);
		expect(a.position).toBe(1);
		expect(b.position).toBe(2);
	});

	it("moves a project to the end with Infinity", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		const b = createProject(store, { title: "B" });
		const c = createProject(store, { title: "C" });

		reorderProject(store, a.id, Infinity);

		expect(b.position).toBe(0);
		expect(c.position).toBe(1);
		expect(a.position).toBe(2);
	});

	it("clamps target index to the sibling range", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		const b = createProject(store, { title: "B" });

		reorderProject(store, a.id, -5);
		expect(a.position).toBe(0);
		expect(b.position).toBe(1);

		reorderProject(store, a.id, 99);
		expect(b.position).toBe(0);
		expect(a.position).toBe(1);
	});

	it("scopes siblings to same area", () => {
		const store = emptyStore();
		const a1 = createProject(store, { title: "A1", areaId: "area1" });
		const a2 = createProject(store, { title: "A2", areaId: "area1" });
		const b1 = createProject(store, { title: "B1", areaId: "area2" });

		reorderProject(store, a2.id, 0);

		expect(a2.position).toBe(0);
		expect(a1.position).toBe(1);
		expect(b1.position).toBe(0);
	});

	it("keeps completed projects in a separate order space", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		const b = createProject(store, { title: "B" });
		const c = createProject(store, { title: "C" });
		b.status = "completed";

		reorderProject(store, c.id, 0);

		expect(c.position).toBe(0);
		expect(a.position).toBe(1);
		expect(b.position).toBe(1); // untouched by active-scope reorder
	});
});

describe("reorderProjectRelative", () => {
	it("places a project before an anchor", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		const b = createProject(store, { title: "B" });
		const c = createProject(store, { title: "C" });

		reorderProjectRelative(store, c.id, a.id, "before");

		expect(c.position).toBe(0);
		expect(a.position).toBe(1);
		expect(b.position).toBe(2);
	});

	it("places a project after an anchor", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		const b = createProject(store, { title: "B" });
		const c = createProject(store, { title: "C" });

		reorderProjectRelative(store, a.id, b.id, "after");

		expect(b.position).toBe(0);
		expect(a.position).toBe(1);
		expect(c.position).toBe(2);
	});

	it("moves project across areas to the anchor's area", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A", areaId: "area1" });
		const b = createProject(store, { title: "B", areaId: "area2" });
		createProject(store, { title: "C", areaId: "area2" });

		reorderProjectRelative(store, a.id, b.id, "after");

		expect(a.areaId).toBe("area2");
		expect(a.position).toBe(1);
	});

	it("rejects reordering a project relative to itself", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		expect(() => reorderProjectRelative(store, a.id, a.id, "after")).toThrow();
	});

	it("rejects reordering across different statuses", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		const b = createProject(store, { title: "B" });
		b.status = "completed";

		expect(() => reorderProjectRelative(store, a.id, b.id, "after")).toThrow();
	});
});

describe("createProject assigns sequential positions", () => {
	it("assigns incrementing positions within an area", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		const b = createProject(store, { title: "B" });
		const c = createProject(store, { title: "C" });

		expect(a.position).toBe(0);
		expect(b.position).toBe(1);
		expect(c.position).toBe(2);
	});

	it("restarts position counter per area", () => {
		const store = emptyStore();
		const a1 = createProject(store, { title: "A1", areaId: "area1" });
		const b1 = createProject(store, { title: "B1", areaId: "area2" });
		const a2 = createProject(store, { title: "A2", areaId: "area1" });

		expect(a1.position).toBe(0);
		expect(a2.position).toBe(1);
		expect(b1.position).toBe(0);
	});
});

describe("listProjects sorting", () => {
	it("returns projects sorted by position", () => {
		const store = emptyStore();
		const a = createProject(store, { title: "A" });
		const b = createProject(store, { title: "B" });
		const c = createProject(store, { title: "C" });

		reorderProject(store, c.id, 0);

		const sorted = listProjects(store);
		expect(sorted.map((p) => p.id)).toEqual([c.id, a.id, b.id]);
	});
});
