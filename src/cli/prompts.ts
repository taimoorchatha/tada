import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

/**
 * Prompt the user with a yes/no question. Returns true if the answer
 * starts with "y" (case-insensitive). Defaults to `false` on Enter.
 */
export async function confirm(message: string): Promise<boolean> {
  if (!stdin.isTTY) {
    // Non-interactive context: never auto-confirm destructive actions.
    return false;
  }
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(`${message} (y/N) `);
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}
