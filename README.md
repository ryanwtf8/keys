# Keys

A TypeScript-based deobfuscator for extracting encryption keys from heavily obfuscated video player scripts.

## Supported Sources

- **MegaCloud V2** - 64-char hex keys
- **MegaCloud V3** - base64 keys 
- **CloudVidz V2** - 54-char hex keys (base64-encoded in source, decoded to hex)
- **CloudVidz V3** - 56-char hex keys (base64-encoded in source, decoded to hex) 

Each endpoint generates a separate output file:
- `megacloud_v2.txt`
- `megacloud_v3.txt`
- `cloudvidz_v2.txt`
- `cloudvidz_v3.txt`

## Features

- **5-Pass Deobfuscation Pipeline**: Progressive transformation using custom Babel plugins
- **AI-Powered Extraction**: Gemini 2.5 Flash for final code cleanup
- **Multi-Endpoint Support**: Modular configuration system for easy expansion
- **Robust Error Handling**: Timeouts, retries, and comprehensive logging
- **Type-Safe**: Full TypeScript implementation

## How It Works

### Deobfuscation Pipeline

The project uses a 5-stage deobfuscation process:

1. **Pass 1: Normalize Literals & Unflatten Control Flow**
   - Simplifies expressions and literals
   - Unflattens control flow structures

2. **Pass 2: Inline Arrays & Wrapper Functions**
   - Inlines array builders
   - Resolves wrapper/proxy functions

3. **Pass 3: Solve String Arrays & State Machines**
   - Decrypts string arrays
   - Resolves state machine logic

4. **Pass 4: Inline String Arrays**
   - Inlines remaining string arrays
   - Produces cleaner code

5. **Pass 5: Resolve M6J Function Mappings** ✨ NEW
   - Resolves dynamic function mappings
   - Replaces shortcuts with actual function calls

### Key Extraction Process

1. Fetches obfuscated player scripts from configured endpoints
2. Runs the 5-pass deobfuscation pipeline
3. Uses Google Gemini 2.5 Flash AI to extract key generation code
4. Executes the extracted code to generate encryption keys
5. Saves keys to individual output files (e.g., `megacloud_v2.txt`)

## License

[MIT License](LICENSE)
