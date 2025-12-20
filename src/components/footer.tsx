/**
 * Footer component - Displays keyboard shortcuts and help text
 */
export function Footer() {
  const shortcuts = [
    { key: "↑/k", desc: "up" },
    { key: "↓/j", desc: "down" },
    { key: "space", desc: "stage/unstage" },
    { key: "a", desc: "stage all" },
    { key: "u", desc: "unstage all" },
    { key: "c", desc: "commit" },
    { key: "r", desc: "refresh" },
    { key: "^\\", desc: "console" },
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
