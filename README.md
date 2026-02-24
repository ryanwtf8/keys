# MegaCloud Keys

A TypeScript-based deobfuscator for extracting encryption keys from MegaCloud and CloudVidz player scripts.

## Features

- Full TypeScript implementation with type safety
- Automated key extraction from player scripts
- Multi-stage AST-based deobfuscation
- LLM-powered final key extraction using Google Gemini

## How It Works

### Deobfuscation Pipeline

The project uses a multi-stage deobfuscation process:

1. **Pass 1: Normalize & Unflatten**
   - Simplifies expressions and literals
   - Unflattens control flow structures

2. **Pass 2: Inline Data**
   - Inlines array builders
   - Resolves wrapper functions

3. **Pass 3: Solve Arrays & State Machines**
   - Decrypts string arrays
   - Resolves state machine logic

4. **Pass 4: Final Inlining**
   - Inlines remaining string arrays
   - Produces clean, readable code

### Key Extraction Process

1. Fetches obfuscated player scripts from MegaCloud/CloudVidz
2. Runs the 4-pass deobfuscation pipeline
3. Uses Google Gemini AI to identify key generation code
4. Executes the extracted code to generate the 64-bit key
5. Saves keys to `key.txt` and `rabbit.txt`

## License

[MIT License](LICENSE)
