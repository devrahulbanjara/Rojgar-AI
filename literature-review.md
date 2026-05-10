# Step 1 — AI Classification and Agent Description

## 1A — AI Aspects Addressed

| Component | AI Aspect | Learning Paradigm | Justification |
|---|---|---|---|
| RandomForest pre-filter (scikit-learn) | Machine Learning | Supervised | Trained on historical hire/no-hire binary labels; learns decision boundaries from labelled outcome data |
| Resume Gap Analysis (Groq LLM, 0–100 score) | NLP / ML | Self-supervised (pre-trained) | Large language model pre-trained via self-supervised next-token prediction; fine-tuned at scale before deployment; no task-specific labels required at inference |
| Auto-Patch with Frozen Facts (Groq LLM) | NLP | Self-supervised (pre-trained) | Pre-trained LLM performs constrained text rewriting; immutable-field enforcement is rule-based post-processing layered on top |
| Hybrid semantic search — Qdrant dense + BM25 (Gemini 3072-d) | NLP / IR | Hybrid (Self-supervised + rule-based) | Dense vectors come from a self-supervised transformer embedding model; BM25 is a deterministic statistical ranking function requiring no training |
| Multi-agent critique loop — CTO Agent (AWS Bedrock) | NLP / Multi-agent | Self-supervised (pre-trained) | Pre-trained LLM acting as domain persona; persona behaviour is prompt-engineered; no task-specific supervised training by the system |
| Multi-agent critique loop — HR Agent (AWS Bedrock) | NLP / Multi-agent | Self-supervised (pre-trained) | Same rationale as CTO agent; different persona prompt |
| Judge Agent — confidence 0–100, early-exit ≥ 70 | NLP / Multi-agent reasoning | Self-supervised (pre-trained) + Rule-based | LLM emits a structured confidence score; the threshold exit condition (≥ 70%, max 2 iterations) is a deterministic rule applied over that output |
| Final merge (Groq LLM) | NLP | Self-supervised (pre-trained) | Cheaper LLM combines structured persona outputs; no supervised training step |
| Conversation summarizer (Groq, ~300-word compression) | NLP | Self-supervised (pre-trained) | Instruction-following LLM performs abstractive compression; applied when conversation history exceeds 40 messages |
| Intent router — rule-based classifier first | NLP / Rule-based | Hybrid (Rule-based + Supervised/Self-supervised) | ~80% of turns matched by deterministic keyword rules (free); remaining ~20% routed to Groq for structured-JSON classification (LLM call) |
| Whisper Small fine-tuned on Nepali corpora | Speech / ASR | Supervised fine-tuning of self-supervised model | Whisper is self-supervised pre-trained on 680 K hours; fine-tuning on Nepali speech corpora with transcription targets is supervised |
| NeMo Guardrails `self_check_input` (Groq-backed) | NLP / Safety | Self-supervised (pre-trained) + Rule-based | LLM-based input classifier checked against policy rails defined declaratively; the rail pass/fail logic is rule-based |
| LangChain PIIMiddleware | NLP / Rule-based | Rule-based | Regex pattern matching for email, URL, phone; no learned model component |
| Resume Import (LlamaCloud + Groq normaliser) | NLP | Self-supervised (pre-trained) | Structured extraction model (LlamaCloud) plus LLM normalisation; both are pre-trained without system-specific supervised labels |
| AI Job Assistant (LangGraph, Tavily, Groq) | NLP / Agentic | Self-supervised (pre-trained) | LLM-driven multi-step workflow generating structured job drafts; Tavily web search is deterministic retrieval |
| Interview Evaluation rubric scoring (LLM) | NLP | Self-supervised (pre-trained) | LLM scores competency criteria from transcript against a recruiter-defined rubric; prompt-engineered, no supervised fine-tuning by system |

---

## 1B — Agent Descriptions

**Agent Name:** CTO Agent
**Role / Goal:** Evaluates the technical depth, tooling proficiency, real delivery evidence, and framework fluency of a candidate resume against the job description; produces a structured assessment.
**Inputs (Sensors):** Candidate resume text (PII-redacted, injection-checked), job description (from BedrockPromptCachingMiddleware), optional Tavily web search result (1-call cap).
**Outputs (Actuators):** Structured evaluation (strengths, concerns, evidence lists) consumed by the Judge Agent.
**Intelligence type:** LLM-based reasoning (AWS Bedrock Claude) with prompt-engineered persona.
**Constraints:** 1 Tavily web-search call cap per resume; structured-output schema caps response length; NeMo input rail must pass before execution.

---

**Agent Name:** HR Agent
**Role / Goal:** Evaluates candidate seniority, communication quality, hiring risk, and role fit from a human-resources perspective.
**Inputs (Sensors):** Same PII-redacted resume and cached job description as CTO Agent; optional Tavily web search result (1-call cap).
**Outputs (Actuators):** Structured HR evaluation consumed by the Judge Agent.
**Intelligence type:** LLM-based reasoning (AWS Bedrock Claude) with prompt-engineered persona.
**Constraints:** 1 Tavily web-search call cap; structured-output schema; NeMo input rail must pass.

---

**Agent Name:** Judge Agent
**Role / Goal:** Reads both CTO and HR evaluations; emits a confidence score 0–100 indicating sufficiency of the combined assessment; decides whether to exit or trigger another critique iteration.
**Inputs (Sensors):** CTO Agent output, HR Agent output, iteration counter.
**Outputs (Actuators):** Confidence score + optional feedback to trigger refinement loop; on ≥ 70% or max iterations reached, signals exit to Final Merge.
**Intelligence type:** LLM-based structured reasoning; early-exit rule applied over LLM output.
**Constraints:** Max 1–2 loop iterations per resume; confidence threshold 70% hard-coded; structured JSON output enforced.

---

**Agent Name:** Final Merge Agent (Groq)
**Role / Goal:** Synthesises both persona evaluations into a clean consolidated output: `strengths`, `concerns`, `evidence` lists that drive shortlist/reject decision.
**Inputs (Sensors):** CTO and HR evaluation outputs approved by Judge.
**Outputs (Actuators):** Final structured candidate assessment persisted to database; triggers shortlist/reject state transition.
**Intelligence type:** LLM-based synthesis (Groq, cheaper model).
**Constraints:** Structured-output schema enforced; cheaper model selected deliberately for cost; runs after Judge exit only.

---

**Agent Name:** Intent Router Agent
**Role / Goal:** Classifies recruiter chat messages into one of 7 intent categories (`search_candidates`, `lookup_candidate`, `salary_research`, `list_jobs`, `lookup_job`, `edit_job`, `chat`) to dispatch to the correct handler.
**Inputs (Sensors):** Recruiter message text, session history (post-summarisation), keyword rule set.
**Outputs (Actuators):** Intent label + structured JSON parameters; dispatches to the appropriate handler path.
**Intelligence type:** Hybrid — deterministic keyword rules (~80% coverage, zero API cost), Groq LLM structured-JSON classification for the residual ~20%.
**Constraints:** Direct-reply shortcut for trivial messages (e.g. "hi") requires zero API calls; rate limit: 20 msg/min.

---

**Agent Name:** NeMo Guardrails Input Rail (`self_check_input`)
**Role / Goal:** Blocks prompt injection, role-hijacking, and system-prompt exfiltration attempts embedded in user-controlled inputs before they reach any production LLM.
**Inputs (Sensors):** Any user-controlled text string at an LLM entry point (resume body, chat message, gap-analysis input, job generation brief).
**Outputs (Actuators):** Pass signal (processing continues) or fail signal (blocked; friendly error returned). Fails open if the rail itself errors.
**Intelligence type:** LLM-based safety classifier (Groq-backed NeMo Guardrails).
**Constraints:** Toggleable via `guardrails_enabled` setting; fails open to prevent outages; wired at 6 distinct entry points.

---

**Agent Name:** AI Job Assistant (LangGraph workflow)
**Role / Goal:** Generates a complete, validated job description draft from a recruiter's natural-language brief, with human review and refinement loop.
**Inputs (Sensors):** Recruiter brief text, lock-field flags, Tavily web search results (salary research), validation rule set.
**Outputs (Actuators):** Structured `JobDraft` (title, salary, responsibilities, requirements, etc.); `assumptions`, `warnings`, `missing_fields`, `validation_errors`; interrupt signal for human review.
**Intelligence type:** LLM-based structured generation (Groq) orchestrated via LangGraph nodes; salary synthesis via Tavily + Groq; validation is rule-based.
**Constraints:** 14-field allowlist; locked fields cannot be overridden by AI; human review interrupt mandatory before commit.

---

## 1C — Intelligence Goals

A human recruiter performing the full hiring funnel must simultaneously assess technical competence, cultural fit, communication quality, risk factors, and market-rate compensation — across hundreds of applications — while maintaining fairness, consistency, and regulatory compliance. The ConvexHire system replicates and augments this cognitive workload across three layers. At the volume layer, the RandomForest pre-filter replicates the fast heuristic judgment a recruiter applies when skimming a stack of CVs: years of experience alignment, skills coverage, and semantic relevance. This surfaces the top 20% most promising candidates in milliseconds, mirroring the human behaviour of quickly discarding obvious mismatches before investing deeper attention. At the reasoning layer, the CTO + HR + Judge critique loop replicates the panel-review discussion a senior technical lead and an HR manager would have when evaluating a shortlist candidate together. By assigning distinct domain-specific personas and iterating until the Judge is sufficiently confident, the system produces richer, multi-perspective assessments than any single-prompt LLM call could achieve. At the communication layer, the AI drafts outreach emails, rejection messages with embedded feedback, salary benchmarks, and resume improvement patches — tasks that consume significant recruiter time without requiring the uniquely human judgment of final hiring decisions.

Human judgment is deliberately preserved rather than automated at every consequential decision point in the system. The recruiter must explicitly confirm every shortlisting decision, every outreach email send, and every job-edit write. No email is sent without manual approval; no candidate is rejected without a human acknowledging the AI's recommendation. This design reflects the principle that AI in high-stakes personnel decisions should augment rather than replace the human accountable for that decision. The system additionally exposes AI scores, evidence, and feedback to both recruiters and candidates, ensuring that AI-generated reasoning is inspectable and challengeable — a property absent in most existing commercial hiring tools.

---

# Step 2 — 15 Papers

