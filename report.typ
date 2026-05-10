#import "@preview/mmdr:0.2.2": mermaid

#set document(
  title: "ConvexHire: An AI-Augmented Recruitment Ecosystem",
  author: "Author Name",
)

#set page(
  paper: "a4",
  margin: (top: 1in, bottom: 1in, left: 1.25in, right: 1.25in),
  numbering: "1",
  number-align: center,
)

#set text(
  font: "New Computer Modern",
  size: 11pt,
  lang: "en",
)

#set par(
  justify: true,
  leading: 0.65em,
  first-line-indent: 1.5em,
)

// Heading numbering and spacing - academic style
#set heading(numbering: "1.1.1")

#show heading.where(level: 1): it => {
  pagebreak(weak: true)
  v(1em)
  block(text(size: 18pt, weight: "bold", it))
  v(0.6em)
}

#show heading.where(level: 2): it => {
  v(0.8em)
  block(text(size: 14pt, weight: "bold", it))
  v(0.3em)
}

#show heading.where(level: 3): it => {
  v(0.6em)
  block(text(size: 12pt, weight: "bold", it))
  v(0.2em)
}

#show heading.where(level: 4): it => {
  v(0.4em)
  block(text(size: 11pt, weight: "bold", style: "italic", it))
}

// Figure caption styling
#show figure.caption: it => {
  set text(size: 10pt)
  emph(it)
}

// Code block style
#show raw.where(block: true): it => {
  block(
    fill: rgb("#f4f4f4"),
    inset: 8pt,
    radius: 3pt,
    width: 100%,
    text(font: "DejaVu Sans Mono", size: 9.5pt, it),
  )
}

// TITLE PAGE
#page(numbering: none)[
  #set align(center)
  #v(0.6fr)

  #text(size: 22pt, weight: "bold")[
    ConvexHire
  ]

  #v(2em)
  #text(size: 13pt)[Final Year Project Report]

  #v(6em)
  #text(size: 12pt)[
    *Student Name*: Rahul Dev Banjara \
    *University ID*: 2407061 \
    *Supervisor*: Ms. Prakriti Regmi \
    *Reader*: Mr. Siman Giri \
    *Module*: Final Year Project
  ]


  #v(0.7fr)
  #text(size: 11pt)[Academic Year 2025 / 2026]
  #v(2em)
]

#set page(numbering: "i")
#counter(page).update(1)

#show outline.entry.where(level: 1): it => {
  v(0.6em, weak: true)
  strong(it)
}

#outline(
  title: [Table of Contents],
  indent: auto,
  depth: 3,
)

#pagebreak()

#outline(
  title: [List of Figures],
  target: figure.where(kind: image),
)

#pagebreak()

#outline(
  title: [List of Tables],
  target: figure.where(kind: table),
)

#pagebreak()

#heading(level: 1, numbering: none, outlined: true)[Acknowledgements]

I would like to express my sincere gratitude to my supervisor, fellow students,
and family for their support throughout the development of ConvexHire.

#pagebreak()

#set page(numbering: "1")
#counter(page).update(1)

// 1. ABSTRACT
#heading(level: 1, numbering: none, outlined: true)[Abstract]

ConvexHire is an AI-powered recruitment platform that streamlines end-to-end hiring for both job seekers and employers. Candidates leverage AI-driven resume import, profile building, and resume gap analysis to strengthen applications, while discovering relevant roles through hybrid semantic-keyword search. Recruiters automate job drafting, candidate evaluation, and intelligent shortlisting, with a conversational AI assistant for talent search and salary research. Interview recordings are transcribed using a fine-tuned Whisper model for accurate assessment. All AI-generated actions-from outreach emails to job edits-require explicit human approval, ensuring transparency and recruiter control. The platform maintains real-time application tracking with visible AI scores and feedback, creating a fair, efficient hiring pipeline where artificial intelligence augments human decision-making rather than replacing it.

#pagebreak()

// 2. INTRODUCTION
= Introduction

== Project Briefing


- End-to-end AI-augmented recruitment platform that automates and streamlines the full hiring lifecycle for recruiters and candidates.
- Integrates AI-driven tools for job description drafting, multimodal resume parsing, semantic job matching, and candidate screening.
- Built on a Human-in-the-Loop (HITL) architecture where all AI-generated insights and actions are subject to human review and final approval.
- Three user roles: candidates, recruiters, and company administrators.
- Candidates use AI resume import, profile building, resume gap analysis, and hybrid semantic job search.
- Recruiters use automated job drafting, multi-agent candidate shortlisting, a conversational AI assistant with live platform access, and interview transcription with AI evaluation.
- Company administrators govern team membership, company settings, and approval workflows.
- Every AI action, including shortlisting, outreach emails, and resume patches, requires explicit human confirmation before execution.
- Full-stack architecture: Next.js frontend, Python FastAPI backend, PostgreSQL primary store, Redis caching layer, Qdrant vector database, and LangChain/LangGraph AI orchestration.
- Role-based access control on every endpoint.
- Defence-in-depth guardrails: NVIDIA NeMo input rails, LangChain PII redaction, frozen-fact hallucination prevention, and structured-output schema validation.

=== AI Aspect


- ConvexHire employs a multi-modal AI stack spanning natural language processing, automatic speech recognition, generative AI, and agentic orchestration.

*NLP*
- Dense vector embeddings (Google Gemini, 3072 dimensions) encode job descriptions and resumes into a shared semantic space.
- Enables meaning-based retrieval instead of brittle keyword matching.
- Hybrid dense-plus-sparse pipeline combines embeddings with BM25 lexical scores via Reciprocal Rank Fusion.
- Queries like "Python backend" match by conceptual similarity while exact technical terms retain precision.
- Powers structured resume parsing via LlamaCloud extractor plus Groq normaliser.
- PII redaction via pattern-based detection of emails, URLs, and phone numbers.
- Prompt-injection defence via NeMo Guardrails input classifier.

*ASR*
- Interview audio transcribed by a Whisper Small model fine-tuned on Nepali speech corpora.
- Extends base multilingual Whisper to low-resource, code-switched English-Nepali dialogue.
- Fine-tuning objective is supervised cross-entropy minimisation on character-level transcripts.
- Achieves measurable Word Error Rate reductions compared with zero-shot Whisper on Nepali-accented and mixed-language interview speech.

*Generative AI*
- Groq-hosted LLaMA family models drive text generation: resume gap analysis, auto-patch rewriting, recruiter chat streaming, job-draft synthesis, and outreach email drafting.
- AWS Bedrock Claude handles heavier reasoning in the shortlisting multi-agent pipeline.
- All outputs constrained by Pydantic schemas, frozen-fact guardrails, and token-length caps to suppress hallucination.

*Agentic AI*
- LangGraph state machines orchestrate two principal workflows.
- AI Job Draft Assistant: Tavily web research, structured salary synthesis, schema-validated draft generation, human-review interrupt node, and refine cycles until recruiter approval.
- Shortlisting pipeline: multi-agent critique loop with CTO agent (technical depth), HR agent (fit and risk), Judge agent (confidence 0 to 100), and cheap final-merge agent (strengths, concerns, evidence).
- Recruiter chatbot: intent router dispatches to seven tool-equipped handlers (candidate search, job lookup, salary research, job edit, and others).

==== Learning Justification


- The ConvexHire AI layer combines supervised learning and zero-shot or few-shot large-language-model reasoning.
- Hybridisation is justified by distinct cost, data, and reliability requirements of each task.

*Supervised Learning*
- Two subsystems rely on task-specific models trained on labelled data.
- Shortlisting ML pre-filter: scikit-learn RandomForest trained on historical hire/no-hire labels.
- Three deterministic features: years-of-experience match, skills-overlap ratio, and resume-to-JD cosine similarity.
- Appropriate because feature space is low-dimensional, labels are verifiable post-hoc, and inference is deterministic and cheap at scale (scores hundreds of resumes in milliseconds without API cost).
- Whisper Small fine-tuning for Nepali ASR: supervised learning from paired audio and transcript labels to minimise character error rate.

*Zero-Shot and Few-Shot LLM Reasoning*
- Majority of AI tasks operate without task-specific training data: resume gap analysis, multi-agent shortlisting critique, recruiter chat, job-draft synthesis, and outreach drafting.
- Characterised by open-ended natural-language inputs and evolving job-description vocabularies.
- LLMs provide zero-shot generalisation via pre-trained world knowledge and in-context exemplars.
- Judge agent requires no labelled corpus; it reads structured persona evaluations and applies general reasoning about confidence and evidence quality.
- Resume gap analyser scores a resume against an arbitrary JD using only textual content and a system prompt.
- Zero-shot flexibility is essential because every job description is unique and every candidate profile is non-stationary.

