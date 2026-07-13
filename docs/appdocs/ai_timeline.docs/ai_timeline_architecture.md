# AI Timeline Software Architecture Document (SAD)

## Phase 1 - Draft 3

**Version:** 0.3 

**Status:** Architectural Design

**Purpose**

This document defines the complete software architecture of the AI Timeline feature for PetOLife Phase 1. It serves as the engineering blueprint for frontend, backend, AI, and future data architecture teams.

Unlike a traditional OCR pipeline, the AI Timeline is designed as an evolving intelligence layer that converts fragmented pet medical history into a structured, verifiable, chronological, and continuously extendable digital medical timeline.

The architecture is intentionally modular so that Gemini APIs can later be replaced with PetOLife's own AI models without affecting the surrounding services.

---

# Ch. 1 - Vision & Scope

## Vision

The AI Timeline is the medical intelligence layer of PetOLife.

Instead of storing medical reports as isolated files, the system transforms them into an organized medical history that continuously grows throughout a pet's lifetime.

The generated timeline becomes the foundation for future features such as:

- Smart reminders
- Vet-friendly history navigation
- AI health summaries
- Pattern understanding
- Predictive health analysis (Future)
- AI veterinarian assistant (Future)

## Goals

Transform uploaded medical records into:

- verified structured data
- chronological timeline
- medical event summaries
- collective medical understanding
- smart reminders

while keeping human verification at the center of the pipeline.

## Non Goals

Phase 1 will NOT

- diagnose diseases
- prescribe medicines
- replace veterinarians
- perform predictive healthcare
- perform risk scoring

Every AI output is informational and must contain appropriate medical disclaimers.

---

# Ch. 2 - HighLevel Architecture

!image.png

## Architectural Principles

- Human verified AI
- AI assists, backend controls
- Immutable timeline versions
- Incremental updates
- Minimal Gemini context
- AI abstraction layer
- Modular services

---

# Ch. 3 - Functional Scope

The AI Timeline consists of seven logical modules.

M1 - Document Acquisition

Input

- PDFs
- Images
- Existing uploaded records

M2 - OCR & Information Extraction

Produces

Verified structured JSON.

M3 - Timeline Builder

Creates Medical Event Nodes.

M4 - Insight Generation

Creates

- Event summaries
- Visit understanding
- Suggestions
- Medical disclaimer

M5 - Collective Insight Engine

Builds

Complete understanding of the pet's medical history.

M6 - Timeline Engine

Produces

Chronological timeline.

M7 - Reminder Engine

Creates

- medication reminders
- vaccination reminders
- follow-up reminders

---

# Ch. 4 - Data Acquisition Layer

Two independent data sources are supported.

## A - Pet Diary Upload

<aside>
💡

Primary Way for the entier pipeline

</aside>

Recommended for first-time timeline generation.

Requirements

- PDF
- Multiple Images
- Maximum upload 10 MB
- Multiple pages

The Pet Diary should ideally contain at least **5 verified medical visits** before a complete AI Timeline can be generated.

If fewer visits exist, the system informs the user that the generated timeline may be incomplete.

---

## B - Existing Medical Records

<aside>
💡

Leads to Minimal insights generation engine 

</aside>

Already uploaded records stored in PetOLife.

No re-upload required.

Users simply select existing records or uploads one single record

---

# Ch. 5 - OCR & Verification Layer

!image.png

# Ch. 6 - Standardized Medical JSON Schema

The extraction pipeline converts every uploaded document into a unified schema mentioned below :

```json
{
  "pet": {
    "name": "",
    "species": "",
    "breed": "",
    "age": "",
    "sex": ""
  },

  "visit": {
    "date": "",
    "doctor": "",
    "clinic": "",
    "reason": ""
  },

  "diagnosis": [],

  "medications": [],

  "vaccinations": [],

  "deworming": [],

  "anti_tick": [],

  "weight": "",

  "follow_up": "",

  "doctor_notes": "",

  "confidence": {},

  "misc": []
}
```

---

## Misc Field

The misc section stores

- unknown entities
- unmapped text
- unsupported observations

Nothing extracted should ever be discarded. (This can be mapped into things later with user review)

---

# Ch. 7 - Timeline Builder Engine

Purpose

Transform verified JSON into **timeline** nodes.

Two architectural candidates were evaluated.

