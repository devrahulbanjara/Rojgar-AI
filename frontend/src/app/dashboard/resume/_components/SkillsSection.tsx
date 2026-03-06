"use client";

import { useState } from "react";

// ── Skills chip input ──────────────────────────────────────────────────────

export default function SkillsSection({
  skills,
  onAdd,
  onRemove,
}: {
  skills: string[];
  onAdd: (s: string) => void;
  onRemove: (s: string) => void;
}) {
  const [input, setInput] = useState("");

  function handleAdd() {
    if (input.trim()) {
      onAdd(input.trim());
      setInput("");
    }
  }

  return (
    <div className="resume-section">
      <div className="resume-section__title">Skills</div>
      <div className="skills-input-row">
        <input
          className="resume-field__input"
          placeholder="Add a skill (e.g. Figma)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
        />
        <button className="btn btn--primary btn--sm" onClick={handleAdd}>
          Add
        </button>
      </div>
      <div className="resume-skills-wrap">
        {skills.map((sk) => (
          <div className="resume-skill-chip" key={sk}>
            {sk}
            <button
              className="resume-skill-chip__remove"
              onClick={() => onRemove(sk)}
              aria-label={`Remove ${sk}`}
            >
              x
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