*Cascade Principle*
- Architectural decision routes easy cases through cheap supervised model (RandomForest) and reserves expensive zero-shot reasoning (multi-agent LLM) for the most promising candidates.
- Implements the cascade principle proven by Ong et al. to be cost-optimal under quality constraints.
- Reduces per-job AI expenditure by approximately 80% compared with a naive all-LLM pipeline.

==== Mathematics


- Three constructs underpin core AI components: vector-space similarity, Reciprocal Rank Fusion, and Word Error Rate.

*Cosine Similarity*
- Job descriptions and resumes embedded as high-dimensional vectors $A, B in RR^n$ (Gemini, $n = 3072$).
- Cosine similarity measures the cosine of the angle between vectors, normalising for magnitude so document length does not dominate.
- Formula:

$ "CosineSimilarity" = (A dot B) / (||A|| dot ||B||) = (sum_(i=1)^n A_i B_i) / (sqrt(sum_(i=1)^n A_i^2) dot sqrt(sum_(i=1)^n B_i^2)) $

- Bounded in $[-1, 1]$; in practice $[0, 1]$ because text embeddings are non-negative.
- Used as one of three features in the RandomForest pre-filter and as the dense component in hybrid candidate search.

*Reciprocal Rank Fusion (RRF)*
- Combines dense semantic rankings with sparse lexical rankings.
- Rank-based aggregation that requires no score calibration between modalities.
- Formula:

$ "RRF"(d) = sum_(k=1)^K 1 / (k + r_k(d)) $

- $k$ is a constant (typically $k = 60$) that dampens influence of low ranks and prevents dominance by any single stream.
- Documents appearing in both dense and sparse top-$K$ sets receive higher fused scores.

*RandomForest Split Criterion*
- RandomForest minimises Gini impurity at each split node.
- For a node with class distribution $p = (p_1, dots, p_C)$ over $C$ classes.
- Formula:

$ "Gini"(p) = 1 - sum_(i=1)^C p_i^2 $

- Forest averages predictions over $T$ decision trees trained on bootstrap samples with random feature subsets.
- Formula:

$ P("hire" | x) = 1/T sum_(t=1)^T p_t("hire" | x) $

- $p_t$ is the leaf-node class probability from tree $t$ for input feature vector $x$.
- Top-20% percentile threshold applied to gate progression to the LLM stage.

*Word Error Rate (WER)*
- Fine-tuned Whisper evaluated against held-out Nepali transcripts.
- Formula:

$ "WER" = (S + D + I) / N $

- $S$ = substitutions, $D$ = deletions, $I$ = insertions, $N$ = total reference words.
- Standard ASR benchmarking metric.
- Supervised fine-tuning on in-domain Nepali audio reduces WER by adapting to regional phonetics and code-switched utterances.

== Aims


- Primary aim is to design, build, and evaluate an AI-augmented recruitment platform that reduces time-to-hire and administrative burden while preserving human judgment, candidate transparency, and ethical accountability at every stage of the hiring funnel.

== Objectives


- *Implement an AI screening agent* to score and rank candidates against job requirements, combining a supervised ML pre-filter with a multi-agent LLM deep-review pipeline that produces explainable strengths, concerns, and evidence for every decision.
- *Build an AI resume importer* to extract structured profile data from uploaded PDF resumes using a LlamaCloud structured extractor and Groq normaliser, enabling candidates to populate complete profiles from a single document upload.
- *Develop a resume gap analysis module* to compare a candidate's resume against a specific job description, returning a 0 to 100 shortlisting likelihood score, severity-annotated gaps, and actionable improvement suggestions; and provide an auto-patch feature that rewrites headline, summary, and experience bullets subject to frozen-fact immutability and explicit candidate confirmation.
- *Create a recruiter AI chat assistant* with persistent sessions, multi-turn memory, and live tool access to platform data, enabling semantic candidate search, job lookup, salary research, and field-level job editing with before/after previews and human confirmation.
- *Enable an AI job draft assistant* with real-time market salary research (Tavily web search plus Groq synthesis), schema-validated generation, and an iterative human-review loop that allows recruiters to lock fields, regenerate selected sections, and approve the final draft before publication.
- *Ensure AI outputs are explainable and no action executes without human confirmation* by surfacing structured rationale for every shortlisting decision, requiring recruiter approval for all outreach emails and job edits, and staging resume patches in a pending state until the candidate explicitly accepts.
- *Engineer a full-stack system with proper role-based access control* separating candidates, recruiters, and company administrators; enforce JWT authentication with httpOnly refresh tokens, email verification, and soft-delete account management.
- *Fine-tune an ASR model* on Nepali speech corpora to transcribe English-Nepali code-switched interview audio with reduced Word Error Rate compared with zero-shot Whisper, supporting inclusive assessment of candidates from low-resource linguistic backgrounds.

== Artefact

=== FDD

 FDD figure + seven-subsystem decomposition.

#figure(
  mermaid("
graph TD
    CH[ConvexHire<br/>AI-Augmented Recruitment]
    CH --> S1[Auth, User &<br/>Company Mgmt]
    CH --> S2[ML & Multi-Agent<br/>Shortlisting]
    CH --> S3[Recruiter Chatbot<br/>with RAG]
    CH --> S4[Resume Parsing<br/>& Gap Analysis]
    CH --> S5[ASR Interview<br/>Transcription & Scoring]
    CH --> S6[Job Drafting<br/>& Hybrid Search]
    CH --> S7[Outreach &<br/>Interview Scheduling]

    style CH fill:#1e3a5f,stroke:#0a1a2e,color:#fff
    style S1 fill:#e8f0f8,stroke:#1e3a5f,color:#1e3a5f
    style S2 fill:#e8f0f8,stroke:#1e3a5f,color:#1e3a5f
    style S3 fill:#e8f0f8,stroke:#1e3a5f,color:#1e3a5f
    style S4 fill:#e8f0f8,stroke:#1e3a5f,color:#1e3a5f
    style S5 fill:#e8f0f8,stroke:#1e3a5f,color:#1e3a5f
    style S6 fill:#e8f0f8,stroke:#1e3a5f,color:#1e3a5f
    style S7 fill:#e8f0f8,stroke:#1e3a5f,color:#1e3a5f
  "),
  caption: [Feature Decomposition Diagram of ConvexHire],
) <fig:fdd>

== Academic Question


*How can AI improve recruitment efficiency while maintaining transparency and human oversight?*

- Frames the central tension between the capacity of LLMs, dense retrieval, and multi-agent systems to accelerate screening, drafting, and evaluation, and the documented risks of opacity, bias, and automation bias in algorithmic hiring.
- Answered architecturally by embedding Human-in-the-Loop checkpoints at every AI action boundary: shortlisting drafts await recruiter approval, outreach emails sit in a review queue, job edits display a before/after diff, and resume patches are staged for candidate confirmation.
- Explainability enforced through structured output schemas: every shortlisting produces explicit strengths, concerns, and cited evidence; every gap analysis labels missing skills by severity; and every rejection email embeds specific AI feedback.
- Result is measurable improvement in screening speed and candidate transparency, with all AI decisions auditable, explainable, and human-confirmed before execution.
- HITL design ensures the platform is trustworthy, not merely efficient.

// 3. SOFTWARE REQUIREMENTS SPECIFICATION
= Software Requirements Specification (SRS)

== Introduction

=== Purpose


=== Scope


=== Definitions, Acronyms, and Abbreviations

 MAS, RAG, NER, HITL, PII, ASR.

== Overall Description

=== Product Perspective


=== User Classes and Characteristics

 Candidate / Recruiter / Company Administrator.

=== Design and Implementation Constraints

 regional language, multi-tenancy, observability.

== System Features (Subsystems)

=== Subsystem 1 Authentication, User Management and Company Management

ConvexHire uses a dual-path authentication system supporting both local email-password registration and Google OAuth. Every signup requires email verification before the account becomes active. Role selection happens at registration time candidates sign up directly, while recruiters and company administrators must complete a company affiliation step (either registering a new company or requesting to join an existing one) before their verification email is dispatched. Upon login, the system issues a short-lived JWT access token and a long-lived refresh token stored in an httpOnly cookie to protect against XSS attacks. Role-based access control gates every protected endpoint, with distinct permissions for candidates, recruiters, and company admins. Recruiter join requests start in a pending state and require explicit admin approval before the user can access company resources.

