/**
 * Footer component - Displays keyboard shortcuts and help text
 */
export function Footer() {
  const shortcuts = [
    { key: "↑/k", desc: "up" },
    { key: "↓/j", desc: "down" },
    { key: "space", desc: "stage" },
    { key: "a", desc: "all" },
    { key: "u", desc: "unstage" },
    { key: "c", desc: "commit" },
    { key: "n", desc: "new branch" },
    { key: "b", desc: "branches" },
    { key: "p", desc: "pull" },
    { key: "P", desc: "push" },
    { key: "q", desc: "quit" },
  ];

  return (
    <box
      borderStyle="single"
      borderColor="#444444"
      width="100%"
      height={3}
      flexDirection="row"
      alignItems="center"
      paddingLeft={1}
      paddingRight={1}
      gap={2}
    >
      {shortcuts.map((shortcut, idx) => (
        <>
          <text fg="#00AAFF">{shortcut.key}</text>
          <text fg="#AAAAAA">{shortcut.desc}</text>
          {idx < shortcuts.length - 1 && <text fg="#444444">│</text>}
        </>
      ))}
    </box>
  );
}