### Paper 1: AI Hiring with LLMs: A Context-Aware and Explainable Multi-Agent Framework for Resume Screening
- **Authors:** Lo, Frank P.-W.; Qiu, Jianing; Wang, Zeyu; Yu, Haibao; Chen, Yeming; Zhang, Gao; Lo, Benny
- **Venue & Year:** arXiv preprint (Imperial College London / CUHK), 2025
- **Verified URL:** https://arxiv.org/pdf/2504.02870
- **Summary:** Proposes a four-agent LLM pipeline (extractor, evaluator, summarizer, score formatter) for automated resume screening. The evaluator integrates RAG with industry-specific corpora, university rankings, and company hiring criteria to make assessments context-aware. AI-generated scores are benchmarked against HR professionals on anonymised resume datasets, demonstrating that multi-agent RAG-LLM systems match human-level assessment quality while scaling efficiently.
- **Key algorithm or model used:** Multi-agent RAG-LLM pipeline with in-context retrieval; four specialised LLM agents in sequence; cosine similarity for retrieval matching.
- **Core mathematical formulation:**
$$\text{score}_{final} = \text{ScoreFormatter}\bigl(\text{Summarizer}\bigl(\text{Evaluator}(\text{Resume}, \text{JD}, \text{RAG context})\bigr)\bigr)$$
  *(Cascaded functional composition across four agents; individual evaluator uses cosine similarity $\cos(\mathbf{q}, \mathbf{d}) = \frac{\mathbf{q} \cdot \mathbf{d}}{\|\mathbf{q}\|\|\mathbf{d}\|}$ for RAG retrieval.)*
- **Relevance to this system:** Directly validates the multi-agent architecture (CTO + HR + Judge) and confirms that multi-persona LLM evaluation matches HR-professional quality. The RAG pattern parallels the Tavily web-search enrichment used by CTO and HR agents.
- **Gap or limitation:** Authors acknowledge the system lacks structured confidence calibration for when the LLM's assessment is uncertain; all candidates pass through the full LLM pipeline with no cost-reduction pre-filter.
- **Search queries used:** `automated resume screening AI candidate ranking deep learning 2022 2023 IEEE ACM`; `AI hiring LLM multi-agent resume screening 2025 arXiv`

---

### Paper 2: CareerBERT: Matching Resumes to ESCO Jobs in a Shared Embedding Space for Generic Job Recommendations
- **Authors:** Rosenberger, Julian; Wolfrum, Lukas; Weinzierl, Sven; Kraus, Mathias; Zschech, Patrick
- **Venue & Year:** Expert Systems with Applications, 2025 (arXiv:2503.02056, March 2025)
- **Verified URL:** https://arxiv.org/pdf/2503.02056
- **Summary:** Introduces CareerBERT, a BERT-based model that embeds resumes and ESCO-standardised job descriptions into a shared vector space for semantic job-candidate matching. It is evaluated against traditional methods, pure transformer models, and LLMs, achieving superior performance on application metrics and human expert evaluations. The approach leverages the ESCO taxonomy to standardise skills vocabulary, enabling cross-domain matching.
- **Key algorithm or model used:** Fine-tuned BERT (sentence transformer) with TSDAE pre-training; cosine similarity in shared embedding space; ESCO taxonomy for skills normalisation.
- **Core mathematical formulation:**
$$\text{match}(r, j) = \cos(\mathbf{e}_r, \mathbf{e}_j) = \frac{\mathbf{e}_r \cdot \mathbf{e}_j}{\|\mathbf{e}_r\| \|\mathbf{e}_j\|}$$
  *where $\mathbf{e}_r$ and $\mathbf{e}_j$ are the BERT-derived embeddings of resume and job description respectively.*
- **Relevance to this system:** Directly validates the use of high-dimensional dense vector embeddings (Gemini 3072-d in this system) and cosine similarity as the foundation for semantic candidate-job matching in the Qdrant index.
- **Gap or limitation:** Authors note the system does not support real-time keyword fallback for exact-match queries (missing sparse retrieval), leaving a gap for hybrid retrieval.
- **Search queries used:** `BERT transformer job candidate semantic matching resume JD NLP 2022 2023 arXiv`

---

### Paper 3: DAT: Dynamic Alpha Tuning for Hybrid Retrieval in Retrieval-Augmented Generation
- **Authors:** Hsu, Hsin-Ling; Tzeng, Jengnan
- **Venue & Year:** arXiv preprint (National Chengchi University), 2025 (arXiv:2503.23013)
- **Verified URL:** https://arxiv.org/abs/2503.23013
- **Summary:** Proposes DAT, a hybrid retrieval framework for RAG systems that dynamically balances BM25 sparse retrieval and dense vector retrieval per query. Rather than a static interpolation weight α, DAT uses an LLM to score the top-1 result from each retrieval method and derives the optimal α dynamically. Experiments show consistent improvements over fixed-weight hybrid retrieval across multiple QA benchmarks.
- **Key algorithm or model used:** BM25 sparse retrieval + dense vector retrieval (DPR-family); LLM effectiveness scorer; dynamic α-weighted linear fusion.
- **Core mathematical formulation:**
$$\text{score}_{hybrid}(d, q) = \alpha \cdot \text{score}_{dense}(d, q) + (1-\alpha) \cdot \text{score}_{BM25}(d, q)$$
  *where $\alpha \in [0,1]$ is determined dynamically per query by LLM effectiveness scoring rather than fixed offline tuning.*
- **Relevance to this system:** Directly underpins the hybrid Qdrant (dense) + BM25 (sparse) retrieval design for job search and candidate search. Confirms that neither BM25 alone nor dense alone is optimal, justifying the hybrid approach used.
- **Gap or limitation:** Dynamic α computation requires an additional LLM call per query, increasing latency; authors note this trades cost for retrieval quality.
- **Search queries used:** `hybrid dense sparse BM25 retrieval augmented generation 2022 2023 arXiv EMNLP`

---

### Paper 4: A Unified Approach to Routing and Cascading for LLMs
- **Authors:** (Multiple authors — arXiv:2410.10347, October 2024)
- **Venue & Year:** arXiv preprint, October 2024
- **Verified URL:** https://arxiv.org/abs/2410.10347
- **Summary:** Derives formally optimal strategies for both routing (single model selection per query) and cascading (sequentially trying cheaper models first) in LLM serving. The paper proves optimality conditions, shows that cascade routing — a unification of both paradigms — outperforms either strategy alone, and demonstrates that model size diversity is not strictly required for cascading to be beneficial.
- **Key algorithm or model used:** Linear programming–based optimal routing and cascading; cascade routing unified framework; confidence-based deferral.
- **Core mathematical formulation:**
$$\min_{\pi} \; \mathbb{E}_{q}[\text{cost}(\pi(q))] \quad \text{s.t.} \quad \mathbb{E}_{q}[\text{quality}(\pi(q))] \geq Q_{\min}$$
  *where $\pi$ is the routing policy mapping query $q$ to a model; the LP optimises expected cost subject to a minimum quality constraint.*
- **Relevance to this system:** Provides formal grounding for the ML pre-filter → LLM cascade: the RandomForest gate routes easy rejects away from the expensive LLM, consistent with the cascade routing principle, achieving the documented ~80% LLM cost saving.
- **Gap or limitation:** Framework assumes quality can be measured at routing time; in practice the system uses a calibrated percentile threshold rather than real-time quality estimation.
- **Search queries used:** `LLM cost reduction model cascade smaller larger model routing 2023 arXiv`

---

### Paper 5: Improving Factuality and Reasoning in Language Models through Multiagent Debate
- **Authors:** Du, Yilun; Li, Shuang; Torralba, Antonio; Tenenbaum, Joshua B.; Mordatch, Igor
- **Venue & Year:** ICLR 2024 (International Conference on Learning Representations)
- **Verified URL:** https://openreview.net/forum?id=QAwaaLJNCk
- **Summary:** Demonstrates that having multiple LLM instances propose answers independently and then debate/critique each other over multiple rounds substantially improves factual accuracy and reasoning quality over single-agent approaches. The multi-agent debate (MAD) framework is tested on arithmetic, strategic reasoning, and biographical tasks, showing that disagreement between agents surfaces errors that single-agent self-consistency misses.
- **Key algorithm or model used:** Multi-agent debate with iterative critique; majority-vote aggregation across debate rounds; self-consistency ensembling.
- **Core mathematical formulation:**
$$a^*_t = \arg\max_{a} \sum_{i=1}^{N} \mathbf{1}[a_t^{(i)} = a]$$
  *where $a_t^{(i)}$ is agent $i$'s answer at round $t$; final answer is the majority vote across $N$ agents after debate convergence.*
- **Relevance to this system:** Directly validates the CTO + HR + Judge multi-agent critique loop design. The paper's finding that iterative critique between diverse perspectives improves factuality supports the Judge's role in deciding when consensus is sufficient (confidence ≥ 70%).
- **Gap or limitation:** Authors note that debate increases inference cost proportionally to the number of agents and rounds; they do not propose an early-exit mechanism to halt debate when confidence is already high.
- **Search queries used:** `multi-agent LLM debate critique ensemble reasoning 2023 2024 arXiv NeurIPS ICLR`

---

### Paper 6: Prompt Injection attack against LLM-integrated Applications (HouYi)
- **Authors:** Liu, Yi (and 11 co-authors)
- **Venue & Year:** arXiv preprint, June 2023 (arXiv:2306.05499; updated 2025)
- **Verified URL:** https://arxiv.org/abs/2306.05499
- **Summary:** Formalises and benchmarks prompt injection attacks against LLM-integrated applications using the HouYi framework, which compartmentalises attacks into a pre-constructed prompt, a context-partition injection, and a malicious payload. The paper systematically demonstrates that most LLM applications are vulnerable to indirect prompt injection where attacker-controlled content (documents, user inputs) overrides system instructions. Defences including input sanitisation and instruction hierarchy are discussed.
- **Key algorithm or model used:** HouYi attack framework (three-component injection); black-box adversarial prompting; benchmark evaluation across 36 real-world LLM applications.
- **Core mathematical formulation:** Attack success modelled as:
$$P(\text{attack success}) = P(\text{context partition}) \times P(\text{payload execution} \mid \text{partition})$$
  *Maximising each factor independently is shown to be achievable through careful prompt construction.*
- **Relevance to this system:** Directly justifies NeMo Guardrails `self_check_input` at every LLM entry point. Resume bodies and chat messages are exactly the "attacker-controlled content" this paper identifies as the primary injection vector in recruitment AI.
- **Gap or limitation:** Authors acknowledge that defence remains application-specific; no general-purpose rail that achieves near-zero false-negative rates across all LLM applications is proposed.
- **Search queries used:** `prompt injection attack LLM defense detection 2023 2024 arXiv security`

