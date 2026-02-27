import fs from "fs";
import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";
import { getObfuscatedEndpoints, buildEndpointUrl, type RyanPapa} from "./endpoints.js";
import { ApiKeyManager, DEFAULT_API_KEYS } from "./apiKeyManager.js";
import { validateKey, extractKeyFromCode } from "./keyValidator.js";

const useEnvKey = !!process.env.API_KEY;
const apiKeyInput = useEnvKey ? process.env.API_KEY! : DEFAULT_API_KEYS;
const keyManager = new ApiKeyManager(apiKeyInput, !useEnvKey);

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=`;

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);

async function generateContent(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await axios.post(API_URL + apiKey, {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    }, {
      timeout: 120000, 
    });
    return response.data.candidates[0]?.content?.parts[0]?.text.trim();
  } catch (error: any) {
    console.error("Error in generateContent:", error.message || error);
    if (error.response && error.response.status === 429) {
      console.log("[API-KEY] Rate limit hit, marking key as failed");
      keyManager.markKeyAsFailed(apiKey);
    }
    
    return null;
  }
}

async function processSite(url: string, scriptFile: string, outputFile: string, apiKey: string): Promise<void> {
  console.log(`Fetching script from ${url}...`);

  try {
    const response = await axios.get(url);
    console.log("Received script.");

    await writeFileAsync(scriptFile, response.data, "utf8");

    console.log("input.txt successfully written.");

    console.log("Running deobfuscate.js...");
    await execAsync("node dist/deobfuscate.js");

    console.log("deobfuscate.js finished.");

    console.log("Reading output.js.");

    return new Promise((resolve, reject) => {
      fs.readFile("output.js", "utf8", async (err, data) => {
      if (err) {
        console.error("!Error reading file!", err);
        return;
      }

      try {
        const match = data.match(/\(\(\)\s*=>\s*\{([\s\S]*?)try\s*{/);
        if (!match) {
          console.error("!No match found!");
          return;
        }
        console.log("Match found.");
        const xor_value_regex = /\b([a-zA-Z_$][\w$]*)\s*=\s*(?!0\b)(\d+)\s*;/g;
        let xor_value;
        if (match[0].match(xor_value_regex))
          xor_value = match[0].match(xor_value_regex)[0];
        
        let extra_message = `CRITICAL INSTRUCTIONS - Follow EXACTLY:

1. Extract ONLY the code that generates the encryption key
2. Keep it SIMPLE - maximum 1-3 lines of JavaScript
3. The key is likely already computed - just extract it, don't recreate algorithms
4. Look for: atob() calls, hex strings, or simple variable assignments
5. Output ONLY executable JavaScript - NO markdown, NO explanations
6. Last line MUST be: console.log(keyVariable)
7. Do NOT generate complex algorithms (XOR, TEA, interleaving, etc.)

EXPECTED KEY FORMATS:
- 64-char hex: lowercase a-f and digits 0-9 (e.g., 3709ad8892f413166b796a10c7fb86...)
- 16-char hex: lowercase a-f and digits 0-9 (e.g., 60d0bbed38370355)
- 37-char base64: letters/numbers only (e.g., hm0IIYodWBVN0se3p3OWGomd8KVP7rdfg6ZbA)

EXAMPLES OF GOOD OUTPUT:
const key = atob("aG0wSUlZb2RXQlZOMHNlM3AzT1dHb21kOEtWUDdyZGZnNlpiQQ==");
console.log(key);

OR:

const key = "3709ad8892f413166b796a10c7fb86018bd1be1c7ae6f4d2cfc3fdc299cb3205";
console.log(key);