=== Subsystem 2 Machine Learning based and Multi Agent Shortlisting

 RandomForest ML bouncer pre-filter, top-20% LLM multi-agent evaluation, two-stage pipeline.

=== Subsystem 3 Recruiter Chatbot with Agentic RAG

 intent classification, tool-use agent, semantic candidate search, job editing, salary research, conversation summarization, SSE streaming.

=== Subsystem 4 AI Resume Parsing and Job Fit Gap Analysis

 PDF extraction, Llama Cloud/Gemini structured parsing, resume gap analysis, auto-patch with human approval.

=== Subsystem 5 Fine-Tuned ASR for Interview Transcription and Scoring

 Whisper Small fine-tuning for Nepali-English code-switching, S3 audio pipeline, transcript evaluation, hybrid ranking.

=== Subsystem 6 AI Job Drafting and Hybrid Semantic Search

 LangGraph job drafting agent, salary benchmarking, hybrid dense+sparse retrieval with RRF fusion.

=== Subsystem 7 AI Outreach Drafting and Interview Scheduling

 AI email draft generation with human approval, Cal.com API integration, webhook-driven booking status.

== Non-Functional Requirements

=== Performance Requirements


=== Security Requirements


=== Software Quality Attributes


== External Interface Requirements

=== User Interfaces


=== Software Interfaces


=== Wireframes


== Analysis Models

=== Data Model (ERD)


#figure(
  rect(width: 100%, height: 4cm, stroke: 0.5pt + gray)[#align(center + horizon)[_ERD placeholder_]],
  caption: [Entity-Relationship Diagram],
) <fig:erd>

=== Behavioral Models

 LangGraph StateGraphs and sequence diagrams.

// 4. LITERATURE REVIEW
= Literature Review

Recruitment has always been one of most labour-intensive processes in any organisation. With hundreds of applications arriving for single role, hiring teams face the impossible task of evaluating every candidate fairly and consistently within limited time. The rise of large language models, dense vector retrieval, and multi-agent AI systems have started to shift what is possible. This review examines the key research threads that underpin the design of ConvexHire, and analyses similar existing systems to identify the gaps this project aims to address.

== AI in Talent Acquisition and Automated Screening

Automated candidate screening has moved rapidly from rule-based keyword matching to LLM-powered evaluation. Lo et al. [1] constructed a four-agent RAG-augmented pipeline for resume screening and showed the system could match the scoring quality of experienced HR professionals, something that earlier single-model approaches consistently failed to achieve at scale. Filatova et al. [13] demonstrated similar gains in a study of 64 real applicants, finding that an AI-assisted pipeline processed candidates in roughly half the time of an expert human recruiter, while still preserving human judgment at the final decision stage.

However the efficiency gains come with well-documented risks. Fabris et al. [10], in comprehensive survey of over 250 algorithmic hiring tools, found that even when protected attributes like gender and ethnicity are removed from the input, features such as university name and company brand act as proxies and reproduce the same discriminatory patterns through indirect correlations. They note that the EU AI Act now classifies hiring AI as high-risk, requiring meaningful transparency and auditability of the decision process. Peng et al. [9] compound this concern their AAAI study found that people in hybrid human-AI hiring settings show strong decision conformity, meaning they tend to follow the AI recommendation even when it is incorrect, meaning that poorly designed human-in-the-loop workflows are not necessarily safer than full automation.

== Resume Analysis, Semantic Matching, and Hybrid Retrieval

Early resume processing relied on keyword matching, which failed to capture semantic equivalences across domain vocabulary. The move to transformer-based embeddings changed this significantly. Rosenberger et al. [2] developed CareerBERT, which maps both resumes and job descriptions into a shared embedding space using BERT and evaluates match quality through cosine similarity. Their system outperformed TF-IDF and vanilla BERT baselines in both application metrics and human expert evaluation, confirming that domain-adapted dense embeddings provide the right foundation for semantic candidate-job matching.

However CareerBERT has no exact-match fallback for precise technical terms, since searching for a specific certification or library name requires lexical precision that pure dense retrieval lacks. Hsu and Tzeng [3] address this directly with the DAT framework, demonstrating that combining BM25 sparse retrieval with dense vector retrieval consistently outperforms either method alone across multiple retrieval benchmarks. The key insight is that semantic understanding and lexical precision are complementary capabilities, not competing ones, which directly motivates the hybrid Qdrant dense + BM25 design used in ConvexHire for both job discovery and recruiter candidate search.

== Multi-Agent and Multi-Persona LLM Architectures

A foundational insight from recent LLM research is that multiple agents reasoning together and critiquing each other's outputs outperform any single agent on complex tasks. Du et al. [5], in work presented at ICLR, showed through controlled experiments that multi-agent debate, where agents propose answers independently, exchange critiques, and iterate across rounds, which substantially improved factual accuracy on arithmetic, reasoning, and biographical tasks. The mechanism is that disagreement surfaces errors which individual models consistently miss when reasoning alone.

Lo et al. [1] applied this to resume screening and found the multi-agent approach matched HR professional quality. Filatova et al. [13] showed that assigning distinct roles to specialist agents, specifically a technical evaluator and a culture-fit evaluator, produced richer, more trustworthy rationales than single-prompt scoring. Both papers also acknowledge the cost problem each additional critique iteration multiplies inference cost proportionally, and this remain unaddressed in the published work. This gap directly motivated the Judge Agent's confidence-threshold early-exit (≥70%, max two iterations) in ConvexHire.

== Cost-Efficient AI Pipelines

Sending every resume to a large LLM is economically prohibitive at hiring scale. Ong et al. [4] formalise this, proving through linear programming that cascade routing, which directs easy rejects through a lightweight gate before the expensive model, is the optimal strategy under quality constraints. The RandomForest pre-filter in ConvexHire implements this principle three deterministic features (years-of-experience match, skills-overlap ratio, cosine similarity via fastembed) are used to calibrate a percentile threshold that eliminates approximately 80 percent of LLM calls entirely, with cost savings validated by the theoretical result in [4].

For the conversational AI layer, research on intent classification [11] confirms that rule-based classifiers handling the majority of high-confidence inputs at zero cost, with LLM fallback only for the ambiguous tail, is both practical and effective. This is consistent with the intent router design in ConvexHire, where keyword rules handle around 80 percent of recruiter messages for free.

== Security and Privacy in AI Pipelines

Integrating LLMs into recruitment pipelines creates attack surfaces that traditional software does not have. Liu et al. [6] formalise and benchmark prompt injection attacks using the HouYi framework, demonstrating that attacker-controlled content embedded in a document can override system instructions in majority of tested LLM applications. In hiring context, resume bodies are the primary indirect injection vector a candidate can embed malicious instructions into their CV text attempting to manipulate the shortlisting model. Liu et al. [14] extend this with formal taxonomy across 36 applications and explicitly recommend defence-in-depth because no single defence achieves robust protection on its own. Sharma et al. [7] separately show that hybrid rule-NER pipelines achieve 91.1% F1 for PII detection in unstructured documents, validating the precision of pattern-based redaction strategies. Together these findings motivated the stacked defence in ConvexHire NeMo Guardrails at every LLM entry point, plus PIIMiddleware redacting identifying information before any shortlisting model processes the resume.

== Multilingual and Low-Resource Speech Recognition

Whisper is the current frontier of multilingual ASR, but its training data is heavily skewed toward high-resource languages and its zero-shot performance on low-resource languages like Nepali is substantially degraded. Ojha et al. [8] address this directly, constructing a comprehensive dataset from publicly available Nepali speech corpora and fine-tuning Whisper across multiple model sizes. Their results confirm that supervised fine-tuning on target-language data produces substantial WER reductions, with a smaller fine-tuned model consistently outperforming larger zero-shot Whisper on Nepali. They also note that code-switched speech (English mixed with Nepali) was not systematically addressed, which is a remaining open problem. Whisper-LM [15] further shows that language-model rescoring can reduce WER additionally, though at the cost of inference latency that is unsuitable for real-time interview transcription workflows.

== Human-in-the-Loop AI for Consequential Decisions

