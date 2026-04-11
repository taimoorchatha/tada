import React from "react";
import { Box, Text } from "ink";
import { colors } from "../theme.js";

interface SchedulePickerProps {
  todoTitle: string;
  currentDate: string | null;
}

export function SchedulePicker({ todoTitle, currentDate }: SchedulePickerProps) {
  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={colors.accent}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text color={colors.accent}>Schedule </Text>
        <Text color={colors.fg} bold>{todoTitle}</Text>
      </Box>
      <Box>
        <Text color={colors.fgDim}>Current: </Text>
        <Text color={currentDate ? colors.fg : colors.fgDim}>
          {currentDate ?? "none"}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text color={colors.fgDim}>
          t:today  T:tomorrow  n:next week  +/-:day  {"]/["}:week  ⌫:clear all  Esc:cancel
        </Text>
      </Box>
    </Box>
  );
}
