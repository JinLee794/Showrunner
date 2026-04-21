# Enhanced Code Terminal with Captions Scene

A new scene type `code-terminal-with-captions` that displays code terminal output alongside contextual captions. Perfect for step-by-step tutorials, code walkthroughs, and multi-step technical explanations.

## Features

- **Split Layout**: Terminal on 2/3 of screen, captions on 1/3
- **Flexible Caption Position**: Place captions on `left`, `right`, `above`, or `below` the terminal
- **Multi-Step Support**: Each step reveals new terminal lines and shows corresponding caption text
- **Dynamic Timing**: Steps progress automatically based on scene duration
- **Rich Caption Formatting**: Support for **bold**, *italics*, and `code` highlighting in captions

## Schema

```typescript
{
  "type": "code-terminal-with-captions",
  "duration": number,          // Total scene duration (required)
  "data": {
    "title": string,           // Optional scene title
    "shell": string,           // Shell name (e.g., "zsh", "bash")
    "captionPosition": "left" | "right" | "above" | "below",  // Default: "right"
    "steps": [
      {
        "lines": [             // Terminal lines for this step
          {
            "kind": "prompt" | "output" | "comment" | "success" | "error" | "highlight" | "blank",
            "text": string     // Line content (optional for blank lines)
          }
        ],
        "caption": string,     // Context text (supports HTML/formatting)
        "duration": number     // Optional: override step duration
      }
    ]
  }
}
```

## Line Types

| Type | Color | Usage |
|------|-------|-------|
| `prompt` | Blue | Shell prompts (❯) |
| `output` | Gray | Command output |
| `comment` | Gray italic | Comments (#) |
| `success` | Green | Success messages |
| `error` | Red | Error messages |
| `highlight` | Light blue | Highlighted/important info |
| `blank` | - | Empty line for spacing |

## Example: React Hook Tutorial

```json
{
  "type": "code-terminal-with-captions",
  "duration": 12,
  "data": {
    "title": "Creating a Custom Hook",
    "shell": "zsh",
    "captionPosition": "right",
    "steps": [
      {
        "lines": [
          { "kind": "prompt", "text": "touch useCounter.ts" },
          { "kind": "output", "text": "" },
          { "kind": "prompt", "text": "cat > useCounter.ts << 'EOF'" }
        ],
        "caption": "First, we create a new file and start writing our custom hook."
      },
      {
        "lines": [
          { "kind": "output", "text": "import { useState } from 'react';" },
          { "kind": "blank", "text": "" },
          { "kind": "output", "text": "export function useCounter(initialValue = 0) {" }
        ],
        "caption": "Import <code>useState</code> from React and define the hook function."
      },
      {
        "lines": [
          { "kind": "output", "text": "  const [count, setCount] = useState(initialValue);" },
          { "kind": "blank", "text": "" },
          { "kind": "output", "text": "  const increment = () => setCount(c => c + 1);" }
        ],
        "caption": "Create <strong>count</strong> state and an <code>increment</code> handler."
      }
    ]
  }
}
```

## Caption Formatting

Captions support inline HTML:

- `<strong>bold text</strong>` — Bold emphasis (blue color)
- `<em>italic text</em>` — Italic emphasis (purple color)
- `<code>monospace</code>` — Inline code blocks (green background)

## Layout Variants

### Right (default)
```
┌─────────────────────┬─────────┐
│                     │ Caption │
│   Terminal (2/3)    │  (1/3)  │
│                     │         │
└─────────────────────┴─────────┘
```

### Left
```
┌─────────┬─────────────────────┐
│ Caption │                     │
│  (1/3)  │   Terminal (2/3)    │
│         │                     │
└─────────┴─────────────────────┘
```

### Below
```
┌─────────────────────────────┐
│                             │
│   Terminal (2/3)            │
│                             │
├─────────────────────────────┤
│     Caption (1/3)           │
└─────────────────────────────┘
```

### Above
```
┌─────────────────────────────┐
│     Caption (1/3)           │
├─────────────────────────────┤
│                             │
│   Terminal (2/3)            │
│                             │
└─────────────────────────────┘
```

## Animation Behavior

1. **Entrance**: Terminal window scales in with spring animation
2. **Step Progression**: Each step reveals terminal lines with staggered timing
3. **Caption Transitions**: Captions cross-fade between steps
4. **Cursor Blink**: Terminal cursor blinks to indicate active input
5. **Exit**: Scene holds final state with cursor blinking

## Timing

- Scene duration is divided equally among all steps
- Each step allocates 60% time for terminal reveal, 40% for caption display
- Steps automatically progress—no manual timing needed

## Tips

- Keep steps concise (2-4 lines of code per step)
- Use rich formatting in captions to guide viewer attention
- Place captions on the side that doesn't compete visually with code
- Use the `success` and `error` line types to show execution outcomes
- Add `blank` lines between logical groups of code

## See Also

- [code-terminal](code-terminal.md) — Standard code terminal without captions
- [animation-prompt-guide.md](animation-prompt-guide.md) — Animation customization
- [fixtures/code-terminal-with-captions-demo.json](../fixtures/code-terminal-with-captions-demo.json) — Full working example