The empirical case for human oversight in high-stakes AI decisions is well established. Peng et al. [9] show that AI assistance improves human accuracy in hybrid hiring decisions when the AI model is well-designed, but that conformity effects can cause humans to accept incorrect recommendations without questioning them, especially when only a score is shown rather than the underlying reasoning. Filatova et al. [13] show that keeping a human final decision-maker in an AI hiring pipeline preserves accountability while still delivering meaningful efficiency gains compared to manual review. Both studies argue that transparency into AI reasoning is not a nice-to-have but a necessary condition for human oversight to function as intended, which directly informed ConvexHire's design of surfacing structured evidence alongside every shortlisting recommendation.

== Similar Systems

=== Nepal-Based Systems

The most directly comparable Nepal-origin system found in the literature is an open-source AI-Powered Job Portal (Soum-ik/AI-Powerd-Job-Portal on GitHub) [S5]. It allows recruiters to generate job descriptions using a generative AI model and provides role-based access for candidates and recruiters. However, it offers no candidate screening, no semantic search, no interview transcription, and no multi-agent evaluation. It covers approximately one of the fifteen AI components present in ConvexHire, which confirms that no Nepal-built system at time of writing addresses the full AI-assisted hiring funnel.

=== Commercial Platforms

Eightfold.ai [S1] is the most technically sophisticated commercial platform available, built on deep learning models trained across 1.6 billion career profiles with inferred skill taxonomies. It uses embedding-based semantic matching and has recently added agentic capabilities for autonomous task execution. Despite this technical depth, Eightfold functions as a closed-loop system for recruiters candidates have no visibility into why they were ranked, and the decision logic is not auditable by the people it affects [10]. There is no documented multi-agent critique loop, no Nepali ASR, and no evidence of prompt injection defence.

HireVue [S3] processes video interviews at scale using NLP models trained on over 70 million assessments, scoring responses against competency frameworks validated by IO psychologists. Its scoring uses single model rather than multi-persona critique, its ASR pipeline targets English-dominant markets with no documented support for low-resource South Asian languages, and candidates receive no feedback on their performance after assessment.

LinkedIn Recruiter [S4] (2024 release) introduced natural-language candidate search and AI-drafted outreach, reporting meaningful improvements in candidate response rates. However its candidate pool is limited to LinkedIn members, it offers no multi-agent shortlisting or interview evaluation, and no HITL confirmation exists at the per-candidate decision level.

=== Research Prototypes

Filatova et al. [13] describe an academic multi-agent hiring prototype with HITL validation, evaluated on 64 real applicants and achieving near-50% efficiency gain over human expert reviewers. It is the closest architectural analogue to ConvexHire in the academic literature. However it lacks an ML pre-filter (every candidate goes to the full LLM pipeline, which is prohibitive at scale), has no prompt injection defence, no PII redaction, and no semantic search for candidate discovery.

== Gap Analysis

Three primary gaps emerge clearly from this review.

The first is the _explainability gap_. Commercial systems like Eightfold, LinkedIn Recruiter, and HireVue produce scores without justification that is visible to candidates or auditable by recruiters. Fabris et al. [10] identify this as both an ethical problem and an emerging legal requirement under EU AI regulation. Lo et al. [1] propose evidence-linked multi-agent evaluation as the structural solution. ConvexHire addresses this by requiring every shortlisting agent to produce structured strengths, concerns, and cited evidence, surfacing these to both recruiter and candidate, and embedding specific AI feedback in rejection emails.

The second is the _candidate feedback gap_. Tools like Teal and Jobscan give candidates generic improvement advice disconnected from any specific employer's actual evaluation criteria. Paradox engages candidates conversationally at the top of funnel but evaluates nothing of substance. No system reviewed here combines in-context gap analysis against a real job description with constraint-safe AI resume patching (Frozen Facts) and structured post-shortlist feedback in one integrated candidate flow.

The third is the _integration gap_. No single platform reviewed integrates semantic job search, ML-gated multi-agent shortlisting, low-resource ASR for interview transcription, AI outreach drafting, and a recruiter AI assistant into one coherent pipeline. This gap is specially pronounced for non-English linguistic contexts, since no commercial or academic system reviewed addresses Nepali or code-switched interview transcription [S5], which is the specific challenge that motivated the Whisper fine-tuning work in ConvexHire.

// 5. PROJECT METHODOLOGY
= Project Methodology

== Framework Justification (Kanban)


== High-level Gantt Chart

#figure(
  rect(width: 100%, height: 3.5cm, stroke: 0.5pt + gray)[#align(center + horizon)[_Gantt chart placeholder_]],
  caption: [High-level Gantt Chart],
) <fig:gantt-hl>

// 6. TOOLS AND TECHNOLOGIES
= Tools and Technologies

#figure(
  table(
    columns: (auto, 1fr),
    align: (left, left),
    stroke: 0.5pt,
    table.header([*Category*], [*Tools*]),
    [Frontend Framework], [Next.js (App Router), React, TypeScript, SCSS],
    [Backend Framework], [FastAPI, Pydantic],
    [Database], [PostgreSQL, SQLAlchemy, Alembic (migrations)],
    [Vector / Cache], [Qdrant (dense + sparse), fastembed, Redis],
    [AI Orchestration], [LangChain, LangGraph],
    [LLM Providers], [Groq, AWS Bedrock, Google Gemini],
    [Web Search / Retrieval], [Tavily],
    [Document Parsing], [Llama Cloud],
    [ASR], [Fine-tuned Whisper Small],
    [ML], [scikit-learn (RandomForest bouncer)],
    [Guardrails / Safety], [NVIDIA NeMo Guardrails, LangChain `PIIMiddleware`],
    [Observability], [LangSmith],
    [AWS SDK], [Boto3],
    [Media Storage], [Amazon S3],
    [Email / Scheduling], [aiosmtplib, Cal.com API],
    [PDF / Templating], [WeasyPrint, Jinja2],
    [Rate Limiting], [fastapi-limiter],
    [Containerization], [Docker],
    [Deployment], [Render, Vercel],
    [IDE], [Visual Studio Code, Cursor],
    [Version Control], [Git],
    [Testing], [PyTest],
    [Package Manager], [pnpm, uv],
  ),
  caption: [Technology stack overview],
) <tbl:tech-stack>

 justification paragraph for the chosen stack.

// 7. ARTEFACT DESIGNS
= Artefact Designs

== Subsystem 1 Authentication, User Management and Company Management

The activity diagram for authentication and user management flow is shown below. Users can sign up locally or via Google OAuth. All new accounts require email verification. Candidates are created immediately after verification, while recruiters must either register a new company or request to join an existing one before their account is activated. Recruiter join requests remain pending until approved by a company admin. Login issues a short-lived JWT access token and a long-lived refresh token stored in an httpOnly cookie. The refresh token is rotated on every use and can be revoked by changing the password. Profile management includes updating personal details, uploading an avatar, changing the password, or soft-deleting the account. Company administrators can update company profiles, manage recruiters, and approve or reject pending join requests.

#figure(
  mermaid("
graph TD
    A([Start]) --> B{User Action}

    B -->|Local Signup| C{Role?}
    B -->|Google OAuth| D[Redirect to Google]
    B -->|Login| E[Enter credentials]
    B -->|Forgot Password| F[Send reset email]

    C -->|Candidate| G[Send verification email]
    C -->|Recruiter/Admin| H[Complete company step first]

    G --> I[User verifies email]
    I --> J[Account ready]

    H --> K{Company Action}
    K -->|Register Company| L[Enter company details]
    K -->|Join Company| M[Request to join]
    L --> N[Send verification email]
    M --> N
    N --> O[User verifies email]
    O --> P[Account created<br/>Membership: pending/active]

    D --> Q{Account exists?}
    Q -->|Yes| R[Login + link OAuth]
    Q -->|No| S{Role?}
    S -->|Candidate| T[Create account + login]
    S -->|Recruiter/Admin| H

    E --> U[Validate credentials]
    U --> V[Create JWT tokens<br/>Set httpOnly cookie]
    V --> W[Return access token]

    F --> X[User clicks reset link]
    X --> Y[Update password]

    P --> Z[Admin approves/rejects<br/>recruiter requests]
  "),
  caption: [Authentication, User Management and Company Management - activity diagram],
) <fig:auth-activity>

