import { marked } from "marked";

export function markdown(content: string) {
  return marked.parse(content.replace(/</g, "&lt;"), {
    async: false,
    gfm: true,
    breaks: true,
  }) as string;
}
