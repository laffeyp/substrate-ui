# Research — counting a prompt's tokens

*2026-11-14. For roadmap `ROADMAP-2026-11-14-continue-a-session-r4.md`, E10. The Architect, 2026-11-14: fix it for Claude; for the other models, look up what is known.*

## What Substrate counts now

Every size the history window plans with is `len(text) // 4` (`substrate/src/substrate/topologies/session/transcript.py`, `_CHARS_PER_TOKEN`). It goes.

Every driver reports a real count after each call, `estimated: false` on `ModelReply.usage`:

| Driver | What it reports |
|---|---|
| `claude` | Each call's whole input, on each `assistant` event's `message.usage` (`input_tokens` + `cache_creation_input_tokens` + `cache_read_input_tokens`); the first call's is `first_call_prompt_tokens` (K350). |
| `codex` | One `input_tokens` per turn, on `turn.completed`, every call of its loop added. |
| `cursor-agent` | One `inputTokens` + `cacheReadTokens` per turn. |
| Ollama, local and cloud | `prompt_eval_count` per call, "the number of input tokens processed" ([Ollama, usage](https://docs.ollama.com/api/usage)). |

## Claude, measured

Anthropic does not publish the tokenizer its current models use. Its earlier tokenizer is published as a Hugging Face `tokenizer.json`, MIT licence ([Xenova/claude-tokenizer](https://huggingface.co/Xenova/claude-tokenizer)). Anthropic's model notes say the tokenizer introduced with Claude Opus 4.7, which Claude Opus 5.5 uses, takes up to 1.35 times as many tokens as earlier ones.

Claude Code's exact count (first call, Claude Opus 5.5, its own 34,193-token overhead taken off) over each tokenizer's count of the same text. The text is this project's own files.

| Sample | Claude Code | `claude-tokenizer` | Qwen2.5 | `o200k_base` | `cl100k_base` |
|---|---|---|---|---|---|
| Python and TypeScript, 20,000 chars | 7,923 | × 1.497 | × 1.639 | × 1.641 | × 1.651 |
| Python and TypeScript, 57,215 chars | 22,121 | × 1.461 | × 1.588 | × 1.595 | × 1.604 |
| English docs, 20,000 chars | 7,023 | × 1.434 | × 1.532 | × 1.554 | × 1.539 |
| English docs, 60,000 chars | 23,997 | × 1.425 | × 1.506 | × 1.556 | × 1.548 |

`claude-tokenizer` holds within 1.43–1.50 across code and prose; the others spread wider. Seventeen recorded single-call turns of the continued session gave 1.47. Substrate counts Claude's prompts as `claude-tokenizer` × 1.50, the top of the range, so no sample measured is undercounted.

## The other models, looked up

| Model family | Driver | Its published tokenizer |
|---|---|---|
| OpenAI GPT-5 and o-series | `codex` | `o200k_base`, in OpenAI's `tiktoken`. `tiktoken` 0.14.0 maps `gpt-5`, `gpt-4o-`, `o1-`, `o3-`, `o4-mini-` to it; it has no entry for `gpt-5.5`, `gpt-5.6` or `gpt-6` ([openai/tiktoken](https://github.com/OpenAI/tiktoken), [OpenAI cookbook](https://developers.openai.com/cookbook/examples/how_to_count_tokens_with_tiktoken)). |
| Kimi K2 | Ollama cloud | A `tiktoken`-style `tiktoken.model` with `tokenization_kimi.py`, about 160K entries; no `tokenizer.json` in the official repo ([moonshotai/Kimi-K2](https://github.com/MoonshotAI/Kimi-K2), [Kimi K2 tokenization notes](https://hexdocs.pm/tinkex/kimi_k2_tokenization.html)). |
| Qwen 2.5 / Qwen3 | Ollama local and cloud | `tokenizer.json` in each model repo ([Qwen/Qwen2.5-7B-Instruct](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct)). |
| GLM 4.5 and later | Ollama cloud | Loaded with `AutoTokenizer.from_pretrained("zai-org/GLM-4.5")` ([zai-org/GLM-4.5](https://huggingface.co/zai-org/GLM-4.5)). |
| DeepSeek V3 and later | Ollama cloud | `tokenizer.json` in `deepseek-ai/DeepSeek-V3`; the official file was not seen, only mirrors. |
| Cursor | `cursor-agent` | Whatever model Cursor is set to; no one tokenizer. |

Not built now. When it is, each family counts with its own tokenizer, and the driver's own report checks it.