---

Opt A - Medical Event Nodes

Every hospital visit becomes one node.

Each node contains

- visit date
- diagnosis
- medication
- vaccination
- doctor notes
- follow-up
- weight
- observations

Advantages

- Preserves visit context
- Natural chronology
- Better AI reasoning
- Easier doctor navigation

Opt B - Category Nodes

Separate nodes

- medications
- vaccinations
- diagnosis
- weights
- follow-ups

Advantages

- Faster querying
- Compact storage

Disadvantages

- Loses medical visit context
- Harder reasoning
- Weak relationship model

## Recommended Choice -

Phase 1 to exclusively implement **Medical Event Nodes**.

Category views will later be generated through indexing rather than storage architecture.

---

# Ch. 8 - Medical Event Node Architecture

!image.png

---

# Ch. 9 - AI Insight Generation Engine

Every Medical Event Node is independently processed.

Gemini receives - verified event data (never raw OCR) and structured metadata is updated and handled by backend

---

#### Each node generates

- Human Summary - Simple explanation
- Visit Understanding - "What happened during this visit?"
- Suggested Actions (These are informational suggestions only) -
    - Continue medication
    - Follow vaccination schedule
    - Monitor weight
    - Revisit veterinarian

---

# Ch. 10 - Collective Insight Engine

Purpose

Understand the complete medical history.

it receives:

- all verified Medical Event Nodes
- structured diagnoses
- medications
- vaccinations

- doctor notes
- follow-ups
- event metadata

This preserves factual accuracy.

## Generated Outputs

### 1. Hierarchical Summary

Organized by

- years
- medical conditions
- treatment progression

### 2. Single Overall Summary

One concise understanding of

the pet's complete medical history.

## Important Rule

Future updates never regenerate the entire Collective Insight. (This minimizes token usage while preserving continuity.)

Instead -

Existing Collective Insight + New Medical Event Nodes → Incremental Merge Engine = Updated Collective Insight

---

# Ch. 11 - POL Bot Analysis Architecture

## Purpose

The POL (PetOLife) Bot Analysis is the **persistent AI intelligence layer** for each pet. It is not merely a conversation or prompt history; it is a structured, version-controlled representation of the AI Timeline's understanding of the pet's medical history.

It’s more of a LLM chat memory or context protocol

---

## Design Principles

- One persistent POL Bot Analysis per pet.
- Version-controlled after every accepted timeline update.
- Stores structured outputs only.
- Never stores prompts or conversational history.
- Acts as the authoritative AI context for future analyses.
- Designed to remain model-agnostic for future migration beyond Gemini.

## Stored Components

Each POL Bot Analysis contains:

- Current Timeline Version
- Current Collective Insight
- Hierarchical Medical Summary
- Active Medical Conditions
- Vaccination Status

- Medication History
- Reminder Dataset
- Timeline Metadata
- AI Generation Metadata
- Insight Version

---

## AI Context Strategy

Gemini does **not** receive:

- previous prompts
- previous OCR
- previous documents

Gemini receives only:

- Current POL Bot Analysis (structured)
- Newly verified Medical Event Nodes

This dramatically reduces token usage while preserving continuity.

---

# Ch. 12 - Incremental Update Pipeline

## Objective

Avoid rebuilding the AI Timeline from scratch whenever a new medical record is uploaded.

Only the new information should be analyzed.

!image.png

## Processing Logic

Only newly uploaded records undergo:

- OCR
- Verification
- Node Generation
- Node Insight Generation

The existing timeline remains untouched until the mutation engine approves changes.

---

## Benefits

- Faster generation
- Lower Gemini token usage
- Preserves historical consistency
- Easier rollback
- Lower processing cost

---

# Ch. 13 - Deterministic Timeline Mutation Engine

## Purpose

Gemini must never directly modify the timeline ||  AI proposes insights → Backend applies updates.

!image.png

---

## Mutation Rules

Allowed mutations:

- Append new Medical Event Node
- Update reminder schedule
- Update treatment continuity
- Extend medication history
- Update vaccination status

Forbidden mutations:

- Delete historical visits
- Rewrite previous diagnoses
- Modify verified node content
- Change timeline chronology

## Why Deterministic?

AI outputs may vary && Timeline consistency cannot ⇒ AI understands → Backend decides

---

