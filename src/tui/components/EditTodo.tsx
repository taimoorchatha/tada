import React, { useState } from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { colors } from "../theme.js";
import type { ParsedInput } from "./QuickAdd.js";
import { parseQuickAdd } from "./QuickAdd.js";
import type { Todo } from "../../core/types.js";

interface EditTodoProps {
  todo: Todo;
  onSubmit: (parsed: ParsedInput) => void;
  onCancel: () => void;
}

function serializeTodo(todo: Todo): string {
  const parts: string[] = [todo.title];
  for (const tag of todo.tags) {
    parts.push(`#${tag}`);
  }
  if (todo.priority === "high") parts.push("!high");
  else if (todo.priority === "medium") parts.push("!medium");
  else if (todo.priority === "low") parts.push("!low");
  if (todo.scheduledDate) parts.push(`@${todo.scheduledDate}`);
  if (todo.deadline) parts.push(`due:${todo.deadline}`);
  return parts.join(" ");
}

export function EditTodo({ todo, onSubmit, onCancel }: EditTodoProps) {
  const [value, setValue] = useState(serializeTodo(todo));

  return (
    <Box borderStyle="single" borderColor={colors.warning} paddingX={1}>
      <Text color={colors.warning}>~ </Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={(v) => {
          const trimmed = v.trim();
          if (!trimmed) {
            onCancel();
            return;
          }
          onSubmit(parseQuickAdd(trimmed));
        }}
      />
    </Box>
  );
}