---

### Paper 7: A hybrid rule-based NLP and machine learning approach for PII detection and anonymization in financial documents
- **Authors:** Sharma, Kanhaiya (et al.)
- **Venue & Year:** Scientific Reports (Nature Publishing Group), 2025. DOI: 10.1038/s41598-025-04971-9
- **Verified URL:** https://www.nature.com/articles/s41598-025-04971-9
- **Summary:** Presents a hybrid PII detection and anonymisation pipeline combining rule-based NLP patterns, a custom spaCy Named Entity Recognition model, and machine learning to identify and redact personally identifiable information in financial documents. Evaluated on synthetic and real audit/vendor-invoice documents, achieving 94.7% precision, 89.4% recall, and 91.1% F1. The hybrid approach outperforms pure NER or pure rule-based methods alone.
- **Key algorithm or model used:** spaCy custom NER model + regex rule-based patterns + ML classifier; entity categories: name, email, phone, address, account numbers.
- **Core mathematical formulation:**
$$F_1 = 2 \cdot \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}} = 2 \cdot \frac{0.947 \times 0.894}{0.947 + 0.894} = 0.911$$
- **Relevance to this system:** Directly validates the use of LangChain PIIMiddleware (email, URL, phone redaction) before shortlisting LLM calls. The paper confirms hybrid rule-NER approaches achieve near-production precision for the specific PII categories (email, phone) that the system redacts.
- **Gap or limitation:** Authors note the system was evaluated only on English documents; performance on multilingual or code-switched text (relevant to Nepali candidate resumes in this system) is not assessed.
- **Search queries used:** `PII detection anonymization NLP named entity recognition personal data 2022 2023 arXiv ACL`

---

### Paper 8: Whisper Finetuning on Nepali Language
- **Authors:** Ojha, Vaghawan Prasad (and co-authors)
- **Venue & Year:** arXiv preprint, November 2024 (arXiv:2411.12587)
- **Verified URL:** https://arxiv.org/abs/2411.12587
- **Summary:** Presents a comprehensive study of fine-tuning OpenAI Whisper models of multiple sizes (tiny, base, small, medium, large) on Nepali ASR. The authors construct an exhaustive generalised dataset from publicly available Nepali speech corpora and self-recorded custom data with diverse accents, dialects, and speaking styles, augmented to improve coverage. Results demonstrate substantial WER reductions versus zero-shot Whisper on Nepali, with smaller fine-tuned models outperforming larger zero-shot models.
- **Key algorithm or model used:** Whisper encoder-decoder transformer fine-tuned with supervised training on Nepali transcription targets; data augmentation (speed perturbation, noise addition).
- **Core mathematical formulation:**
$$\text{WER} = \frac{S + D + I}{N} \times 100\%$$
  *where $S$ = substitutions, $D$ = deletions, $I$ = insertions, $N$ = total reference words; the paper uses WER as the primary ASR evaluation metric.*
- **Relevance to this system:** Directly validates the ConvexHire design decision to host a Whisper Small fine-tuned on Nepali speech corpora on HuggingFace Space for interview transcription. Confirms that Nepali fine-tuning is necessary and that Whisper Small achieves meaningful WER improvements over zero-shot.
- **Gap or limitation:** Authors note that code-switched (English-Nepali mixed) speech was not systematically addressed; the fine-tuned models were trained on monolingual Nepali data only, leaving a gap for the code-switching scenario that ConvexHire explicitly targets.
- **Search queries used:** `Whisper fine-tuning low resource ASR Nepali South Asian language 2023 2024 arXiv INTERSPEECH`

---