#figure(
  mermaid("
classDiagram
    class User {
        +UUID id
        +String full_name
        +String email
        +String password_hash
        +String avatar_url
        +Boolean is_email_verified
        +Boolean is_onboarded
        +UserRole primary_role
        +String email_verify_token
        +String password_reset_token
        +DateTime created_at
    }

    class Company {
        +UUID id
        +String name
        +String logo_url
        +String website_url
        +String cal_booking_url
        +String cal_organizer_email
        +String domain
        +String industry
        +String location
        +DateTime created_at
    }

    class CompanyMembership {
        +UUID id
        +UUID user_id
        +UUID company_id
        +MembershipRole role
        +MembershipStatus status
        +String job_title
        +DateTime created_at
    }

    class RefreshToken {
        +UUID id
        +UUID user_id
        +String token
        +String jti
        +DateTime expires_at
        +DateTime created_at
    }

    User --> CompanyMembership : has
    Company --> CompanyMembership : has
    User --> RefreshToken : has
  "),
  caption: [Authentication, User Management and Company Management - class diagram],
) <fig:auth-class>

#figure(
  mermaid("
sequenceDiagram
    participant User
    participant API
    participant DB
    participant EmailService
    participant OAuth

    User->>API: POST /signup

    alt Google OAuth
        User->>OAuth: Google OAuth
        OAuth-->>API: OAuth token
        API->>DB: Create or link user
        DB-->>API: User created
    else Local signup
        API->>DB: Create user
        DB-->>API: User created

        alt Candidate
            API->>EmailService: Send verification email
            EmailService-->>API: Sent
        else Recruiter/Admin
            API->>DB: Create setup token
            DB-->>API: Token created
            API->>EmailService: Send setup email
            EmailService-->>API: Sent
        end
    end

    API-->>User: Return signup data

    Note over User,DB: Email verification / Company setup

    User->>API: POST /verify-email
    API->>DB: Verify token
    DB-->>API: Token valid

    alt Recruiter creating company
        API->>DB: Create company
        DB-->>API: Company created
        API->>DB: Create admin membership
        DB-->>API: Membership created
    else Recruiter joining company
        API->>DB: Create pending membership
        DB-->>API: Membership created
    else Candidate
        API->>DB: Mark user verified
        DB-->>API: Verified
    end

    API-->>User: Verification complete

    User->>API: POST /login
    alt Google OAuth
        User->>OAuth: Google OAuth
        OAuth-->>API: OAuth token
        API->>DB: Find or create user
        DB-->>API: User found
    else Local login
        API->>DB: Validate credentials
        DB-->>API: User found
    end
    API->>DB: Create refresh token
    DB-->>API: Token created
    API->>API: Generate JWT tokens
    API-->>User: Return access token
  "),
  caption: [Authentication, User Management and Company Management - sequence diagram],
) <fig:auth-sequence>

== Subsystem 2 Machine Learning based and Multi Agent Shortlisting

 RandomForest feature extraction diagram + two-stage pipeline sequence + LangGraph StateGraph.

To keep shortlisting fair, the system removes personal details from resumes before AI reads them - names, emails, phone numbers, and links are stripped out or redacted. The AI is also told clearly to judge only on skills and experience, ignoring age, gender, nationality, or school reputation. More details are in the *PII Redaction and Bias Mitigation* section under security testing.

#figure(
  mermaid("
graph TD
    A([Start]) --> B{Job Trigger}

    B -->|Apply with auto-shortlist| C[ML Pre-filter scores resume]
    B -->|Job expires| D[Two-stage pipeline]
    B -->|Manual trigger| E[Batch evaluation]

    C --> F{Score in top 20%?}
    F -->|No| G[Status: applied<br/>No LLM cost]
    F -->|Yes| H[Queue for LLM<br/>when job expires]

    D --> I[Stage 1: ML Pre-filter<br/>Score all applications]
    I --> J[Stage 2: Top 20% to LLM]

    J --> K[Technical Agent<br/>Technical evaluation]
    J --> L[HR Agent<br/>Fit evaluation]

    K --> M[Critique Node<br/>Judge confidence]
    L --> M

    M --> N{Confidence >= 70%?}
    N -->|Yes| O[Final Node<br/>Merge results]
    N -->|No| P[Feedback loop<br/>Retry agents]

    P --> K
    P --> L

    O --> Q[Save strengths/concerns<br/>to application]

    E --> R[ML Pre-filter + LLM<br/>for selected apps]
    R --> Q

    Q --> S[Threshold finalize]
    S --> T{Score >= threshold?}
    T -->|Yes| U[Status: shortlisted]
    T -->|No| V[Status: rejected]

    U --> W[Draft outreach email]
    V --> X[Draft rejection email<br/>with AI feedback]
  "),
  caption: [ML & Multi-Agent Shortlisting - activity diagram],
) <fig:ml-shortlisting>

#figure(
  mermaid("
classDiagram
    class Job {
        +UUID id
        +UUID company_id
        +UUID posted_by
        +String title
        +String location
        +LocationType location_type
        +Integer salary_min
        +Integer salary_max
        +JobStatus status
        +Boolean auto_shortlist
        +ShortlistStatus shortlist_status
        +Integer shortlist_threshold
        +Boolean final_shortlist_completed
        +DateTime expires_at
        +Array requirements
        +Array responsibilities
    }

    class Application {
        +UUID id
        +UUID job_id
        +UUID user_id
        +UUID resume_id
        +Integer score
        +Array strengths
        +Array weaknesses
        +Float ml_bouncer_score
        +ApplicationStatus status
        +DateTime created_at
    }

    class JobSyncEvent {
        +UUID id
        +UUID job_id
        +SyncAction action
        +SyncStatus status
        +String error_message
        +DateTime created_at
    }

    Job --> Application : has
    Job --> JobSyncEvent : has
  "),
  caption: [ML & Multi-Agent Shortlisting - class diagram],
) <fig:ml-shortlisting-class>

#figure(
  mermaid("
sequenceDiagram
    participant Candidate
    participant API
    participant DB
    participant MLModel
    participant LLMService

    Candidate->>API: POST /apply
    API->>DB: Create application
    DB-->>API: Application created

    alt Auto-shortlist enabled
        API->>MLModel: Score resume
        MLModel-->>API: ML score
        API->>DB: Update ML score
    end

    Note over API,DB: Job expires

    API->>DB: Fetch applications
    DB-->>API: Applications list

    API->>MLModel: Score missing applications
    MLModel-->>API: ML scores
    API->>DB: Update ML scores

    API->>API: Select top 20%
    API->>LLMService: Deep review
    LLMService-->>API: Evaluation results
    API->>DB: Save strengths/concerns

    API->>API: Apply threshold
    API->>DB: Update status
    API->>DB: Create email draft
  "),
  caption: [ML & Multi-Agent Shortlisting - sequence diagram],
) <fig:ml-shortlisting-sequence>

== Subsystem 3 Recruiter Chatbot with Agentic RAG

 intent routing diagram + tool-use sequence + SSE streaming architecture.

#figure(
  mermaid("
graph TD
    A([Start]) --> B[Recruiter sends message]

    B --> C[Auth check]
    C --> D[Rate limit check]

    D --> E{Duplicate message?}
    E -->|Yes| F[Return cached response]
    E -->|No| G[Prompt injection guardrail<br/>block malicious input]

    G --> H[Append to history]

    H --> I{History > 40 messages?}
    I -->|Yes| J[Summarize old turns]
    I -->|No| K[Keep history]

    J --> K

    K --> L[Intent router]

    L --> M{Rule-based match?}
    M -->|Yes| N[Direct handler<br/>zero cost]
    M -->|No| O[AI classifier<br/>structured JSON]

    N --> P[Execute intent]
    O --> P

    P --> Q{Intent type?}

    Q -->|search_candidates| R[Hybrid search<br/>dense + sparse]
    Q -->|lookup_candidate| S[Fetch application details]
    Q -->|salary_research| T[Web search<br/>24h cache]
    Q -->|list_jobs| U[Fetch company jobs]
    Q -->|lookup_job| V[Fuzzy job match]
    Q -->|edit_job| W[14-field allowlist<br/>preview + confirm]
    Q -->|chat| X[General conversation]

    R --> Y[Stream SSE response]
    S --> Y
    T --> Y
    U --> Y
    V --> Y
    W --> Y
    X --> Y

    Y --> Z[Save state<br/>increment version]
    Z --> AA[Cache for retry]
  "),
  caption: [Recruiter Chatbot with Agentic RAG - activity diagram],
) <fig:recruiter-chat>

#figure(
  mermaid("
classDiagram
    class RecruiterChatSession {
        +UUID id
        +UUID recruiter_id
        +UUID company_id
        +String thread_id
        +String title
        +DateTime last_interaction_at
        +Dict state_json
        +DateTime created_at
    }
  "),
  caption: [Recruiter Chatbot with Agentic RAG - class diagram],
) <fig:recruiter-chat-class>

