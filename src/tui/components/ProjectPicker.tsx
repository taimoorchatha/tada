import React from "react";
import { Box, Text } from "ink";
import type { Project } from "../../core/types.js";
import { colors, icons } from "../theme.js";

interface ProjectPickerProps {
	projects: Project[];
	cursor: number;
	todoTitle: string;
	query: string;
}

export function ProjectPicker({
	projects,
	cursor,
	todoTitle,
	query,
}: ProjectPickerProps) {
	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor={colors.accent}
			paddingX={1}
		>
			<Box marginBottom={1}>
				<Text color={colors.fgDim}>Move </Text>
				<Text bold>"{todoTitle}"</Text>
				<Text color={colors.fgDim}> to project:</Text>
			</Box>
			<Box marginBottom={1}>
				<Text color={colors.accent}>/ </Text>
				<Text color={query ? colors.fg : colors.fgDim}>
					{query || "type to filter"}
				</Text>
			</Box>
			<Box>
				<Text color={cursor === 0 ? colors.accent : colors.fgDim}>
					{cursor === 0 ? icons.cursor + " " : "  "}
				</Text>
				<Text color={cursor === 0 ? colors.accent : colors.fgDim} italic>
					(none — move to inbox)
				</Text>
			</Box>
			{projects.length === 0 ? (
				<Box marginLeft={2}>
					<Text color={colors.fgDim} italic>
						No matching projects
					</Text>
				</Box>
			) : (
				projects.map((p, i) => {
					const idx = i + 1;
					const isSelected = cursor === idx;
					return (
						<Box key={p.id}>
							<Text color={isSelected ? colors.accent : colors.fgDim}>
								{isSelected ? icons.cursor + " " : "  "}
							</Text>
							<Text
								bold={isSelected}
								color={isSelected ? colors.accent : colors.fg}
							>
								{p.title}
							</Text>
						</Box>
					);
				})
			)}
			<Box marginTop={1}>
				<Text color={colors.fgDim}>
					↑/↓:navigate Enter:select Esc:cancel Backspace:clear
				</Text>
			</Box>
		</Box>
	);
}