# Ch. 14 - Conflict Resolution & Duplicate Detection

This chapter defines how conflicting and duplicate records are resolved **without AI**.

## Duplicate Detection

Each Medical Event receives an Event Hash generated from:

- Visit Date
- Doctor
- Diagnosis
- Medication
- Source Document ID

Example - SHA256 (visit_date :”XXX-XXX”,………)

If identical hashes exist → the record is treated as a duplicate.

---

## Near-Duplicate Detection

If Event Hash differs slightly,

backend performs similarity checks using:

- Visit Date proximity
- Doctor similarity
- Medication overlap
- Diagnosis overlap

If similarity exceeds threshold → merge automatically.

---

## Conflict Detection & Resolution Rules

Example - (Doc A : Weight = 18 kg ||  Doc B : Weight = 21 kg) && Same visit date ⇒ Conflict detected.

To resolve -

Rules priority : 

1. Verified User Data
2. Latest Verified Correction
3. Higher OCR Confidence
4. Latest Document Upload
5. Original Record (if unresolved)

Resolution strategy - 
Backend never deletes conflicting data.

- Keep original node.
- Create corrected node version.
- Mark previous node as superseded.
- Preserve audit history.

No manual merging is required from users.

---

# Ch. 15 - Reminder Engine

## Generate intelligent reminders from the AI Timeline.

Hybrid Architecture : Rule Engine + AI Assistance = Reminder Objects

Remainder Objects { 

Reminder ID, 
Reminder Type,
Priority,
Start Date,
Next Due Date,
Frequency,
Medical Event ID,
Status,
Created By 
}

## Rule-Based Responsibilities

- Annual vaccination intervals
- Deworming frequency
- Anti-tick schedule
- Follow-up appointments
- Medication duration

These should preferably remain entirely rule-based.

## AI Responsibilities

AI is used only when reminders require interpretation, such as:

- Doctor note implying future review
- Long-term monitoring suggestion
- Conditional follow-up recommendation

## Reminder Priority

High

- Follow-up missed
- Critical medication

Medium

- Vaccination due

Low

- Weight monitoring
- Routine check-up

---

## Calendar Views

Generated reminders support:

- Daily
- Weekly
- Monthly
- Quarterly
- Yearly

---

# Ch. 16 - Timeline Lifecycle & Versioning

Each AI Timeline progresses through defined lifecycle states.

!image.png

### Timeline Version History

Every accepted update creates:

- New Timeline Version
- New Collective Insight Version
- Updated Reminder Dataset

Nothing is overwritten.

### Rollback Capability

Future architecture should support:

- Restore Timeline Version N
- without regenerating the timeline.

---

# Ch. 17 - Service Decomposition & API Flow

The architecture is divided into modular backend services.

---

## OCR Service

Responsibilities

- Upload handling
- File parsing
- OCR
- Schema generation

---

## Verification Service

Responsibilities

- JSON validation
- User edits
- Verification status

---

## Timeline Builder Service

Responsibilities

- Medical Event creation
- Metadata assignment

---

## Insight Service

Responsibilities

- Gemini communication
- Node insights
- Collective insight generation

---

## Mutation Service

Responsibilities

- Conflict detection
- Duplicate detection
- Timeline mutation
- Version creation

---

## Reminder Service

Responsibilities

- Rule execution
- AI reminder assistance
- Calendar generation

---

## Frontend Flow

The AI Timeline is becoming one of the flagship features of PetOLife. It deserves an experience similar to **Google Photos**, **Notion AI**, and **GitHub PR review**, where the AI works with the user instead of hiding everything behind a loading spinner.

I think the frontend should feel like an **AI workspace**, not an OCR utility.

AiTimeline_wireframe 

---

# Ch.18 - Community Powered Insights

@Nitin JBS CTO is pushing the feature in a very strong direction. The limitation of an **AI-only insight generator** is that it relies entirely on the LLM's reasoning over one pet's medical history. A **community-powered insight generator** lets the system learn from thousands of similar cases (without exposing private data), making the insights feel grounded in real-world experiences rather than only AI inference.

I wouldn't replace AI with the community—I would make the **community another intelligence layer**.

### The Big Idea

Instead of :

> Medical Records → AI → Insights
> 

PetOLife’s AI Timeline becomes :

> Medical Records → AI → Community Knowledge → Personalized Insights
> 