#figure(
  mermaid("
sequenceDiagram
    participant Recruiter
    participant API
    participant Cache
    participant AI
    participant DB
    participant Search

    Recruiter->>API: POST /chat
    API->>API: Auth check
    API->>API: Rate limit check
    API->>Cache: Check duplicate
    Cache-->>API: Not found

    API->>AI: Prompt injection guardrail
    AI-->>API: Safe

    API->>DB: Load chat history
    DB-->>API: History loaded

    API->>AI: Classify intent
    AI-->>API: Intent type

    alt Candidate search
        API->>Search: Hybrid search
        Search-->>API: Candidates
    else Salary research
        API->>Search: Web search
        Search-->>API: Salary data
    end

    API->>AI: Generate response
    AI-->>API: Response

    API->>DB: Save state
    API->>Cache: Cache response

    API-->>Recruiter: Stream response
  "),
  caption: [Recruiter Chatbot with Agentic RAG - sequence diagram],
) <fig:recruiter-chat-sequence>

== Subsystem 4 AI Resume Parsing and Job Fit Gap Analysis

 PDF extraction pipeline + gap analysis activity + patch approval sequence.

#figure(
  mermaid("
graph TD
    A([Start]) --> B{User Action}

    B -->|Import PDF| C[AI extract<br/>structured data]
    B -->|Create resume| D[Fork from profile<br/>or start fresh]
    B -->|Gap Analysis| E[Analyze resume vs JD]
    B -->|Auto-Patch| F[Generate improvements]

    C --> G[AI normaliser<br/>fill profile fields]
    G --> H[Candidate reviews<br/>confirms fields]
    H --> I[Save resume object]

    D --> J[Edit resume fields]
    J --> K[Live preview<br/>download PDF]

    E --> L[Check cache<br/>10 min TTL]
    L --> M{Cached?}
    M -->|Yes| N[Return cached result]
    M -->|No| O[PII redaction guardrail<br/>block injection]

    O --> P[AI analysis]
    P --> Q[Return score 0-100<br/>gaps + suggestions]
    Q --> R[Cache result]

    F --> S[PII redaction guardrail]
    S --> T[AI generates patch]

    T --> U[Immutable fields guard<br/>preserve facts]
    U --> V[Skill cap<br/>max 5 new, 30 total]

    V --> W[Server validation<br/>field limits]
    W --> X[Pending patch workflow]

    X --> Y{Candidate decision}
    Y -->|Confirm| Z[Apply changes<br/>save resume]
    Y -->|Discard| AA[Abandon patch]

    I --> AB[Use in application]
    K --> AB
    Z --> AB
  "),
  caption: [AI Resume Parsing and Job Fit Gap Analysis - activity diagram],
) <fig:resume-parsing-gap>

#figure(
  mermaid("
classDiagram
    class Resume {
        +UUID id
        +UUID user_id
        +String resume_name
        +String headline
        +String summary
        +String phone
        +String location
        +String linkedin_url
        +String github_url
        +String portfolio_url
        +Integer years_of_experience
        +DateTime created_at
    }

    class ResumeExperience {
        +UUID id
        +UUID resume_id
        +String company_name
        +String title
        +DateTime start_date
        +DateTime end_date
        +Array description
    }

    class ResumeEducation {
        +UUID id
        +UUID resume_id
        +String institution
        +String degree
        +String field_of_study
        +DateTime start_date
        +DateTime end_date
    }

    class ResumeSkill {
        +UUID id
        +UUID resume_id
        +String skill_name
    }

    Resume --> ResumeExperience : has
    Resume --> ResumeEducation : has
    Resume --> ResumeSkill : has
  "),
  caption: [AI Resume Parsing and Job Fit Gap Analysis - class diagram],
) <fig:resume-parsing-gap-class>

#figure(
  mermaid("
sequenceDiagram
    participant Candidate
    participant API
    participant Cache
    participant AI
    participant DB

    Candidate->>API: POST /import-pdf
    API->>AI: Extract structured data
    AI-->>API: Extracted data
    API->>AI: Normalize fields
    AI-->>API: Normalized data
    API->>DB: Save resume
    DB-->>API: Resume saved

    Candidate->>API: POST /gap-analysis
    API->>Cache: Check cache
    Cache-->>API: Not found
    API->>AI: PII redaction guardrail
    AI-->>API: Safe
    API->>AI: Analyze gaps
    AI-->>API: Score + gaps
    API->>Cache: Cache result
    API-->>Candidate: Analysis result

    Candidate->>API: POST /auto-patch
    API->>AI: PII redaction guardrail
    AI-->>API: Safe
    API->>AI: Generate patch
    AI-->>API: Suggested changes
    API->>API: Validate fields
    API->>DB: Save pending patch
    DB-->>API: Saved

    Candidate->>API: POST /confirm-patch
    API->>DB: Apply changes
    DB-->>API: Resume updated
  "),
  caption: [AI Resume Parsing and Job Fit Gap Analysis - sequence diagram],
) <fig:resume-parsing-gap-sequence>

== Subsystem 5 Fine-Tuned ASR for Interview Transcription and Scoring

 Whisper fine-tuning curves + S3 audio pipeline + transcript evaluation sequence.

#figure(
  mermaid("
graph TD
    A([Start]) --> B{User Action}

    B -->|Upload audio| C[Upload to cloud storage<br/>presigned URL]
    B -->|Batch transcribe| D[Select candidates]

    C --> E[Create recording<br/>status: uploaded]

    E --> F[Trigger transcription]

    F --> G[Download audio from cloud]
    G --> H[Send to ASR model<br/>fine-tuned for interviews]

    H --> I{Success?}
    I -->|Yes| J[Save transcript<br/>status: transcribed]
    I -->|No| K[Retry on cold start<br/>status: failed]

    D --> L[List recordings<br/>filter by status]
    L --> M[Queue batch transcribe<br/>concurrent processing]

    M --> F

    J --> N[Trigger AI evaluation]
    K --> O[Retry transcription]

    N --> P[Load job schema<br/>rubric criteria]
    P --> Q[AI evaluation<br/>against transcript]

    Q --> R[Save AI scores<br/>status: evaluated]

    R --> S{Human evaluation?}
    S -->|Yes| T[Recruiter scores<br/>per criterion]
    S -->|No| U[AI scores only]

    T --> V[Combine AI + Human<br/>weighted average]
    V --> W[Save final scores]

    U --> W

    W --> X[Side-by-side view<br/>AI vs Human]
  "),
  caption: [Fine-Tuned ASR for Interview Transcription and Scoring - activity diagram],
) <fig:asr-transcription>

#figure(
  mermaid("
classDiagram
    class InterviewRecording {
        +UUID id
        +UUID application_id
        +String s3_audio_url
        +String s3_audio_key
        +String transcript
        +String evaluation
        +RecordingStatus status
        +Integer duration_seconds
        +DateTime created_at
    }

    class JobEvaluationSchema {
        +UUID id
        +UUID job_id
        +Integer version
        +Array criteria
        +Float human_weight
        +Float llm_weight
        +DateTime created_at
    }

    class CandidateEvaluationScore {
        +UUID id
        +UUID application_id
        +UUID job_id
        +UUID schema_id
        +String evaluator_type
        +Dict scores
        +Array criteria_snapshot
        +String notes
        +Float weighted_total
        +UUID submitted_by_user_id
        +String evaluator_label
        +DateTime created_at
    }

    InterviewRecording --> JobEvaluationSchema : uses
    CandidateEvaluationScore --> JobEvaluationSchema : references
  "),
  caption: [Fine-Tuned ASR for Interview Transcription and Scoring - class diagram],
) <fig:asr-transcription-class>

#figure(
  mermaid("
sequenceDiagram
    participant Recruiter
    participant API
    participant DB
    participant S3
    participant ASRModel
    participant AI

    Recruiter->>API: Upload audio
    API->>S3: Upload file
    S3-->>API: URL
    API->>DB: Create recording
    DB-->>API: Saved

    API->>API: Trigger transcription
    API->>S3: Download audio
    S3-->>API: Audio data
    API->>ASRModel: Transcribe
    ASRModel-->>API: Transcript
    API->>DB: Save transcript

    API->>AI: Evaluate transcript
    AI->>DB: Load job schema
    DB-->>AI: Schema
    AI->>AI: Score against rubric
    AI-->>API: AI scores
    API->>DB: Save AI scores

    Recruiter->>API: Submit human scores
    API->>DB: Save human scores
    API->>API: Combine AI + Human
    API->>DB: Save final scores
  "),
  caption: [Fine-Tuned ASR for Interview Transcription and Scoring - sequence diagram],
) <fig:asr-transcription-sequence>