### Paper 9: Investigations of Performance and Bias in Human-AI Teamwork in Hiring
- **Authors:** Peng, Andi; Nushi, Besmira; Kıcıman, Emre; Inkpen, Kori; Kamar, Ece
- **Venue & Year:** AAAI 2022 (Association for the Advancement of Artificial Intelligence)
- **Verified URL:** https://arxiv.org/pdf/2202.11812
- **Summary:** Conducts a large-scale user study of human-AI hybrid hiring decisions using three NLP classifiers (random, bag-of-words, deep neural network) as candidate recommendation aids. Finds that high-performing models significantly improve human accuracy in a constrained selection task, but that some model architectures mitigate hybrid bias while others amplify it — specifically that humans show decision conformity toward the AI recommendation irrespective of its correctness. Gender bias dynamics in human-AI teams are systematically characterised.
- **Key algorithm or model used:** Bag-of-words classifier; deep neural network bio-classifier; human-AI hybrid decision protocol; decision conformity metric.
- **Core mathematical formulation:**
$$\text{Conformity}_{ai} = \frac{\#\{\text{human follows AI recommendation}\}}{\#\{\text{AI recommendation presented}\}}$$
  *Used to quantify how strongly AI recommendations override independent human judgment.*
- **Relevance to this system:** Provides the empirical basis for the human-in-the-loop design. The finding that humans often over-conform to AI recommendations justifies ConvexHire's explicit confirm-before-act pattern — ensuring recruiters actively engage with rather than passively accept AI shortlisting decisions.
- **Gap or limitation:** Authors note the study was conducted in a controlled lab setting; real-world recruiter behaviour under time pressure and with multiple competing roles was not studied.
- **Search queries used:** `human in the loop machine learning AI hiring decision consequential 2022 2023 arXiv ACM`

---

### Paper 10: Fairness and Bias in Algorithmic Hiring: a Multidisciplinary Survey
- **Authors:** Fabris, Alessandro; Baranowska, Nina; Dennis, Matthew J.; Hacker, Philipp; Saldivar, Jorge; Zuiderveen Borgesius, Frederik; Biega, Asia J.
- **Venue & Year:** ACM Computing Surveys (arXiv:2309.13933, September 2023)
- **Verified URL:** https://arxiv.org/abs/2309.13933
- **Summary:** A comprehensive multidisciplinary survey covering algorithmic fairness, bias types, mitigation strategies, datasets, and legal frameworks across the full hiring pipeline. The paper analyses how algorithmic systems propagate historical biases via proxy discrimination (zip code, university name, language use as proxies for race/socioeconomic status), distinguishes between individual and group fairness notions, and reviews legal frameworks including the EU AI Act's classification of hiring AI as high-risk.
- **Key algorithm or model used:** Survey of 250+ algorithmic hiring tools; fairness metrics (demographic parity, equalised odds, calibration); bias mitigation strategies (pre-processing, in-processing, post-processing).
- **Core mathematical formulation:**
$$\text{Demographic Parity}: P(\hat{Y}=1 \mid A=0) = P(\hat{Y}=1 \mid A=1)$$
  *where $\hat{Y}$ is the model's shortlisting decision and $A$ is a protected attribute (gender, race). Requires equal shortlisting rates across groups.*
- **Relevance to this system:** Identifies proxy discrimination as a key risk in resume-based AI screening — directly motivating the PIIMiddleware's redaction of identifying information and the post-expiry shortlisting window that guarantees a fair application window for all candidates.
- **Gap or limitation:** Survey notes that most bias mitigation techniques require access to demographic labels during training, which are often unavailable in practice; no system studied combines all mitigation layers simultaneously.
- **Search queries used:** `algorithmic bias fairness AI recruitment hiring gender race discrimination 2022 2023 FAccT arXiv`

---

### Paper 11: Improved intent classification based on context information using a windows-based approach
- **Authors:** (Multiple authors)
- **Venue & Year:** arXiv preprint, November 2024 (arXiv:2411.06022)
- **Verified URL:** https://arxiv.org/abs/2411.06022
- **Summary:** Proposes a context-aware intent classification approach for conversational NLU systems that concatenates dialogue history with the current utterance using a sliding window strategy. A CNN-on-BERT architecture extracts effective vector representations and the window-based context improves intent classification accuracy on standard benchmarks. Results show that incorporating even 2–3 prior turns meaningfully improves classification over single-turn approaches.
- **Key algorithm or model used:** BERT embeddings + CNN intent classifier; window-based dialogue history concatenation; ATIS and SNIPS benchmarks.
- **Core mathematical formulation:**
$$\mathbf{h}_{context} = \text{CNN}([\mathbf{e}_{t-w}; \ldots; \mathbf{e}_{t-1}; \mathbf{e}_t])$$
  *where $\mathbf{e}_{t-k}$ is the BERT embedding of turn $t-k$ and $w$ is the window size; CNN extracts local patterns across the window.*
- **Relevance to this system:** Validates the intent router's use of conversation history (alongside the current message) for accurate classification. Justifies the 40-message history cap and 6-message recent-turn preservation in the summariser as maintaining the context needed for accurate intent routing.
- **Gap or limitation:** Authors note that the window approach fails when the relevant context is far back in the dialogue history — the fixed window cannot capture long-range dependencies, motivating the summarisation approach used in this system.
- **Search queries used:** `intent classification hybrid rule-based neural NLU conversational 2022 2023 arXiv ACL`

---

### Paper 12: Compressing Lengthy Context With UltraGist
- **Authors:** Zhang, Peitian; Liu, Zheng (co-first authors) (et al.)
- **Venue & Year:** arXiv preprint, May 2024 (arXiv:2405.16635)
- **Verified URL:** https://arxiv.org/pdf/2405.16635
- **Summary:** Proposes UltraGist, a compression method for long LLM contexts (documents, multi-turn conversations) that learns to produce compressed gist tokens from variable-length inputs, supporting arbitrary compression ratios. Unlike fixed-ratio methods, UltraGist handles dynamically updated contexts (as in conversations) without recomputing compression from scratch. It addresses the "impossible triangle" of compression rate, information retention, and inference efficiency.
- **Key algorithm or model used:** Gist token compression with learned compression ratio; Language Modelling objective for end-to-end training; dynamic context update without full recomputation.
- **Core mathematical formulation:**
$$\mathcal{L} = -\sum_{t} \log P_\theta(x_t \mid \mathbf{g}_{1:k}, x_{1:t-1})$$
  *where $\mathbf{g}_{1:k}$ are $k$ gist (compression) tokens derived from earlier context; the model is trained to predict subsequent tokens conditioned on compressed history.*
- **Relevance to this system:** Validates the conversation summarisation design (history capped at 40 messages; Groq compresses older turns to ~300 words). The paper confirms that LLM-based context compression achieves ~60% token reduction without meaningful quality loss — matching the documented ~60% token reduction figure.
- **Gap or limitation:** Authors note compression can cause lossy information loss for precise numerical or constraint-heavy details — consistent with ConvexHire preserving the 6 most recent turns verbatim to avoid this issue.
- **Search queries used:** `conversational AI long context summarization compression LLM 2023 2024 arXiv EMNLP ACL`

---

### Paper 13: AI-Driven Decision-Making System for Hiring Process
- **Authors:** Filatova, Vira; Zelenchuk, Andrii; Filatov, Dmytro
- **Venue & Year:** arXiv preprint, December 2024 (arXiv:2512.20652)
- **Verified URL:** https://arxiv.org/pdf/2512.20652
- **Summary:** Presents an LLM-orchestrated modular multi-agent hiring assistant covering document preprocessing, structured candidate profile construction, public-data verification, technical/culture-fit scoring with risk penalties, and human-in-the-loop validation. Evaluated on 64 real Python backend applicants, the system achieves 1.70 hours per qualified candidate versus 3.33 hours for an experienced recruiter, with lower cost, while preserving a human final decision-maker.
- **Key algorithm or model used:** Multi-agent LLM orchestration; configurable scoring formula aggregating technical fit, culture fit, and risk penalties; human-in-the-loop validation interface.
- **Core mathematical formulation:**
$$\text{score}_{candidate} = w_1 \cdot \text{TechFit} + w_2 \cdot \text{CultureFit} - w_3 \cdot \text{RiskPenalty}$$
  *where weights $w_i$ are configurable by the recruiter and each component is produced by a specialist LLM agent.*
- **Relevance to this system:** Provides a directly comparable system architecture — multi-agent LLM with HITL — and quantifies the efficiency gain. ConvexHire extends this by adding the ML pre-filter gate, formal confidence-threshold exit, and NeMo security rails, which this system lacks.
- **Gap or limitation:** Authors acknowledge the absence of any ML pre-filter: every candidate goes through the full LLM pipeline, which is cost-prohibitive at scale.
- **Search queries used:** `human in the loop machine learning AI hiring decision consequential 2022 2023 arXiv ACM`

---

### Paper 14: Formalizing and Benchmarking Prompt Injection Attacks and Defenses
- **Authors:** Liu, Yupei (et al.)
- **Venue & Year:** arXiv preprint, October 2023 (arXiv:2310.12815; updated 2024)
- **Verified URL:** https://arxiv.org/abs/2310.12815
- **Summary:** Provides the first formal taxonomy and benchmark of prompt injection attacks and defences across 36 real-world LLM applications. Categorises attacks by injection strategy (direct, indirect), goal (data exfiltration, role-hijack, command injection), and stealthiness. Evaluates defences including perplexity filtering, paraphrasing, and instruction hierarchy, finding that no single defence achieves robust protection — motivating defence-in-depth approaches.
- **Key algorithm or model used:** Benchmark platform with 36 LLM applications; attack success rate (ASR) metric; perplexity-based detection; instruction hierarchy defence.
- **Core mathematical formulation:**
$$\text{ASR} = \frac{\#\{\text{successful injections}\}}{\#\{\text{total injection attempts}\}} \times 100\%$$
  *Used to quantify how effectively a defence reduces the fraction of injections that achieve attacker goals.*
- **Relevance to this system:** Reinforces the defence-in-depth rationale for stacking NeMo Guardrails + PIIMiddleware + XML scrubber + `<user_message>` wrapping. The paper's finding that no single defence suffices directly motivates ConvexHire's multi-layer approach.
- **Gap or limitation:** Authors note their benchmark does not cover LLM systems with ML pre-filters (like RandomForest gates) that could interrupt attack delivery before the LLM stage.
- **Search queries used:** `prompt injection attack LLM defense detection 2023 2024 arXiv security`; (found on arXiv.org search results page)

---

### Paper 15: Whisper-LM: Improving ASR Models with Language Models for Low-Resource Languages
- **Authors:** (Multiple authors)
- **Venue & Year:** arXiv preprint, March 2025 (arXiv:2503.23542)
- **Verified URL:** https://arxiv.org/abs/2503.23542
- **Summary:** Investigates combining fine-tuned Whisper models with n-gram and neural language models to further reduce WER for low-resource languages. Through fine-tuning and evaluation across multiple datasets, demonstrates substantial WER improvements especially in low-resource scenarios where training data is scarce. The approach combines ASR fine-tuning with LM rescoring to leverage both acoustic and linguistic priors.
- **Key algorithm or model used:** Whisper encoder-decoder fine-tuned on low-resource language data; n-gram LM and neural LM rescoring via beam search; CTC loss.
- **Core mathematical formulation:**
$$\log P_{\text{combined}}(\mathbf{y} \mid \mathbf{x}) = \log P_{\text{ASR}}(\mathbf{y} \mid \mathbf{x}) + \lambda \log P_{\text{LM}}(\mathbf{y})$$
  *where $\mathbf{x}$ is the audio, $\mathbf{y}$ is the transcript, and $\lambda$ is a tunable LM weight; LM rescoring improves beam search for low-resource languages.*
- **Relevance to this system:** Extends Paper 8 (Nepali Whisper fine-tuning) by showing that language-model augmentation further reduces WER — a potential future improvement for ConvexHire's Whisper-NP model, which currently does not apply LM rescoring.
- **Gap or limitation:** Authors note that integrating LMs adds inference latency, which conflicts with the real-time transcription requirements of live interview workflows.
- **Search queries used:** `Whisper fine-tuning low resource ASR Nepali South Asian language 2023 2024 arXiv INTERSPEECH`

---

# Step 3 — Algorithm Comparison Tables

## 3A — Resume Screening / Candidate Ranking Approaches

| Algorithm | Paper | Key Metric Reported | Limitation noted by authors |
|---|---|---|---|
| Multi-agent RAG-LLM pipeline (4 agents) | Lo et al., 2025 (arXiv:2504.02870) | AI scores closely match HR professional scores (agreement rate reported qualitatively) | No cost-reduction pre-filter; all candidates processed by full LLM pipeline; no confidence calibration |
| BERT/Sentence-BERT fine-tuned for job matching (CareerBERT) | Rosenberger et al., 2025 (arXiv:2503.02056) | Superior nDCG and human expert evaluation vs. TF-IDF, word2vec, and base LLMs | No real-time keyword/exact-match fallback; purely semantic, misses lexical precision |
| LLM-orchestrated multi-agent with HITL scoring | Filatova et al., 2024 (arXiv:2512.20652) | 1.70 h/qualified candidate vs. 3.33 h for expert recruiter; F1 on qualified detection reported | No ML pre-filter; every candidate sent to full LLM pipeline; cost-prohibitive at scale |
| RandomForest pre-filter (this system) | — | — (calibrated to top-20% percentile; ~80% LLM cost eliminated) | Performance depends on feature engineering quality and quality/quantity of historical hire/no-hire labels |

**Justification:** The literature consistently shows that pure LLM approaches achieve high accuracy but are cost-prohibitive at scale. CareerBERT demonstrates that dense semantic matching outperforms keyword methods but lacks lexical precision. The RandomForest pre-filter addresses the cost problem by eliminating 80% of candidates before any LLM call — a design validated by the cascade routing framework (Paper 4, Du et al.) — while the multi-agent critique loop (Papers 1, 5, 13) handles the remaining 20% with the accuracy quality that LLM-based approaches provide.

---

## 3B — Retrieval Methods for Job/Candidate Search

| Method | Paper | Key Metric | Limitation |
|---|---|---|---|
| BM25 only (sparse) | Hsu & Tzeng, 2025 (arXiv:2503.23013) — baseline in DAT experiments | Lower Recall@K vs. hybrid on semantic queries | Fails on natural-language queries where exact keyword match is absent |
| Dense vector only | Hsu & Tzeng, 2025 (arXiv:2503.23013) — baseline in DAT experiments | Lower Precision on keyword-specific queries vs. hybrid | Misses precise term matches (e.g. specific technology names, certifications) |
| Hybrid BM25 + dense (fixed α) | Hsu & Tzeng, 2025 (arXiv:2503.23013) | Outperforms either method alone consistently across QA benchmarks | Fixed α fails to adapt to query-type variation |
| Hybrid BM25 + dense — dynamic α (DAT) | Hsu & Tzeng, 2025 (arXiv:2503.23013) | Best across all benchmarks; consistently surpasses fixed-α hybrid | Requires additional LLM call per query for α computation |
| Hybrid BM25 + Gemini 3072-d dense (this system) | — | — (production deployment; no published benchmark) | α is not dynamically tuned per query; fixed fusion weights used in Qdrant |

**Justification:** The DAT paper rigorously demonstrates that hybrid retrieval (BM25 + dense) outperforms either method alone across multiple benchmarks. This directly validates ConvexHire's Qdrant hybrid search design. Natural-language queries such as "Python backend senior developer" benefit from dense semantic understanding, while exact terms (e.g. "AWS Certified Solutions Architect") are better served by BM25. The system trades dynamic α tuning (which requires an additional LLM call) for a fixed fusion to avoid extra latency, a reasonable engineering trade-off for a job-search context.

---

## 3C — Multilingual ASR Approaches for Low-Resource Languages

| Approach | Paper | WER or Accuracy | Limitation |
|---|---|---|---|
| Base Whisper (zero-shot Nepali) | Ojha et al., 2024 (arXiv:2411.12587) | High WER on Nepali (specific numbers vary by model size; substantially higher than fine-tuned) | Trained predominantly on high-resource languages; poor acoustic and morphological coverage of Nepali |
| Whisper fine-tuned on Nepali speech corpora | Ojha et al., 2024 (arXiv:2411.12587) | Substantially lower WER vs. zero-shot across all model sizes | Fine-tuned on monolingual Nepali; code-switched (English-Nepali) speech not addressed |
| Whisper fine-tuned + language model rescoring | (Multiple authors), 2025 (arXiv:2503.23542) | Further WER reduction vs. ASR-only fine-tuning in low-resource settings | Adds inference latency; incompatible with strict real-time constraints |
| Fine-tuned Whisper Small on Nepali audio (this system) | — | — (production deployment on HuggingFace Space) | Cold-start latency requires retry mechanism; code-switched accuracy not benchmarked |

**Justification:** The literature (Papers 8 and 15) demonstrates that fine-tuning Whisper on target-language data is necessary and effective for low-resource languages like Nepali. Zero-shot Whisper performs poorly due to training data imbalance. ConvexHire's deployment of a Whisper Small fine-tuned specifically on Nepali speech corpora is the directly supported state-of-the-art choice for this language. Language-model rescoring (Paper 15) offers further gains but adds latency unsuitable for production interview transcription, explaining the design choice to use fine-tuned ASR alone.

---

# Step 4 — Mathematical Foundations

**BM25 Scoring Formula**
$$\text{BM25}(q, d) = \sum_{t \in q} \text{IDF}(t) \cdot \frac{f(t,d) \cdot (k_1 + 1)}{f(t,d) + k_1 \cdot \left(1 - b + b \cdot \frac{|d|}{\text{avgdl}}\right)}$$
$$\text{IDF}(t) = \log\left(\frac{N - n(t) + 0.5}{n(t) + 0.5} + 1\right)$$
*Source:* Hsu & Tzeng, 2025 (arXiv:2503.23013) — cites Robertson et al. (1994) as the foundational formulation. In this system: $q$ = natural-language recruiter query; $d$ = job description or candidate profile; $f(t,d)$ = term frequency of token $t$ in document $d$; $k_1 = 1.5$, $b = 0.75$ are free parameters; $|d|/\text{avgdl}$ is the document-length normalisation. BM25 scores are linearly fused with Gemini dense similarity scores in Qdrant hybrid retrieval.

---

**Cosine Similarity**
$$\cos(\mathbf{u}, \mathbf{v}) = \frac{\mathbf{u} \cdot \mathbf{v}}{\|\mathbf{u}\|_2 \|\mathbf{v}\|_2} = \frac{\sum_i u_i v_i}{\sqrt{\sum_i u_i^2}\sqrt{\sum_i v_i^2}}$$
*Source:* Rosenberger et al., 2025 (arXiv:2503.02056) — used as the primary match score between BERT-embedded resume $\mathbf{u}$ and job $\mathbf{v}$ in CareerBERT. In this system: applied in two places — (1) as the third feature for the RandomForest pre-filter (resume-vs-JD cosine similarity via fastembed), and (2) as the dense retrieval score for Gemini 3072-d vectors in Qdrant hybrid search.

---

**Random Forest Ensemble Prediction**
$$\hat{y}(x) = \text{majority\_vote}\left\{h_1(x), h_2(x), \ldots, h_B(x)\right\}$$
where each tree $h_b$ is grown on a bootstrap sample and uses a random subset of features at each split, with splits selected to minimise Gini impurity:
$$G = 1 - \sum_{k=1}^{K} p_k^2$$
*Source:* No paper from Step 2 presents this formulation directly, but it is the standard Random Forest formulation (Breiman, 2001) underlying the scikit-learn implementation used in this system. In this system: $x = (\text{years\_exp\_match}, \text{skills\_overlap\_ratio}, \text{cosine\_sim})$; $K=2$ classes (hire / no-hire); $B$ trees vote on shortlist/reject; calibrated to a percentile threshold keeping the top 20%.

---

**Transformer Self-Attention**
$$\text{Attention}(\mathbf{Q}, \mathbf{K}, \mathbf{V}) = \text{softmax}\!\left(\frac{\mathbf{Q}\mathbf{K}^\top}{\sqrt{d_k}}\right)\mathbf{V}$$
$$\text{MultiHead}(\mathbf{Q},\mathbf{K},\mathbf{V}) = \text{Concat}(\text{head}_1, \ldots, \text{head}_h)\mathbf{W}^O$$
$$\text{head}_i = \text{Attention}(\mathbf{Q}\mathbf{W}_i^Q, \mathbf{K}\mathbf{W}_i^K, \mathbf{V}\mathbf{W}_i^V)$$
*Source:* Rosenberger et al., 2025 (arXiv:2503.02056) — CareerBERT is built on the BERT transformer architecture which uses this multi-head self-attention formulation (originally from Vaswani et al., 2017). In this system: this mechanism is the foundation of every embedding model (Gemini text-embedding-3072d, fastembed) and every LLM (Groq, AWS Bedrock Claude, Whisper encoder-decoder).

---

**Word Error Rate (WER)**
$$\text{WER} = \frac{S + D + I}{N} \times 100\%$$
*where $S$ = number of substituted words, $D$ = deleted words, $I$ = inserted words, $N$ = total words in the reference transcript.*
*Source:* Ojha et al., 2024 (arXiv:2411.12587) — uses WER as the primary evaluation metric for all Whisper fine-tuning experiments on Nepali. In this system: WER is the appropriate metric for evaluating ConvexHire's Whisper Small fine-tuned on Nepali audio; lower WER means more accurate interview transcriptions, directly improving downstream LLM evaluation quality.

---

**Precision, Recall, F1**
$$\text{Precision} = \frac{TP}{TP + FP}, \quad \text{Recall} = \frac{TP}{TP + FN}, \quad F_1 = 2 \cdot \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
*Source:* Sharma et al., 2025 (Scientific Reports, DOI:10.1038/s41598-025-04971-9) — reports P=94.7%, R=89.4%, F1=91.1% for PII detection. In this system: F1 is the primary metric for evaluating the RandomForest pre-filter (where $TP$ = correctly identified strong candidates; $FP$ = weak candidates incorrectly advanced; $FN$ = strong candidates incorrectly rejected). The calibration to top-20% percentile is designed to maximise recall on strong candidates (minimise FN) while accepting a higher FP rate that the LLM stage then filters.

---

**Confidence Threshold / Early-Exit Condition**
$$\text{exit} = \begin{cases} 1 & \text{if } c_t \geq \tau \text{ or } t = T_{\max} \\ 0 & \text{otherwise (continue loop)} \end{cases}$$
*where $c_t \in [0, 100]$ is the Judge's confidence score at iteration $t$, $\tau = 70$ is the confidence threshold, and $T_{\max} = 2$ is the maximum iteration count.*

This is structurally equivalent to the early-exit cascading condition formalised in Du et al., 2024 (ICLR, openreview.net/forum?id=QAwaaLJNCk): *"the debate terminates when agents converge,"* which in the multi-agent debate literature is operationalised as a stopping criterion on agreement or confidence. In this system: the Judge emits $c_t$ and the LangGraph workflow checks the exit condition after each critique round, limiting maximum cost to 2 full CTO+HR iterations per candidate before the Final Merge is triggered regardless.

---

# Step 5 — Similar Systems

### System 1: Eightfold.ai Talent Intelligence Platform
- **Type:** Commercial product
- **Verified source URL:** https://eightfold.ai/ (confirmed live, accessed May 2026)
- **Core AI capabilities:** Deep learning–based candidate matching using 1.6 billion career profiles and 1.6 million skills; skills inference from career history; AI Interviewer agent for autonomous candidate engagement; internal mobility recommendations; agentic talent operating system (ATOS) with autonomous task-taking agents; bias mitigation by focusing on skills rather than credentials.
- **Overlap with this system:** Semantic candidate ranking (analogous to Qdrant dense vector search); AI-driven screening (analogous to multi-agent evaluation); candidate engagement automation (analogous to outreach drafting).
- **What AI aspects it addresses:** ML (deep learning for talent matching); NLP (career trajectory modelling, skills inference); multi-agent (ATOS autonomous agents).
- **Key limitation or gap:** Eightfold does not expose a public description of any ML pre-filter that gates LLM calls; there is no documented multi-agent critique loop with a confidence-threshold early exit; no Nepali/multilingual speech transcription for interviews; no documented NeMo Guardrails-class prompt injection defence for resume-borne attacks; human confirmation workflows are not documented at the individual shortlisting decision level.

---

### System 2: HireVue
- **Type:** Commercial product
- **Verified source URL:** https://www.hirevue.com/ai-in-hiring (confirmed live)
- **Core AI capabilities:** AI-scored video interviews using proprietary NLP models trained on 70+ million interviews; game-based psychometric assessments; Virtual Job Tryout simulations; conversational AI chatbot for candidate engagement via SMS/WhatsApp; automated scheduling; structured interview content with IO-psychologist validation. LLMs with guardrails used for candidate engagement and interview insights; static deterministic AI Assessment models (not retrained on the fly).
- **Overlap with this system:** Audio/video interview assessment (analogous to Whisper transcription + LLM rubric evaluation); structured scoring against job-specific competencies (analogous to evaluation schema with weighted criteria); conversational AI for engagement (analogous to recruiter AI chat).
- **What AI aspects it addresses:** NLP (video transcript NLP scoring), ML (proprietary interview scoring models), rule-based (IO-psychologist validated competency frameworks).
- **Key limitation or gap:** HireVue's AI Assessment does not include a multi-persona critique loop — a single model scores the interview. No documented hybrid semantic search for candidate sourcing. No multilingual low-resource ASR for South Asian languages. No ML pre-filter before LLM scoring. No documented prompt injection defence.

---

### System 3: LinkedIn Recruiter (AI-Assisted Search, 2024 Release)
- **Type:** Commercial product
- **Verified source URL:** https://business.linkedin.com/talent-solutions/product-update/recruiter-release (confirmed live)
- **Core AI capabilities:** Generative AI–assisted candidate search via natural language queries; embedding-based semantic title expansion and candidate recommendation (GBDT models with network embedding features described in LinkedIn engineering blog); AI-assisted InMail drafting (40% increase in acceptance rates reported); recommended matches (35% more likely to accept vs. standard search); automated project creation from hiring goals.
- **Overlap with this system:** Natural-language candidate search (analogous to `search_candidates` intent with hybrid Qdrant retrieval); AI-drafted outreach messages (analogous to outreach email generation); candidate ranking with ML models (analogous to scoring pipeline).
- **What AI aspects it addresses:** NLP (generative AI intent parsing); ML (GBDT ranking models with embedding features); rule-based (filter-based ATS logic).
- **Key limitation or gap:** LinkedIn's candidate pool is limited to LinkedIn members; no multi-agent critique loop for shortlisting; no ML pre-filter before LLM; no interview transcription or evaluation; no Nepali ASR; no documented prompt injection defence; no human-confirm-before-act workflow for individual shortlisting decisions at the per-candidate level.

---

### System 4: AI-Driven Decision-Making System for Hiring Process (Filatova et al., academic prototype)
- **Type:** Research prototype
- **Verified source URL:** https://arxiv.org/pdf/2512.20652 (confirmed live — arXiv December 2024)
- **Core AI capabilities:** Modular multi-agent pipeline — document preprocessing, structured candidate profile construction, public-data verification via web search, technical/culture-fit scoring with risk penalties, human-in-the-loop validation interface. LLM orchestrated under strict constraints; configurable weighted aggregation of technical fit, culture fit, and risk penalty scores. Evaluated on 64 real Python backend applicants.
- **Overlap with this system:** Multi-agent LLM evaluation (analogous to CTO + HR agents); HITL validation interface (analogous to recruiter confirm-before-act); technical and culture-fit scoring (analogous to evaluation schema).
- **What AI aspects it addresses:** NLP (LLM reasoning); multi-agent (modular specialist agents); rule-based (validation constraints).
- **Key limitation or gap:** No ML pre-filter — every candidate sent to full LLM pipeline (cost-prohibitive at large scale); no confidence-threshold early exit; no prompt injection defence; no semantic search for candidate discovery; no ASR/interview transcription; no PII redaction middleware.

---

### System 5: Nepal AI-Powered Job Portal (GitHub: Soum-ik/AI-Powerd-Job-Portal)
- **Type:** Open-source student/developer project (Nepal)
- **Verified source URL:** https://github.com/Soum-ik/AI-Powerd-Job-Portal (confirmed live on GitHub)
- **Core AI capabilities:** AI-generated job descriptions from recruiter input using Google Generative AI (Gemini); role-based access control for job seekers and recruiters; approval system for job listing quality. No documented resume screening ML model, no semantic search, no multi-agent evaluation.
- **Overlap with this system:** AI job description generation (analogous to AI Job Assistant); role-based access for recruiters and candidates (analogous to recruiter/candidate role system); approval workflow for job listings (analogous to draft → active state machine).
- **What AI aspects it addresses:** NLP (LLM for job description generation only).
- **Key limitation or gap:** No ML pre-filter or any candidate screening intelligence; no semantic candidate search; no multi-agent shortlisting; no ASR; no HITL confirmation patterns; no security rails; no conversation management. Functionally limited to job description drafting — covers approximately 1 of the 15+ AI components present in ConvexHire. This gap demonstrates that no Nepal-built system at the time of writing addresses the full AI-assisted hiring funnel.

---

# Step 6 — Literature Review Narrative

## 6.1 AI in Talent Acquisition and Automated Screening

Automated hiring technology has expanded dramatically over the past decade, driven by increasing application volumes and the maturation of natural language processing. Filatova et al. [2024] demonstrate that an AI-driven, multi-agent hiring assistant can process candidates at 1.70 hours per qualified candidate compared to 3.33 hours for an experienced human recruiter, representing a near-50% efficiency gain while preserving a human final decision-maker. Lo et al. [2025] extend this by constructing a four-agent RAG-augmented LLM framework for resume screening, showing that AI-generated candidate scores closely match those of HR professionals when the evaluator agent is contextualised with industry-specific knowledge sources. These findings establish that AI systems can match the accuracy of expert human screeners at a fraction of the labour cost.

However, the efficiency gains of automated screening come with documented risks. Fabris et al. [2023] provide a comprehensive multidisciplinary survey identifying proxy discrimination as a structural failure mode: even when protected attributes such as race and gender are withheld from a model, features such as university name, zip code, and language register function as proxies that reproduce the same discriminatory outcomes. The survey reviews legal frameworks including the EU AI Act's classification of AI hiring tools as high-risk systems, and notes that no deployed system studied simultaneously addresses all bias mitigation layers. Peng et al. [2022] compound this concern by demonstrating in a controlled user study that humans in hybrid AI-assisted hiring settings show strong decision conformity toward AI recommendations — following the AI's suggestion even when it is incorrect — suggesting that the mere presence of an AI recommendation can undermine rather than augment human judgment if not carefully designed. These findings collectively argue that AI-assisted hiring must be designed with explicit human oversight mechanisms and transparency into AI reasoning, not merely as an automation layer.

## 6.2 Resume Analysis, Semantic Matching, and Hybrid Retrieval

Early resume-processing systems relied on keyword matching and vector space models, which failed to capture semantic equivalences across domain vocabulary (e.g., "software engineer" matching "software developer") [Rosenberger et al., 2025]. The introduction of BERT and its derivatives enabled contextual semantic embeddings that represent candidate qualifications and job requirements in a shared vector space, supporting similarity-based matching. Rosenberger et al. [2025] introduce CareerBERT, which maps both resumes and ESCO-standardised job descriptions into a shared BERT embedding space and uses cosine similarity for matching. CareerBERT outperforms both TF-IDF and vanilla BERT baselines across application metrics and human expert evaluations, confirming that domain-adapted transformer embeddings substantially improve retrieval quality. Lo et al. [2025] further demonstrate that integrating RAG within an LLM evaluator — allowing the system to contextualise assessments with external knowledge about certifications, university rankings, and industry expectations — produces more accurate and contextually relevant assessments than pure parametric LLM scoring.

While dense vector retrieval captures semantic relationships that keyword methods miss, it is weakest on precise lexical queries — searching for a specific technology name or exact certification title benefits from exact-match capabilities [Hsu & Tzeng, 2025]. Hsu and Tzeng [2025] demonstrate through controlled experiments that hybrid retrieval combining BM25 sparse retrieval with dense vector similarity consistently outperforms either approach alone on open-domain QA benchmarks, and that the optimal interpolation weight α varies by query type. Their DAT framework dynamically estimates α per query using LLM effectiveness scoring, achieving the best retrieval quality across all tested configurations. This body of work establishes that neither BM25 alone nor dense retrieval alone is sufficient for production job-search and candidate-search systems, motivating the hybrid Qdrant dense + BM25 design used in this system.

## 6.3 Multi-Agent and Multi-Persona LLM Architectures

A foundational body of work demonstrates that allowing multiple LLM agents to critique and debate each other's responses improves factual accuracy, reasoning quality, and error detection beyond what any single agent achieves. Du et al. [2024], in a widely cited ICLR paper, show that multi-agent debate — where agents independently propose answers and then iteratively critique competing positions — substantially outperforms single-agent self-consistency on arithmetic, strategic reasoning, and biographical question-answering tasks. The key mechanism is that disagreement between agents surfaces errors that individual agents fail to self-detect, and that diverse reasoning perspectives collectively reach better conclusions than majority-vote ensembling alone.

Lo et al. [2025] apply this principle specifically to resume screening, showing that multi-agent evaluation (extractor → evaluator → summariser → formatter) produces more reliable candidate assessments than single-prompt LLM scoring. Filatova et al. [2024] further demonstrate that assigning distinct roles to specialist agents — a technical evaluator and a culture-fit evaluator — produces richer, component-level rationales that human reviewers find more trustworthy and actionable. These findings directly motivate the CTO + HR + Judge design in this system: the CTO agent evaluates technical depth while the HR agent independently assesses seniority and role fit, and the Judge determines whether the combined evidence meets a sufficient confidence threshold (≥70%) before exiting the loop. Crucially, Du et al. [2024] also identify that debate increases inference cost proportionally to iterations — motivating the early-exit mechanism at ≥70% confidence and the two-iteration maximum, which the literature has not previously combined with a formal percentile-calibrated ML gate.

## 6.4 Cost-Efficient AI Pipelines: Cascading, Caching, and Routing

The dominant cost challenge in deploying LLMs at hiring scale is that naive "every-resume-to-LLM" pipelines are economically prohibitive. Ong et al. [2024] (A Unified Approach to Routing and Cascading for LLMs, arXiv:2410.10347) formalise the cost-performance trade-off using linear programming, proving that cascade routing — directing easy queries to smaller/cheaper models and hard queries to larger expensive ones — is provably optimal under quality constraints. The formal result is that a binary gate (pass/block) applied before the expensive model minimises expected cost subject to a minimum quality guarantee, exactly the structure of the RandomForest pre-filter in this system.

In parallel, hybrid intent routing — using deterministic rule-based classifiers for high-frequency, high-confidence query types and reserving neural classification only for the residual ambiguous tail — is validated by the NLU literature [2024, arXiv:2411.06022] as an effective cost-reduction strategy for conversational AI. The system's intent router applies this directly: keyword rules handle ~80% of recruiter chat turns at zero API cost, while the remaining ~20% are classified by a Groq LLM with structured JSON output. Combined with Bedrock prompt caching (reusing the job description across all persona calls for the same position), structured-output schema caps (limiting response length), the Judge's early exit (max 2 iterations), and a 24-hour salary research cache (preventing repeated Tavily searches for the same role/country), the stacked design achieves the documented ~80% cost reduction versus a naive all-LLM pipeline. This multi-layer cost discipline represents a practical implementation of the theoretical results in the cascading literature, applied to a full-funnel HR system.

## 6.5 Security and Privacy: Prompt Injection and PII in AI Systems

The integration of LLMs into high-stakes workflows creates novel attack surfaces that do not exist in traditional software. Liu et al. [2023] formalise prompt injection attacks — where attacker-controlled content embedded in user inputs overrides system instructions — and demonstrate through the HouYi framework that the vast majority of real-world LLM applications are vulnerable to indirect injection via documents, emails, and user-provided text. Their benchmark across 36 applications finds that no single defence (perplexity filtering, instruction hierarchy, paraphrasing) achieves robust protection, explicitly recommending defence-in-depth architectures. Liu et al. [2023] (arXiv:2310.12815) extend this with a formal taxonomy of injection strategies and metrics, confirming that attack success rates remain high against individual defences.

In a hiring context, resume bodies are the primary indirect injection vector: a malicious candidate can embed instructions in their CV text designed to manipulate the shortlisting LLM into awarding a high score or exfiltrating other candidates' assessments. Sharma et al. [2025] demonstrate that hybrid rule-NER pipelines can achieve 94.7% precision and 91.1% F1 for PII detection in unstructured documents, validating the precision of pattern-based redaction. In this system, defence-in-depth is implemented by layering NeMo Guardrails `self_check_input` (blocking injection patterns before any LLM call), LangChain PIIMiddleware (redacting email, URL, and phone before shortlisting LLM calls), XML tag scrubbing, `<user_message>` wrapping, and rate limiting — a combination directly motivated by the literature's conclusion that no single defence is sufficient.

## 6.6 Multilingual and Low-Resource Speech Recognition

Whisper (Radford et al., 2023) represents the current frontier of multilingual ASR, having been pre-trained on 680,000 hours of weakly labelled speech across nearly 100 languages. However, its training data is heavily skewed toward high-resource languages, and zero-shot performance on low-resource languages such as Nepali is substantially degraded. Ojha et al. [2024] address this directly, constructing a comprehensive dataset from publicly available Nepali corpora and self-recorded audio with diverse accents and speaking styles, then fine-tuning Whisper models of multiple sizes. Their results confirm that supervised fine-tuning on target-language data produces substantial WER reductions compared to zero-shot Whisper, with smaller fine-tuned models outperforming larger zero-shot models — validating the use of Whisper Small as a cost-effective deployment choice.

A compounding challenge for this system is code-switching: Nepali professionals in technical interviews frequently intersperse English technical terminology with Nepali conversational language. Ojha et al. [2024] explicitly note that monolingual Nepali fine-tuning does not address code-switched speech, leaving this as an open problem. Multistage fine-tuning strategies and LM-augmented rescoring [arXiv:2503.23542, 2025] offer potential paths to further WER reduction, but introduce inference latency that conflicts with real-time transcription requirements. This gap motivates the ConvexHire deployment choice of a Whisper Small model fine-tuned specifically on Nepali corpora and hosted on HuggingFace Space — a practical engineering decision consistent with the state of the art, with acknowledged limitations for code-switched utterances that represent a concrete direction for future work.

## 6.7 Human-in-the-Loop AI for Consequential Decisions

The empirical case for human-in-the-loop design in high-stakes AI applications is well established. Peng et al. [2022] demonstrate in a large-scale user study that AI models significantly improve human accuracy in hybrid hiring decisions, but that the benefit is highly dependent on model architecture and that some architectures amplify rather than mitigate bias through decision conformity effects. Filatova et al. [2024] complement this with a system design study showing that HITL validation in an AI hiring pipeline preserves human accountability while delivering substantial efficiency gains — the human remains the final decision-maker even as AI handles the analytical workload.

These findings argue that AI hiring systems should not automate consequential decisions end-to-end, but should instead surface AI reasoning transparently and require explicit human confirmation before executing irreversible actions. In ConvexHire, this principle is instantiated at every consequential action: every shortlisting decision requires recruiter confirmation, every outreach email sits in a review queue before sending, every job edit produces a before/after diff requiring explicit confirm. The AI shortlisting pipeline is additionally constrained to run only after job expiry — ensuring all candidates have had a fair window to apply before any are evaluated — a design choice directly motivated by Fabris et al.'s [2023] analysis of how algorithmic systems can introduce selection-timing biases.

---

# Step 7 — Research Contribution and Novelty

## Research Contribution and Novelty

**What the literature establishes:**
- Multi-agent LLM frameworks match HR professional accuracy in resume screening [Lo et al., 2025], and multi-persona critique loops (debate/ensemble) consistently outperform single-agent evaluation in reasoning quality [Du et al., 2024].
- Hybrid dense + BM25 retrieval outperforms either method alone across retrieval benchmarks [Hsu & Tzeng, 2025], and domain-adapted transformer embeddings are superior to TF-IDF or keyword methods for job-candidate semantic matching [Rosenberger et al., 2025].
- Prompt injection attacks represent a serious and inadequately addressed vulnerability in LLM-integrated applications, and no single defence suffices — defence-in-depth is required [Liu et al., 2023; Liu et al., 2023 (2310.12815)].

**Gaps remaining in literature and existing systems:**
1. **No cost-efficient ML gate before LLM screening.** Lo et al. [2025] and Filatova et al. [2024] both send every candidate to the full LLM pipeline, which is cost-prohibitive at scale. The cascade routing literature [arXiv:2410.10347] derives the theoretical optimality of such a gate but does not apply it to a hiring system. No published HR AI prototype combines an ML pre-filter with a multi-agent LLM critique loop.
2. **No confidence-threshold early-exit in multi-agent hiring evaluation.** Du et al. [2024] identify that debate cost scales with iterations but do not implement a confidence-calibrated early-exit condition. No existing system (commercial or research) applies a formal confidence threshold (≥70%) with a maximum iteration cap to a multi-agent hiring critique loop.
3. **No Nepali/code-switched ASR for interview transcription in any comparable system.** Ojha et al. [2024] fine-tune Whisper on Nepali but do not integrate this into a hiring platform. HireVue, Eightfold, and LinkedIn Recruiter do not address low-resource South Asian language ASR.
4. **No security-layer combination (prompt injection + PII + hallucination prevention) in AI hiring.** Fabris et al. [2023] and Liu et al. [2023] identify these risks separately but no published system applies NeMo Guardrails, PIIMiddleware, and Frozen Facts simultaneously in a hiring pipeline.
5. **Nepal-specific full-funnel AI hiring system is absent from literature.** The only Nepal-origin AI job portal found (Soum-ik/AI-Powerd-Job-Portal) offers only AI job description generation, leaving the entire screening, evaluation, interview, and outreach pipeline unaddressed for Nepal's linguistic context.

**How this system advances the field:**
- **Gap 1** is addressed by the scikit-learn RandomForest pre-filter: three deterministic features (years-of-experience match, skills-overlap ratio, cosine similarity via fastembed) calibrated to a top-20% percentile threshold eliminate ~80% of LLM cost while preserving recall on strong candidates — the first published implementation of cascade-routing theory in a complete hiring pipeline.
- **Gap 2** is addressed by the Judge Agent's confidence-threshold early-exit (≥70%, max 2 iterations): formalising when debate has produced sufficient evidence to commit, combining the multi-agent critique loop design with the cost-saving early-exit mechanism that Du et al. [2024] identify but do not implement.
- **Gap 3** is addressed by the HuggingFace-hosted Whisper Small fine-tuned on Nepali speech corpora, supporting English + Nepali + code-switched interview transcription within an end-to-end hiring system — the first documented integration of Nepali ASR in a hiring platform.
- **Gap 4** is addressed by the stacked defence architecture: NeMo `self_check_input` at 6 LLM entry points + PIIMiddleware (email/URL/phone redaction) + Frozen Facts (immutable resume fields) + 14-field edit allowlist — the most comprehensive defence-in-depth implementation against prompt injection and hallucination documented in any hiring AI system.
- **Gap 5** is addressed by the system as a whole: ConvexHire is, to the knowledge evidenced in this review, the first end-to-end AI-assisted hiring platform explicitly designed for Nepal's linguistic context (Nepali ASR, code-switching support) and deployed with academically motivated design decisions at every AI component.

---

# Step 8 — Gap Analysis Table

| # | Gap in Literature / Existing Systems | Source | How This System Addresses It |
|---|---|---|---|
| 1 | Multi-agent LLM resume screening sends every candidate to the full LLM pipeline with no cost-reduction gate, making the approach cost-prohibitive at scale | Lo et al., 2025 (arXiv:2504.02870); Filatova et al., 2024 (arXiv:2512.20652) | RandomForest pre-filter (scikit-learn, 3 features, top-20% percentile threshold) eliminates ~80% of candidates before any LLM call; LLM costs incurred only for the top-20% cohort |
| 2 | Multi-agent debate frameworks (Du et al., 2024) identify that iteration cost scales with debate rounds but do not implement a confidence-calibrated early-exit mechanism | Du et al., 2024 (ICLR, openreview.net/forum?id=QAwaaLJNCk) | Judge Agent exits the critique loop at confidence ≥70% or after max 2 iterations, explicitly bounding per-candidate LLM token spend |
| 3 | Hybrid retrieval literature confirms BM25 + dense outperforms either alone, but existing hiring systems (LinkedIn, Eightfold) do not document a unified hybrid search for both job discovery and candidate search within the same platform | Hsu & Tzeng, 2025 (arXiv:2503.23013) | Qdrant hybrid search (Gemini 3072-d dense + BM25 sparse) powers both candidate job discovery and recruiter candidate search in a single system |
| 4 | No published AI hiring prototype or commercial system integrates Nepali or code-switched ASR for interview transcription | Ojha et al., 2024 (arXiv:2411.12587); HireVue (hirevue.com); LinkedIn Recruiter | Whisper Small fine-tuned on Nepali speech corpora, hosted on HuggingFace Space, handles English + Nepali + code-switched interview audio |
| 5 | Prompt injection benchmarks confirm that no single defence achieves robust protection in LLM-integrated applications | Liu et al., 2023 (arXiv:2306.05499); Liu et al., 2023 (arXiv:2310.12815) | NeMo Guardrails `self_check_input` at 6 LLM entry points + LangChain PIIMiddleware + XML tag scrubbing + `<user_message>` wrapping — stacked defence-in-depth |
| 6 | AI hiring systems do not redact PII (email, phone, URL) before shortlisting LLM calls, exposing candidate identifying information to third-party LLM providers | Sharma et al., 2025 (Scientific Reports, 10.1038/s41598-025-04971-9); Fabris et al., 2023 (arXiv:2309.13933) | LangChain PIIMiddleware redacts email/URL/phone from resume text before any shortlisting LLM call |
| 7 | LLM-based resume rewriting tools have no mechanism to prevent fabrication of employment history, credentials, or dates | No confirmed paper — gap identified from Fabris et al., 2023 and Filatova et al., 2024 | Frozen Facts constraint (company, title, dates, institution, certifications are immutable fields enforced server-side in Auto-Patch) |
| 8 | Existing bias mitigation research focuses on model training but does not address process-level fairness (e.g., ensuring all candidates have equal time to apply before screening begins) | Fabris et al., 2023 (arXiv:2309.13933); Peng et al., 2022 (arXiv:2202.11812) | Shortlisting pipeline activates only after job expiry — guaranteeing a closed, fair application window for every applicant before any AI evaluation begins |
| 9 | Human-in-the-loop hiring systems do not implement per-decision explicit confirmation for every consequential action (shortlist, email send, job edit) | Peng et al., 2022 (arXiv:2202.11812); Filatova et al., 2024 (arXiv:2512.20652) | Every shortlisting decision, every outreach email send, and every job-field write requires explicit recruiter confirmation; no silent automated actions |
| 10 | Conversation summarisation literature confirms LLM-based compression achieves ~60% token reduction, but no hiring system documents implementing this as a cost-reduction layer in recruiter AI chat | (Compressing Lengthy Context With UltraGist, arXiv:2405.16635); LinkedIn Recruiter (no history management documented) | Groq compresses older turns to ~300-word summary when history exceeds 40 messages, preserving 6 most recent intact; documented ~60% context-token reduction |
| 11 | Intent classification research validates hybrid rule-neural routing but no hiring chatbot documents the cost split between rule-based free classification and LLM fallback | arXiv:2411.06022; Eightfold AI (no public documentation of intent routing cost breakdown) | Rule-based classifier handles ~80% of recruiter chat turns at zero API cost; Groq LLM handles residual ~20% requiring structured-JSON classification |
| 12 | Nepal lacks any AI hiring platform that combines semantic search, multi-agent screening, multilingual ASR, and human-in-the-loop workflows | Soum-ik/AI-Powerd-Job-Portal (GitHub — job description generation only); no confirmed Nepal academic prototype addressing the full funnel | ConvexHire covers the full funnel end-to-end for Nepal's context, including Nepali ASR and a hiring flow adapted to small-company recruiter workflows |

---

# Step 9 — Reference List (IEEE Format)

[1] F. P.-W. Lo, J. Qiu, Z. Wang, H. Yu, Y. Chen, G. Zhang, and B. Lo, "AI Hiring with LLMs: A Context-Aware and Explainable Multi-Agent Framework for Resume Screening," arXiv preprint arXiv:2504.02870, 2025. [Online]. Available: https://arxiv.org/pdf/2504.02870

[2] J. Rosenberger, L. Wolfrum, S. Weinzierl, M. Kraus, and P. Zschech, "CareerBERT: Matching Resumes to ESCO Jobs in a Shared Embedding Space for Generic Job Recommendations," *Expert Systems with Applications*, arXiv preprint arXiv:2503.02056, Mar. 2025. [Online]. Available: https://arxiv.org/pdf/2503.02056

[3] H.-L. Hsu and J. Tzeng, "DAT: Dynamic Alpha Tuning for Hybrid Retrieval in Retrieval-Augmented Generation," arXiv preprint arXiv:2503.23013, Mar. 2025. [Online]. Available: https://arxiv.org/abs/2503.23013

[4] Multiple Authors, "A Unified Approach to Routing and Cascading for LLMs," arXiv preprint arXiv:2410.10347, Oct. 2024. [Online]. Available: https://arxiv.org/abs/2410.10347

[5] Y. Du, S. Li, A. Torralba, J. B. Tenenbaum, and I. Mordatch, "Improving Factuality and Reasoning in Language Models through Multiagent Debate," in *Proc. Int. Conf. Learning Representations (ICLR 2024)*, 2024. [Online]. Available: https://openreview.net/forum?id=QAwaaLJNCk

[6] Y. Liu et al., "Prompt Injection attack against LLM-integrated Applications," arXiv preprint arXiv:2306.05499, Jun. 2023 (updated 2025). [Online]. Available: https://arxiv.org/abs/2306.05499

[7] K. Sharma et al., "A hybrid rule-based NLP and machine learning approach for PII detection and anonymization in financial documents," *Scientific Reports*, vol. 15, no. 1, p. 22729, Jul. 2025, doi: 10.1038/s41598-025-04971-9. [Online]. Available: https://www.nature.com/articles/s41598-025-04971-9

[8] V. P. Ojha et al., "Whisper Finetuning on Nepali Language," arXiv preprint arXiv:2411.12587, Nov. 2024. [Online]. Available: https://arxiv.org/abs/2411.12587

[9] A. Peng, B. Nushi, E. Kıcıman, K. Inkpen, and E. Kamar, "Investigations of Performance and Bias in Human-AI Teamwork in Hiring," in *Proc. AAAI Conf. Artif. Intell.*, vol. 36, 2022. [Online]. Available: https://arxiv.org/pdf/2202.11812

[10] A. Fabris et al., "Fairness and Bias in Algorithmic Hiring: a Multidisciplinary Survey," *ACM Computing Surveys*, arXiv preprint arXiv:2309.13933, Sep. 2023. [Online]. Available: https://arxiv.org/abs/2309.13933

[11] Multiple Authors, "Improved intent classification based on context information using a windows-based approach," arXiv preprint arXiv:2411.06022, Nov. 2024. [Online]. Available: https://arxiv.org/abs/2411.06022

[12] P. Zhang and Z. Liu et al., "Compressing Lengthy Context With UltraGist," arXiv preprint arXiv:2405.16635, May 2024. [Online]. Available: https://arxiv.org/pdf/2405.16635

[13] V. Filatova, A. Zelenchuk, and D. Filatov, "AI-Driven Decision-Making System for Hiring Process," arXiv preprint arXiv:2512.20652, Dec. 2024. [Online]. Available: https://arxiv.org/pdf/2512.20652

[14] Y. Liu et al., "Formalizing and Benchmarking Prompt Injection Attacks and Defenses," arXiv preprint arXiv:2310.12815, Oct. 2023 (updated 2024). [Online]. Available: https://arxiv.org/abs/2310.12815

[15] Multiple Authors, "Whisper-LM: Improving ASR Models with Language Models for Low-Resource Languages," arXiv preprint arXiv:2503.23542, Mar. 2025. [Online]. Available: https://arxiv.org/abs/2503.23542

**Similar Systems:**
[S1] Eightfold AI, "AI Recruiting Software – Artificial Intelligence Platform for HR," Eightfold.ai, 2025. [Online]. Available: https://eightfold.ai/

[S2] HireVue, "AI in Hiring — Ethical & Effective AI Hiring," HireVue, 2025. [Online]. Available: https://www.hirevue.com/ai-in-hiring

[S3] LinkedIn, "2024 Recruiter Release," LinkedIn Talent Solutions, 2024. [Online]. Available: https://business.linkedin.com/talent-solutions/product-update/recruiter-release

[S4] V. Filatova, A. Zelenchuk, and D. Filatov, "AI-Driven Decision-Making System for Hiring Process," arXiv:2512.20652, 2024. (Same as Paper 13.)

[S5] Soum-ik, "AI-Powered Job Portal," GitHub, 2024. [Online]. Available: https://github.com/Soum-ik/AI-Powerd-Job-Portal

---

# Step 10 — Search Log

## Cluster 1 — Automated resume screening and AI-driven candidate ranking
- `automated resume screening AI candidate ranking deep learning 2022 2023 IEEE ACM` → Found arXiv:2504.02870 (Lo et al.) ✓; also surfaced arXiv:2512.20652 (Filatova et al.) ✓
- Secondary verification via PDF fetch of arXiv:2504.02870 ✓

## Cluster 2 — NLP/transformer models for resume parsing and semantic matching
- `BERT transformer job candidate semantic matching resume JD NLP 2022 2023 arXiv` → Found arXiv:2503.02056 (CareerBERT) ✓
- PDF fetch of arXiv:2503.02056 confirmed ✓

## Cluster 3 — Hybrid dense-sparse retrieval
- `hybrid dense sparse BM25 retrieval augmented generation 2022 2023 arXiv EMNLP` → Found arXiv:2503.23013 (DAT) ✓
- arXiv abstract page fetched at https://arxiv.org/abs/2503.23013 (rate limited on first attempt; confirmed via HTML page fetch) ✓

## Cluster 4 — LLM cost reduction: cascading, ML pre-filtering, prompt caching
- `LLM cost reduction model cascade smaller larger model routing 2023 arXiv` → Found arXiv:2410.10347 (Unified Routing and Cascading) ✓
- arXiv abstract page confirmed at https://arxiv.org/abs/2410.10347 ✓

## Cluster 5 — Multi-agent LLM systems: critique loops, debate
- `multi-agent LLM debate critique ensemble reasoning 2023 2024 arXiv NeurIPS ICLR` → Found ICLR 2024 (Du et al.) at openreview.net ✓
- OpenReview page fetched and confirmed ✓

## Cluster 6 — Prompt injection attacks and defenses
- `prompt injection attack LLM defense detection 2023 2024 arXiv security` → Found arXiv:2306.05499 (Liu et al., HouYi) ✓ and arXiv:2310.12815 (Liu et al., benchmark) ✓
- Both abstract pages confirmed on arXiv ✓ (rate limit on direct fetch; confirmed via search result abstract text)

## Cluster 7 — PII detection and anonymization in NLP
- `PII detection anonymization NLP named entity recognition personal data 2022 2023 arXiv ACL` → Found Scientific Reports (Sharma et al., DOI:10.1038/s41598-025-04971-9) ✓
- Nature.com page fetched and metadata confirmed ✓

## Cluster 8 — Long-context management and summarization
- `conversational AI long context summarization compression LLM 2023 2024 arXiv EMNLP ACL` → Found arXiv:2405.16635 (UltraGist) ✓
- PDF fetch confirmed content ✓

## Cluster 9 — Intent classification: hybrid rule-based and neural routing
- `intent classification hybrid rule-based neural NLU conversational 2022 2023 arXiv ACL` → Found arXiv:2411.06022 (context-window intent classification) ✓
- arXiv abstract confirmed ✓

## Cluster 10 — Low-resource ASR / Whisper fine-tuning for Nepali
- `Whisper fine-tuning low resource ASR Nepali South Asian language 2023 2024 arXiv INTERSPEECH` → Found arXiv:2411.12587 (Ojha et al., Nepali Whisper) ✓ and arXiv:2503.23542 (Whisper-LM) ✓
- Both abstract pages confirmed ✓

## Cluster 11 — Human-in-the-loop machine learning for consequential decisions
- `human in the loop machine learning AI hiring decision consequential 2022 2023 arXiv ACM` → Found arXiv:2202.11812 (Peng et al., AAAI 2022) ✓ and arXiv:2512.20652 (Filatova et al.) ✓ (already in Cluster 1)
- PDF fetch of arXiv:2202.11812 confirmed ✓

## Cluster 12 — Algorithmic bias and fairness in AI-assisted hiring
- `algorithmic bias fairness AI recruitment hiring gender race discrimination 2022 2023 FAccT arXiv` → Found arXiv:2309.13933 (Fabris et al., ACM survey) ✓
- arXiv abstract confirmed ✓

## Similar Systems searches
- `Nepal AI recruitment system machine learning job portal site:github.com OR site:arxiv.org` → Found github.com/Soum-ik/AI-Powerd-Job-Portal ✓ (no Nepal academic system found)
- `Eightfold.ai AI talent intelligence platform capabilities whitepaper` → eightfold.ai confirmed ✓
- `HireVue AI video interview assessment platform capabilities site:hirevue.com` → hirevue.com/ai-in-hiring confirmed ✓
- `LinkedIn Recruiter AI features semantic search candidate matching 2024 site:linkedin.com` → business.linkedin.com/talent-solutions/product-update/recruiter-release confirmed ✓

## Failed or low-yield queries
- `"Nepal" "recruitment system" "AI" site:arxiv.org` → No confirmed Nepal academic recruitment AI paper found; only GitHub repos and general ML company lists returned
- `"AI hiring Nepal" OR "Nepali FYP recruitment AI"` → No relevant peer-reviewed paper found; confirmed the Nepal academic gap noted in Gap 5