# Autonomous Agent Systems

Complete, deployable agent systems — not frameworks for building agents. You run them, point them at your accounts, files, or codebase, and they execute tasks autonomously. The decision here is different from picking an SDK: you're choosing a system to operate, not a library to build on.

## The Decision

| You want to… | Use |
|---|---|
| Automate personal tasks via WhatsApp / Telegram / Discord | OpenClaw |
| Work with local files — Word, Excel, PDF — via chat | Open Interpreter |
| General coding, research, automation on your local machine | Goose |
| Always-on server agent with persistent memory and auto-learned skills | Hermes |
| Autonomous software engineering across a full codebase | OpenHands |
| Terminal pair programmer that writes and commits code | Aider |

## Personal & Local Agents

### OpenClaw

Open source. Built by [@steipete](https://github.com/steipete). Mac / Windows / Linux.

- **What it does:** Runs on your machine and connects to your existing chat apps (WhatsApp, Telegram, Discord, Slack) as the interface. Executes real tasks: clearing inboxes, sending emails, managing calendars, browsing the web, filling forms, reading and writing files, running shell commands.
- **Architecture:** Local-first — private data by default. Always-on with background task execution via cron. 50+ built-in integrations; custom skills via extension.
- **Models:** Claude, OpenAI models, or local models via Ollama (MiniMax 2.5 and others).
- **Sweet spot:** Personal productivity automation where you want an agent that lives in your existing chat apps and executes tasks on your machine — no new UI to learn.
- **Sharp edges:** You're giving an AI shell access and file system access. Scope what it can touch carefully. Multi-user or team use is not its design target.

### Open Interpreter

Open source with commercial plans. Available on GitHub.

- **What it does:** A desktop agent focused on document and file work — PDF form filling, Excel pivot tables and formulas, Word document editing with tracked changes, batch file operations, data extraction across multiple documents.
- **Models:** OpenAI, Anthropic, Groq, OpenRouter, or local models via Ollama. Free tier available via ChatGPT account.
- **Sweet spot:** Teams that regularly process structured documents (contracts, reports, spreadsheets) and want an agent that can work across file types without custom code.
- **Sharp edges:** Browser control and macOS automation are marked experimental. Data privacy depends on which model you use — local stays local; hosted routes data through provider servers with 30-day logging.

### Goose

Apache 2.0. Governed by the Agentic AI Foundation (AAIF) at the Linux Foundation. Originally built by Block.

- **What it does:** General-purpose local agent available as a desktop app, CLI, and API. Handles coding, research, writing, automation, and data analysis.
- **Architecture:** Built in Rust. MCP-first — 70+ Model Context Protocol extensions connect it to GitHub, Google Drive, databases, APIs, and more. Recipes (portable YAML configs) make workflows shareable across teams. Supports subagents for parallel task execution.
- **Models:** 15+ providers — Anthropic, OpenAI, Google, Ollama, OpenRouter, Azure, AWS Bedrock.
- **Sweet spot:** Developer teams wanting a general-purpose local agent with strong MCP ecosystem integration and vendor-neutral governance.
- **Sharp edges:** Vendor-neutral governance means slower opinionated decisions. MCP extension quality varies widely — evaluate before committing to a workflow.

## Server-Side Persistent Agents

### Hermes Agent

MIT license. Built by [Nous Research](https://nousresearch.com). v0.13.0.

- **What it does:** A persistent autonomous agent that runs on your server, not your laptop. Core differentiator: it learns from completed tasks and auto-generates new skills — reusable code modules it can invoke on future similar requests. Delegates work to subagents for parallel execution.
- **Architecture:** Multi-platform interface (Telegram, Discord, Slack, WhatsApp, Signal, Email, CLI). Sandboxed execution via Docker or SSH backends. Web and browser control built in.
- **Sweet spot:** Teams wanting a server-resident agent that improves over time — accumulating skills and memory across projects rather than starting fresh each session.
- **Sharp edges:** Auto-generated skills can drift or produce low-quality code that gets cached and reused silently. Audit the skill library periodically. The memory system is powerful but opaque — understanding what the agent "knows" requires active management.

## Software Engineering Agents

### OpenHands

Fully open source. Formerly OpenDevin.

- **What it does:** Autonomous software engineering — plans, writes, and applies code changes across entire codebases. Handles vulnerability scanning, PR review, legacy code migration, and incident triage end-to-end.
- **Architecture:** Docker or Kubernetes sandboxed execution. Model-agnostic. Web GUI, CLI, and SDK interfaces. Integrates with GitHub, GitLab, Slack, and CI/CD systems. Enterprise deployment (on-premises, private cloud, managed cloud).
- **Sweet spot:** The most mature open-source SE agent. Right for teams wanting autonomous code changes, PR review pipelines, or bulk codebase operations that don't need a human in the loop for every step.
- **Sharp edges:** "Autonomous code changes" means it can introduce regressions. Always run in a sandboxed environment; never give it direct production access. Model quality has an outsized effect — it performs significantly better with frontier models than mid-tier ones.

### Aider

Open source.

- **What it does:** Terminal-based AI pair programmer. You describe a change; Aider edits your files and creates a git commit with a sensible message. Understands the full codebase via a repository map, not just the file you're looking at.
- **Models:** Works best with strong coding models such as Claude Sonnet 4.6 and DeepSeek V4-Pro. Also supports o-series, GPT models, and most local models. Maintains a public leaderboard of model coding performance.
- **Sweet spot:** Developers who live in the terminal and want an agent that respects their existing git workflow. Strong on refactors, bug fixes, and feature additions where you can describe the change clearly.
- **Sharp edges:** Works best when you can articulate what you want precisely — it's less autonomous than OpenHands. Large repos with poor code organization hit the context limit quickly despite the repo map. Multi-file architectural changes are harder than single-file edits.

## Production Reality

**These are "use" products, not "build" libraries** — the failure modes are different. When a framework leaks its abstraction, you fight the API. When an autonomous agent makes a bad decision, it might send an email, push a commit, or delete a file. Scope permissions aggressively; default to read-only access until you trust the agent's behavior on your workload.

**Sandboxing is non-negotiable for SE agents** — OpenHands runs in Docker by design. Aider writes directly to your filesystem. For anything touching production systems or shared repos, use a throwaway environment and review before merging.

**Model choice drives quality more than framework choice** — the same OpenHands or Aider setup with Claude Sonnet 4.6 vs a mid-tier model is not a marginal difference. Budget for frontier models when using SE agents on real work.

**Persistent memory is still experimental** — Hermes's auto-generated skills and OpenClaw's preference memory are compelling features, but memory systems across all these tools are less than two years old. Test that accumulated memory improves rather than degrades behavior over time on your specific workload.

**The "build vs use" question is real** — these systems are designed for common patterns. If your agent workflow is highly domain-specific, a custom agent loop (see [Agent Frameworks](/topics/agent-frameworks)) may serve you better than shaping your workflow to fit a pre-built system.

## Related Topics

- [Agent Frameworks](/topics/agent-frameworks) — for building your own loop instead of adopting a packaged system
- [Prompt Injection & Security](/topics/prompt-injection) — for the security boundary problems these products amplify
- [Evaluations](/topics/evals) — for testing whether autonomous behavior is acceptable before broad rollout