== Subsystem 6 AI Job Drafting and Hybrid Semantic Search

 LangGraph drafting state graph + hybrid search architecture (dense + sparse + RRF).

#figure(
  mermaid("
graph TD
    A([Start]) --> B{User Action}

    B -->|AI Job Assistant| C[Enter description]
    B -->|Manual form| D[Fill job fields]
    B -->|Hybrid Search| E[Natural language query]

    C --> F[AI workflow]

    F --> G{Salary research?}
    G -->|Yes| H[Web search<br/>24h cache]
    G -->|No| I[Skip research]

    H --> J[AI synthesize salary]
    I --> J

    J --> K[Generate draft]

    K --> L[Server validators]

    L --> M{Valid?}
    M -->|No| N[Return errors<br/>refine loop]
    M -->|Yes| O[Human review]

    O --> P{Recruiter decision}
    P -->|Edit fields| Q[Regenerate]
    P -->|Approve| R[Commit to job]
    P -->|Discard| S[Delete draft]

    Q --> K

    R --> T[Job created<br/>status: draft/active]

    D --> T

    E --> U[Dense search<br/>vector embeddings]
    E --> V[Sparse search<br/>keyword matching]

    U --> W[Hybrid retrieval<br/>merge results]
    V --> W

    W --> X[Return ranked jobs<br/>by relevance]
  "),
  caption: [AI Job Drafting and Hybrid Semantic Search - activity diagram],
) <fig:job-drafting-search>

#figure(
  mermaid("
classDiagram
    class JobAIDraft {
        +UUID id
        +UUID recruiter_id
        +UUID company_id
        +String thread_id
        +String status
        +String mode
        +String source_title
        +String source_rough_description
        +Array locked_fields
        +Dict latest_draft
        +Dict salary_research
        +Array assumptions
        +Array warnings
        +Array missing_fields
        +Dict last_interrupt
        +UUID committed_job_id
        +DateTime created_at
    }
  "),
  caption: [AI Job Drafting and Hybrid Semantic Search - class diagram],
) <fig:job-drafting-search-class>

#figure(
  mermaid("
sequenceDiagram
    participant Recruiter
    participant API
    participant AI
    participant Search
    participant WebSearch
    participant DB

    Recruiter->>API: POST /job-draft
    API->>AI: Start AI workflow
    AI->>WebSearch: Salary research
    WebSearch-->>AI: Salary data
    AI->>AI: Synthesize salary
    AI->>AI: Generate draft
    AI-->>API: Draft generated
    API->>API: Validate fields

    Recruiter->>API: POST /edit-fields
    API->>AI: Regenerate selected
    AI-->>API: Updated draft

    Recruiter->>API: POST /approve
    API->>DB: Create job
    DB-->>API: Job created

    Recruiter->>API: POST /search-jobs
    API->>Search: Dense search
    Search-->>API: Vector results
    API->>Search: Sparse search
    Search-->>API: Keyword results
    API->>API: Merge results
    API-->>Recruiter: Ranked jobs
  "),
  caption: [AI Job Drafting and Hybrid Semantic Search - sequence diagram],
) <fig:job-drafting-search-sequence>

== Subsystem 7 AI Outreach Drafting and Interview Scheduling

 email draft approval activity + Cal.com webhook sequence + outreach class diagram.

#figure(
  mermaid("
graph TD
    A([Start]) --> B{User Action}

    B -->|Shortlist finalize| C[Generate email drafts]
    B -->|Send all| D[Dispatch approved emails]
    B -->|Interview booking| E[Webhook trigger]

    C --> F{Application status?}
    F -->|Shortlisted| G[Draft warm invite<br/>+ booking link]
    F -->|Rejected| H[Draft rejection<br/>+ AI feedback]

    G --> I[Save draft<br/>status: pending]
    H --> I

    D --> J[Email service send<br/>approved drafts only]
    J --> K[Mark sent]

    K --> L{Email type?}
    L -->|Shortlist| M[Candidate clicks<br/>booking link]
    L -->|Rejection| N[No scheduling]

    M --> O[Interview booking]

    E --> P{Booking created?}
    P -->|Yes| Q[Match to application]
    P -->|No| R[Ignore]

    Q --> S[Create interview record]
    S --> T[Status: interview_booked]
    T --> U[Notify candidate<br/>+ recruiter]
  "),
  caption: [AI Outreach Drafting and Interview Scheduling - activity diagram],
) <fig:outreach-interview>

#figure(
  mermaid("
classDiagram
    class Application {
        +UUID id
        +UUID user_id
        +UUID job_id
        +String status
        +Float score
    }

    class EmailDraft {
        +UUID id
        +UUID application_id
        +String subject
        +String body
        +Boolean is_approved
        +Boolean is_sent
        +Boolean is_discarded
        +DateTime created_at
    }

    class Interview {
        +UUID id
        +UUID application_id
        +String cal_booking_uid
        +String candidate_name
        +String candidate_email
        +DateTime start_time
        +DateTime end_time
        +String location
        +String title
    }

    Application --> EmailDraft : has
    Application --> Interview : has
  "),
  caption: [AI Outreach Drafting and Interview Scheduling - class diagram],
) <fig:outreach-interview-class>

#figure(
  mermaid("
sequenceDiagram
    participant Recruiter
    participant API
    participant DB
    participant EmailService
    participant Webhook
    participant Notification

    Recruiter->>API: Finalize shortlist
    API->>DB: Get applications
    DB-->>API: Applications
    API->>AI: Generate email drafts
    AI-->>API: Drafts
    API->>DB: Save drafts
    DB-->>API: Saved

    Recruiter->>API: Approve draft
    API->>DB: Mark approved
    DB-->>API: Approved

    Recruiter->>API: Send all
    API->>EmailService: Send emails
    EmailService-->>API: Sent
    API->>DB: Mark sent
    DB-->>API: Updated

    Candidate->>API: Click booking link
    Candidate->>Candidate: Book interview
    Webhook->>API: Booking webhook
    API->>DB: Match application
    DB-->>API: Found
    API->>DB: Create interview
    DB-->>API: Created
    API->>Notification: Notify candidate
    API->>Notification: Notify recruiter
  "),
  caption: [AI Outreach Drafting and Interview Scheduling - sequence diagram],
) <fig:outreach-interview-sequence>

== Database Schema Diagram

#figure(
  rect(width: 100%, height: 5cm, stroke: 0.5pt + gray)[#align(center + horizon)[_DB schema placeholder_]],
  caption: [PostgreSQL schema diagram],
) <fig:db-schema>

== Finetuning OpenAI Whisper

 synthetic data, crowdsourcing, storage.

=== Integration

 decoupled FastAPI service for the ASR pipeline.

// 8. TEST PLANS
= Test Plans

== Introduction and QA Philosophy

 deterministic vs probabilistic dual-track QA.

== Traditional Software Testing (Deterministic)

=== Unit and Integration Testing


=== Functional Black-Box Testing


== AI Intelligence Benchmarking (Probabilistic)

=== R&D Benchmark OCR and Layout Parsing

#figure(
  table(
    columns: 5,
    align: (left, center, center, center, center),
    stroke: 0.5pt,
    table.header(
      [*Metric*], [*Docling (IBM)*], [*Chandra OCR*], [*Llama Parse*], [*Tesseract*],
    ),
    [Layout Accuracy], [95%], [92%], [90%], [30%],
    [LLM Compatibility], [Markdown], [JSON], [Markdown], [Raw Text],
    [CPU Latency], [Fast], [Very Slow], [N/A (Cloud)], [Instant],
    [Data Privacy], [Local (Safe)], [Local], [Cloud], [Local],
  ),
  caption: [OCR and layout parsing comparative analysis],
) <tbl:ocr-bench>

=== Information Extraction (IE) and Structured Schema Validation

 ground truth, hallucination rate, omission rate.

=== RAG Evaluation (RAGAS Framework)

 faithfulness, answer relevance, precision\@K.

=== ASR Performance Whisper Fine-tuning

 WER benchmark.

== Guardrails

Guardrails are runtime checks that sit between the user, the language model, and the rest of the system. They decide what the model is allowed to read, what it is allowed to say, and what shape its answer must take. ConvexHire uses three layers of guardrails - one at the input, one over the content the model handles, and one over the output it produces - so that a single weak point cannot cause unfair, unsafe, or fabricated behaviour to reach the recruiter or candidate.