The AI reasons about your pet, while the community provides context about *similar pets*.

Architecture for Community + Ai Insights - CommXai_architecture 

---

# Ch. 19 - Compare & Analysis

## 1. OCR Architecture

### Google File API + Gemini Vision (Rc)

Advantages

- Native multimodal understanding
- Excellent document comprehension
- Handles PDFs and images seamlessly
- Minimal preprocessing

Disadvantages

- Vendor dependency
- Token costs
- Limited customization

### Separate OCR Engine (PaddleOCR, TrOCR, DocTR, Hugging Face Models)

Advantages

- Full control
- Self-hostable
- Lower long-term cost
- Model customization

Disadvantages

- Additional infrastructure
- Requires OCR maintenance
- Lower document understanding without an LLM

---

## 2. Prompt Storage vs Structured Output Storage

### Store Prompts & Responses

Advantages

- Easier debugging
- Prompt evaluation
- AI reproducibility

Disadvantages

- High storage
- Privacy concerns
- Vendor-specific
- Difficult migration

### Store Structured Outputs Only (Rc)

Advantages

- Smaller storage
- Model-independent
- Easier migration
- Cleaner architecture
- Better privacy

Disadvantages

- Harder prompt debugging
- Requires separate evaluation tooling

---

# Ch. 20 - Fall Back Mechanisms Sys-Arch (Draft 3 addon)

### Rule-Based Timeline Engine - Overall Processing Architecture

Instead of Gemini usage , it becomes :

```
User Requests Timeline

↓

AI Health Check

↓

Gemini Available?

──────────────┬──────────────

YES                          NO

│                             │

AI Pipeline          Rule-Based Pipeline

│                             │

AI Timeline          Basic Timeline

│                             │

──────────────┬──────────────

↓

Timeline UI
```

`Notice that : The frontend never changes. Only backend routing changes.`

---

# Fallback Architecture

## Goal

Provide uninterrupted timeline generation even when:

- Gemini API quota exhausted
- API unavailable
- Internet issues
- LLM disabled
- Rate limited

Users should never see

"AI unavailable."

Instead - PetOLife switches into

**Basic Timeline Mode**

---

# Detection Layer

Before every AI Timeline request : Generate Timeline → AI Service Health Check → Gemini Available?

If true : AI Pipeline () ;  Else : Fallback Pipeline () ;  // The frontend doesn't care. Only backend decides.

---

# Fallback Data Sources

Since OCR understanding is unavailable

We collect → Already Known Pet Information (From Pet Profile)

Like - Pet Name , Species , Breed , Age , Gender , Weight , Owner

---

# Vet Visit Form

Instead of uploading a PDF

Show : "Quick Vet Visit" (Only ask minimum fields)

Suggested Fields : 

- Visit Date
- Clinic (optional)
- Reason for Visit
- Diagnosis (free text)
- Medication
- Vaccination Given
- Weight
- Follow-up Date
- Doctor Notes
- Treatment Status

---

# Backend Object Creation

The submitted form becomes : Vet Visit Object ⇒ Medical Event Object ⇒ Store Database

Exactly the same Medical Event schema. `Both pipelines create identical objects`

---

# Timeline Generation

Instead of AI | Use deterministic sorting

```
Medical Events

↓

Sort by Date

↓

Timeline
```

No summaries. | No AI. | Just chronology.

---

# Reminder Engine

No Gemini. | Entirely rule-based.

Example

If : Rabies Vaccination → Next Reminder = 365 days

---

If : Deworming → 90 Days

---

If: Follow-up exists → Reminder & Follow-up Date

---

If: Medication → End Date Reminder

---

# Timeline Cards

Instead of AI summaries

Cards display

Visit → Diagnosis → Medication → Vaccination → Notes

Exactly what user entered.

---

# Database

Important design decision

Store Only :  Medical Event Objects

Never store : Generated Timeline , Pseudo Timeline , Pseudo Reminders , Timeline , Reminder

Everything becomes : Computed Views , Generated dynamically.

---

# Backend Rule Engine

Simple deterministic engine

```
Medical Event

↓

Extract Dates

↓

Sort

↓

Determine Reminder

↓

Generate Timeline Cards
```

---

# AI Recovery

Suppose Gemini comes back.

Next request →  AI Available → Backend automatically upgrades : Basic Timeline → AI Timeline

