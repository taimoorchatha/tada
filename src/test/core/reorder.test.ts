import {
  addTodo,
  reorderTodo,
  reorderTodoRelative,
} from "../../core/todo.js";
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
