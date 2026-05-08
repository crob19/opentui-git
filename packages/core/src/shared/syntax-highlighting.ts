import { createHighlighter, type Highlighter, type BundledLanguage } from "shiki";

/**
 * Represents a token with syntax highlighting information
 */
export interface HighlightedToken {
  text: string;
  color: string;
}

/**
 * Initialize Shiki highlighter with common languages
 * @returns Promise that resolves to a Highlighter instance
 */
export async function getHighlighter(): Promise<Highlighter> {
  return createHighlighter({
    themes: ["dark-plus"],
    langs: ["javascript", "typescript", "python", "go", "rust", "c", "cpp", "tsx", "jsx"],
  });
}

/**
 * Highlight code using Shiki syntax highlighter
 * @param code - The code to highlight
 * @param language - The programming language
 * @param highlighter - The Shiki highlighter instance
 * @returns Array of highlighted tokens with text and color
 */
export function highlightCode(code: string, language: string, highlighter: Highlighter): HighlightedToken[] {
  try {
    // Check if the language is loaded in the highlighter
    const loadedLanguages = highlighter.getLoadedLanguages();
    
    // If the language is not loaded, fall back to plain text
    if (!loadedLanguages.includes(language)) {
      return [{ text: code, color: "#CCCCCC" }];
    }

    // Use the language with proper type - it's validated above
    const tokens = highlighter.codeToTokensBase(code, {
      lang: language as BundledLanguage,
      theme: "dark-plus",
    });

    return tokens[0]?.map((token) => ({
      text: token.content,
      color: token.color || "#CCCCCC",
    })) || [{ text: code, color: "#CCCCCC" }];
  } catch (error) {
    // Log the error to aid in debugging highlighting issues, but still fall back gracefully.
    console.error("Failed to highlight code with shiki highlighter.", {
      language,
      error,
    });
    // Fallback if highlighting fails
    return [{ text: code, color: "#CCCCCC" }];
  }
}
