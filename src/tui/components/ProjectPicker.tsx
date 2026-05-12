import React from "react";
import { Box, Text } from "ink";
import type { Project } from "../../core/types.js";
import { colors, icons } from "../theme.js";

const MAX_VISIBLE_PROJECTS = 8;

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
	// Cursor layout: 0=inbox, 1..N=projects, N+1=create-new.
	const createIdx = projects.length + 1;
	const trimmedQuery = query.trim();

	// Scroll window over just the projects region so Inbox/Create stay visible.
	const visibleCount = Math.min(MAX_VISIBLE_PROJECTS, projects.length);
	let scrollOffset = 0;
	if (projects.length > MAX_VISIBLE_PROJECTS) {
		// Cursor of a project row is (1..N); translate to 0..N-1 for scrolling.
		const projCursor =
			cursor >= 1 && cursor <= projects.length ? cursor - 1 : 0;
		scrollOffset = Math.max(
			0,
			Math.min(
				projCursor - Math.floor(MAX_VISIBLE_PROJECTS / 2),
				projects.length - MAX_VISIBLE_PROJECTS,
			),
		);
	}
	const visible = projects.slice(scrollOffset, scrollOffset + visibleCount);
	const hiddenAbove = scrollOffset;
	const hiddenBelow = projects.length - (scrollOffset + visibleCount);

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
				<>
					{hiddenAbove > 0 && (
						<Box marginLeft={2}>
							<Text color={colors.fgMuted}>↑ {hiddenAbove} more</Text>
						</Box>
					)}
					{visible.map((p, i) => {
						const idx = scrollOffset + i + 1;
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
					})}
					{hiddenBelow > 0 && (
						<Box marginLeft={2}>
							<Text color={colors.fgMuted}>↓ {hiddenBelow} more</Text>
						</Box>
					)}
				</>
			)}

			<Box>
				<Text color={cursor === createIdx ? colors.accent : colors.fgDim}>
					{cursor === createIdx ? icons.cursor + " " : "  "}
				</Text>
				<Text
					color={cursor === createIdx ? colors.accent : colors.success}
					bold={cursor === createIdx}
				>
					+ {trimmedQuery ? `Create "${trimmedQuery}"` : "Create new project"}
				</Text>
				{cursor === createIdx && !trimmedQuery && (
					<Text color={colors.fgMuted} italic>
						  (type a name first)
					</Text>
				)}
			</Box>

			<Box marginTop={1}>
				<Text color={colors.fgDim}>
					↑/↓:navigate  Enter:select  Esc:cancel  Backspace:clear
				</Text>
			</Box>
		</Box>
	);
}