=== Input Guardrail Prompt Injection Defense

Resumes are untrusted documents. A candidate can paste hidden instructions into the body of their CV in an attempt to hijack the shortlisting agent - telling it to ignore the recruiter's rules, to give every applicant a perfect score, or to leak the system prompt. To stop this, ConvexHire wraps the shortlisting and recruiter chat models with NVIDIA NeMo Guardrails, configured with a `self_check_input` rail. Before the resume ever reaches the scoring model, a separate classifier LLM reads the incoming text and decides whether it is a normal recruiting input or an injection attempt, looking for patterns such as "ignore previous instructions", forced output dictation, fake `</RESUME>` tags, fake `SYSTEM` turns, system prompt exfiltration requests, and jailbreak personas. If the classifier flags the message, the rail short-circuits and the scoring model is never called - the user instead receives a polite refusal.

The benefit of this design is that the protection is independent of the scoring model itself. Even if the underlying model is small, fast, and easy to manipulate, the rail still acts as an early filter that throws away the dangerous input before it can do harm. We tested this with three real attack patterns - a direct instruction override, a role hijack using a fake closing tag and a fake system message, and a system prompt exfiltration request - and confirmed that the unguarded model was hijacked or leaked, while the guarded chain refused all three.

=== Content Guardrail PII Redaction and Bias Mitigation

Before any AI reads a candidate's resume, the system removes all personally identifying information from it - names, emails, phone numbers, and personal links are stripped out first. After that, LangChain's `PIIMiddleware` scans again for any leftover emails, URLs, or phone numbers, using built-in detectors plus a custom regex for international phone formats, and replaces them with redacted tags like `[REDACTED_EMAIL]`. At the same time, every evaluator prompt starts with a clear rule judge only on skills and experience, and never consider age, gender, race, nationality, name, employment gaps, or how famous the school or company is.

There is also a reflection step where a third AI agent checks whether the first two evaluators gave opinions based on personal characteristics, and flags anything unfair. For job posts, a validator blocks biased language - such as age requirements, gendered pronouns, or exclusionary culture-fit terms - before the description is published. Together, these checks make sure that sensitive details cannot leak into model context and that the scoring decision stays anchored on what the candidate can actually do.

=== Output Guardrail Hallucination Prevention

Every AI feature in the system uses structured output with strict JSON schemas and Pydantic validation. This means the model is not allowed to reply in free text; it must fill in predefined fields with exact types, which naturally limits how much it can make things up. For example, when drafting job posts or editing them, the AI must preserve locked fields exactly as the recruiter set them, and it cannot add new fields outside the schema. Salary estimates use a dedicated field called `insufficient_evidence` so the AI can admit when it truly has no data instead of guessing numbers.

For resume gap analysis and patch suggestions, the prompts include hard rules called frozen facts the AI is told it can never invent employers, schools, dates, metrics, or skills that do not already exist in the candidate's resume. It must also cite a specific phrase from the resume or job description for every claim it makes, and if it cannot find proof, it must simply leave that point out. In the recruiter chat, search-based answers are grounded only in the provided web results, and the AI is instructed to say "I do not have enough information" when the evidence is missing. When drafting emails or outreach, the AI uses placeholders like `[Candidate Name]` instead of guessing real names or dates it does not know.
= Critical Evaluation

== Final Report Reflection


== Findings and System Evaluation


== System Evaluation


== Self-Reflection and Professional Development


// 10. EVIDENCE OF PROJECT MANAGEMENT
= Evidence of Project Management

== Log Sheets

 link to FYP Meeting Log Sheets.

== Gantt Chart

#figure(
  rect(width: 100%, height: 4cm, stroke: 0.5pt + gray)[#align(center + horizon)[_Detailed Gantt chart placeholder_]],
  caption: [Detailed Gantt chart for the development lifecycle],
) <fig:gantt-detail>

== Trello Board

#figure(
  rect(width: 100%, height: 4cm, stroke: 0.5pt + gray)[#align(center + horizon)[_Trello board screenshot placeholder_]],
  caption: [Kanban board on Trello],
) <fig:trello>

// 11. REFERENCES
#heading(level: 1, numbering: none, outlined: true)[References]

#set par(first-line-indent: 0pt, hanging-indent: 1.5em)

[1] F. P.-W. Lo, J. Qiu, Z. Wang, H. Yu, Y. Chen, G. Zhang, and B. Lo, "AI Hiring with LLMs A Context-Aware and Explainable Multi-Agent Framework for Resume Screening," arXiv2504.02870, 2025. https//arxiv.org/abs/2504.02870

[2] J. Rosenberger, L. Wolfrum, S. Weinzierl, M. Kraus, and P. Zschech, "CareerBERT Matching Resumes to ESCO Jobs in a Shared Embedding Space," _Expert Systems with Applications_, arXiv2503.02056, 2025. https//arxiv.org/abs/2503.02056

[3] H.-L. Hsu and J. Tzeng, "DAT Dynamic Alpha Tuning for Hybrid Retrieval in RAG," arXiv2503.23013, 2025. https//arxiv.org/abs/2503.23013

[4] M. Ong et al., "A Unified Approach to Routing and Cascading for LLMs," arXiv2410.10347, 2024. https//arxiv.org/abs/2410.10347

[5] Y. Du, S. Li, A. Torralba, J. B. Tenenbaum, and I. Mordatch, "Improving Factuality and Reasoning in Language Models through Multiagent Debate," _ICLR_, 2024. https//openreview.net/forum?id=QAwaaLJNCk

[6] Y. Liu et al., "Prompt Injection Attack against LLM-integrated Applications," arXiv2306.05499, 2023. https//arxiv.org/abs/2306.05499

[7] K. Sharma et al., "A hybrid rule-based NLP and ML approach for PII detection and anonymization in financial documents," _Scientific Reports_, doi10.1038/s41598-025-04971-9, 2025. https//www.nature.com/articles/s41598-025-04971-9

[8] V. P. Ojha et al., "Whisper Finetuning on Nepali Language," arXiv2411.12587, 2024. https//arxiv.org/abs/2411.12587

[9] A. Peng, B. Nushi, E. Kıcıman, K. Inkpen, and E. Kamar, "Investigations of Performance and Bias in Human-AI Teamwork in Hiring," _AAAI_, 2022. https//arxiv.org/abs/2202.11812

[10] A. Fabris et al., "Fairness and Bias in Algorithmic Hiring a Multidisciplinary Survey," _ACM Computing Surveys_, arXiv2309.13933, 2023. https//arxiv.org/abs/2309.13933

[11] Multiple authors, "Improved intent classification based on context information using a windows-based approach," arXiv2411.06022, 2024. https//arxiv.org/abs/2411.06022

[12] P. Zhang, Z. Liu et al., "Compressing Lengthy Context With UltraGist," arXiv2405.16635, 2024. https//arxiv.org/abs/2405.16635

[13] V. Filatova, A. Zelenchuk, and D. Filatov, "AI-Driven Decision-Making System for Hiring Process," arXiv2512.20652, 2024. https//arxiv.org/abs/2512.20652

[14] Y. Liu et al., "Formalizing and Benchmarking Prompt Injection Attacks and Defenses," arXiv2310.12815, 2023. https//arxiv.org/abs/2310.12815

[15] Multiple authors, "Whisper-LM Improving ASR Models with Language Models for Low-Resource Languages," arXiv2503.23542, 2025. https//arxiv.org/abs/2503.23542

[S1] Eightfold AI, "AI Recruiting Software," 2025. https//eightfold.ai/

[S2] Paradox, "Olivia Conversational AI for Recruiting," 2025. https//www.paradox.ai/

[S3] HireVue, "AI in Hiring," 2025. https//www.hirevue.com/ai-in-hiring

[S4] LinkedIn, "Recruiter 2024 Release," LinkedIn Talent Solutions, 2024. https//business.linkedin.com/talent-solutions/product-update/recruiter-release

[S5] Soum-ik, "AI-Powered Job Portal," GitHub, 2024. https//github.com/Soum-ik/AI-Powerd-Job-Portal

#set par(first-line-indent: 1.5em, hanging-indent: 0pt)

// 12. APPENDICES
= Appendices

== Wireframes

 insert wireframe images.

#figure(
  rect(width: 100%, height: 5cm, stroke: 0.5pt + gray)[#align(center + horizon)[_Wireframe placeholder_]],
  caption: [Candidate dashboard wireframe],
) <fig:wf-candidate>

== Additional Diagrams

 any supplementary diagrams.

