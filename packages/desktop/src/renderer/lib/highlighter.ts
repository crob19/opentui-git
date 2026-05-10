import {
  createHighlighter,
  type Highlighter,
  type BundledLanguage,
} from "shiki";

const THEME = "dracula";

const PRELOADED_LANGS: BundledLanguage[] = [
  "tsx",
  "typescript",
  "jsx",
  "javascript",
  "json",
  "css",
  "html",
  "markdown",
  "shellscript",
  "yaml",
  "toml",
  "python",
  "go",
  "rust",
  "graphql",
];

const EXT_TO_LANG: Record<string, BundledLanguage> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  css: "css",
  scss: "css",
  html: "html",
  md: "markdown",
  mdx: "markdown",
  sh: "shellscript",
  bash: "shellscript",
  zsh: "shellscript",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  py: "python",
  go: "go",
  rs: "rust",
  graphql: "graphql",
  gql: "graphql",
};

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [THEME],
      langs: PRELOADED_LANGS,
    });
  }
  return highlighterPromise;
}

function langForPath(path: string): BundledLanguage | "text" {
  const ext = path.toLowerCase().split(".").pop() ?? "";
  return EXT_TO_LANG[ext] ?? "text";
}

export async function highlight(path: string, code: string): Promise<string> {
  const lang = langForPath(path);
  const hl = await getHighlighter();
  if (lang === "text") {
    return hl.codeToHtml(code, { lang: "text", theme: THEME });
  }
  if (!hl.getLoadedLanguages().includes(lang)) {
    try {
      await hl.loadLanguage(lang);
    } catch {
      return hl.codeToHtml(code, { lang: "text", theme: THEME });
    }
  }
  return hl.codeToHtml(code, { lang, theme: THEME });
}