EXTRACT THE KEY FROM THIS CODE:`;
        
        extra_message += xor_value
          ? `\n\nNOTE: We have ${xor_value}, so when you do mapping, xor each element with it.`
          : "";
        
        const prompt = match[0] + "\n" + extra_message;

        console.log("Waiting for LLLM response.");

        const decoded_code = await generateContent(prompt, apiKey);
        console.log(decoded_code);

        const lines = decoded_code?.split("\n") || [];

        const startsWithFence = lines[0]?.trim().startsWith("```javascript");
        const endsWithFence = lines[lines.length - 1]?.trim() === "```";

        const final_code = (
          startsWithFence && endsWithFence ? lines.slice(1, -1) : lines
        )
          .join("\n")
          .replace("console.log", "return");

        let finalKey = new Function(final_code)();

        console.log("\nLLM extracted key: ");
        console.log(finalKey + "\n");
        if (typeof finalKey === "string") {
          const validation = validateKey(finalKey);
          
          if (validation.isValid) {
            console.log(`Valid key detected! Format: ${validation.format}`);
            let keyToWrite = validation.cleanedKey!;
            if (url.includes('cloudvidz') && validation.format === 'base64') {
              try {
                const decoded = Buffer.from(finalKey, 'base64').toString('hex');
                console.log(`CloudVidz endpoint detected - decoding base64 to hex`);
                console.log(`   Base64: ${finalKey}`);
                console.log(`   Hex: ${decoded}`);
                keyToWrite = decoded;
              } catch (e) {
                console.warn(`Failed to decode base64, using original key`);
              }
            }
            
            await writeFileAsync(outputFile, keyToWrite, "utf8");
            console.log("Key successfully written.");
            resolve();
            return;
          } else {
            console.warn(`LLM-extracted key is INVALID: ${validation.error}`);
            console.log("Attempting pattern-based extraction as fallback...");
          }
        } else {
          console.warn("LLM did not return a string key.");
          console.log("Attempting pattern-based extraction as fallback...");
        }

        const patternKey = extractKeyFromCode(data, url);
        
        if (patternKey) {
          const patternValidation = validateKey(patternKey);
          if (patternValidation.isValid) {
            console.log(`Pattern extraction successful! Format: ${patternValidation.format}`)
            let keyToWrite = patternValidation.cleanedKey!;
            if (url.includes('cloudvidz') && patternValidation.format === 'base64') {
              try {
                const decoded = Buffer.from(patternKey, 'base64').toString('hex');
                console.log(`CloudVidz endpoint detected - decoding base64 to hex`);
                console.log(`   Base64: ${patternKey}`);
                console.log(`   Hex: ${decoded}`);
                keyToWrite = decoded;
              } catch (e) {
                console.warn(`Failed to decode base64, using original key`);
              }
            }
            
            await writeFileAsync(outputFile, keyToWrite, "utf8");
            console.log("Key successfully written (via pattern extraction).");
            resolve();
            return;
          }
        }

        console.error("Both LLM and pattern extraction failed to produce a valid key.");
        reject(new Error("Failed to extract valid key"));
      } catch (error) {
        console.error("Error processing output.js.", error);
        reject(error);
      }
    });
    });
  } catch (error) {
    console.error("Error in main.", error);
    throw error;
  }
}

async function main() {
  const endpoints = getObfuscatedEndpoints();

  console.log(`\n${'='.repeat(70)}`);
  console.log(`Key Extraction System - Processing ${endpoints.length} Endpoints`);
  console.log(`Using ${keyManager.getTotalKeys()} API Key(s)`);
  console.log(`${'='.repeat(70)}\n`);

  const results: { endpoint: RyanPapa; success: boolean; error?: string }[] = [];

  for (const endpoint of endpoints) {
    console.log(`\n[${'='.repeat(60)}]`);
    console.log(`Processing: ${endpoint.name}`);
    if (endpoint.description) {
      console.log(`${endpoint.description}`);
    }
    
    const apiKey = keyManager.getNextKey();
    console.log(`Using API Key: ${apiKey.substring(0, 20)}...`);
    console.log(`[${'='.repeat(60)}]\n`);
    
    try {
      await processSite(
        buildEndpointUrl(endpoint),
        "input.txt",
        endpoint.outputFile,
        apiKey
      );
      results.push({ endpoint, success: true });
      console.log(`\n ${endpoint.name} - SUCCESS\n`);
    } catch (error: any) {
      results.push({ endpoint, success: false, error: error.message });
      console.error(`\n ${endpoint.name} - FAILED: ${error.message}\n`);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`EXTRACTION SUMMARY`);
  console.log(`${'='.repeat(70)}\n`);

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`Successful: ${successful.length}/${results.length}`);
  successful.forEach(r => {
    console.log(`     • ${r.endpoint.name} → ${r.endpoint.outputFile}`);
  });

  if (failed.length > 0) {
    console.log(`\n Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`     • ${r.endpoint.name}: ${r.error}`);
    });
  }

  console.log(`\n${'='.repeat(70)}\n`);
}

main()
  .then()
  .catch((error) => console.error(error));