Without asking users to re-enter anything.

Because : The Medical Event Objects already exist.

This is a huge architectural advantage.

---

# Ch. 20 - Think More

These topics remain open for future architectural exploration:

1. Migration strategy from Gemini to PetOLife proprietary models.
2. Long-term AI abstraction layer for multiple LLM providers.
3. Cold storage strategy for archived medical records.
4. Efficient retrieval strategy for pets with hundreds of medical visits.
5. Embedding-based semantic retrieval for future AI assistants.
6. **Multi-pet shared household timeline architecture.**
7. Veterinary collaborative editing workflows.
8. Fine-grained permission models for clinics and pet owners.
9. Cost optimization for AI inference.
10. Event sourcing versus snapshot storage for timeline reconstruction.

---

# Ch. 21 - Ans to smthg tht sounds Off

1. Timeline generation should be blocked or clearly marked as limited if fewer than five verified medical visits are available.
2. Reminder generation should remain primarily rule-based; AI should only assist where deterministic rules are insufficient.
3. Mutation logic must remain entirely deterministic. AI should never directly write to the timeline database.
4. Every AI-generated suggestion must include a disclaimer that it is informational and not a substitute for veterinary advice.
5. Entire OCR output must be verified before any AI reasoning to avoid propagating extraction errors.
6. POL Bot Analysis should never store prompts or raw OCR text to prevent unnecessary token growth and vendor lock-in.

---

# Ch. 22 - Divertions from Phase 1 Scope

Comparing this architecture with the current Phase 1 roadmap:

1. POL Bot Analysis persistence extends beyond the stated MVP, which primarily requires structured timelines and backend storage.
2. Incremental AI context mutation introduces additional engineering complexity and may be implemented progressively after the core timeline pipeline is stable.
3. Collective Insight reasoning goes beyond basic summarization envisioned in Phase 1 and should initially focus on concise historical understanding before advanced pattern analysis.
4. Priority-based reminder intelligence (High/Medium/Low) is an enhancement over the roadmap's requirement of reminder generation.
5. Calendar-style reminder visualization is primarily a user experience enhancement rather than a foundational backend requirement.

---

# Ch. 23 - Future Architecture & AI Abstraction Layer

To avoid coupling the system to Gemini, all AI interactions should pass through an internal AI Adapter interface.

```
Timeline Service

↓

AI Adapter

↓

Gemini (Phase 1)

↓

PetOLife Model (Future)

↓

Other LLM Providers (Optional)
```

The AI Adapter should standardize:

- Request format
- Response schema
- Error handling
- Token accounting
- Provider switching

This ensures that replacing Gemini in later phases requires minimal changes to the surrounding architecture.

Future enhancements may include:

- In-house medical language models
- Retrieval-Augmented Generation (RAG)
- Vector embeddings for semantic history search
- Predictive health analytics
- Vet-facing clinical copilots

---

# Ch. 24 - Final End-to-End Architecture Summary

```
Data Source
(Pet Diary / Existing Records)
                │
                ▼
      OCR & Vision Processing
                │
                ▼
   Standardized Medical JSON
                │
                ▼
   Full User Verification Stage
                │
                ▼
      Timeline Builder Engine
                │
                ▼
      Medical Event Nodes
                │
                ▼
     Node Insight Generation
                │
                ▼
     Collective Insight Engine
                │
                ▼
   Persistent POL Bot Analysis
      (Version Controlled)
                │
                ▼
 Deterministic Mutation Engine
                │
                ▼
     Timeline Version Update
                │
                ▼
 Hybrid Reminder Engine
 (Rule-Based + AI Assistance)
                │
                ▼
 Timeline UI + Calendar + Doctor View
```

## Architectural Summary

The Phase 1 AI Timeline is designed around five core principles:

1. **Verified before intelligent** — no AI reasoning occurs until OCR data is reviewed and approved.
2. **Medical Event Nodes as the canonical data model** — preserving chronological context for both users and veterinarians.
3. **Persistent, version-controlled POL Bot Analysis** — storing structured intelligence rather than conversational history.
4. **Deterministic backend control** — AI proposes insights while backend services govern mutations, conflicts, and timeline integrity.
5. **Modular, future-ready architecture** — enabling migration from Gemini to PetOLife's own AI models without redesigning the surrounding system.