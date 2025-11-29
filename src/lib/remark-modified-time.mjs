import { execSync } from "node:child_process";

export function remarkModifiedTime() {
  return function (_tree, file) {
    const filepath = file.history[0];
    try {
      // Execute the Git command to get the latest commit timestamp for the file.
      const result = execSync(`git log -1 --pretty="format:%cI" "${filepath}"`);

      // Set the 'modDatetime' property in the frontmatter.
      // This is adapted for your project's existing 'modDatetime' field.
      file.data.astro.frontmatter.modDatetime = result.toString().trim();
    } catch (e) {
      // Log an error if the Git command fails (e.g., in a CI environment with shallow clones)
      // but don't fail the build.

      console.warn(
        `[remark-modified-time] Failed to get Git modification time for ${filepath}: ${e.message}`
      );
    }
  };
}
