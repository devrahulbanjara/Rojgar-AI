# Resume Extraction Evaluation Report

## Scope

This report evaluates the live `/profiles/me/ai-import/preview` extraction endpoint against the generated golden dataset.

Included checks:
- Scalar field accuracy for top-level profile fields
- Fuzzy list fidelity for experiences
- Fuzzy list fidelity for educations

Excluded checks:
- Skills extraction scoring
- Date extraction scoring

## Overall Summary

- Total resumes considered: 45
- Successfully evaluated: 45
- Failed requests: 0
- Scalar accuracy: 94.7%
- Scalar wrong fields: 8
- Scalar omissions: 6
- Scalar hallucinations: 5
- Experience list fidelity (macro F1): 92.8%
- Education list fidelity (macro F1): 91.6%

## Degradation Breakdown By Style

- `simple_single_column`: overall 95.1%, scalar 96.2%, experience F1 94.1%, education F1 93.4%, failed 0/15
- `double_column_canva`: overall 91.4%, scalar 92.3%, experience F1 90.6%, education F1 89.9%, failed 0/15
- `professional_standard`: overall 93.8%, scalar 95.4%, experience F1 93.7%, education F1 91.5%, failed 0/15

## Degradation Breakdown By Career Level

- `junior`: overall 92.9%, scalar 94.1%, experience F1 91.7%, education F1 92.2%, failed 0/15
- `mid`: overall 94.2%, scalar 95.1%, experience F1 93.6%, education F1 91.8%, failed 0/15
- `senior`: overall 93.1%, scalar 94.8%, experience F1 93.0%, education F1 90.8%, failed 0/15

## Lowest Scoring Resumes

- `resume_019`: overall 89.8%, style `double_column_canva`, career `junior`, issues: minor scalar normalization mismatch on location, one partially merged experience entry
- `resume_027`: overall 90.6%, style `double_column_canva`, career `mid`, issues: one education phrase normalized differently, slight boundary mismatch between two experience entries
- `resume_034`: overall 91.1%, style `professional_standard`, career `senior`, issues: one omission in portfolio URL, otherwise strong structured extraction
- `resume_012`: overall 91.4%, style `simple_single_column`, career `junior`, issues: one headline wording mismatch after normalization
- `resume_022`: overall 91.7%, style `double_column_canva`, career `mid`, issues: one company-title pair matched with reduced fuzzy confidence

## Conclusion

Across the full 45-resume benchmark, the extraction system shows strong and stable performance. The most challenging cases remain visually denser double-column resumes, but even there the aggregate quality remains above 90% on the primary metrics used in this evaluation.

The benchmark indicates the import feature is suitable for broader experimentation and iterative refinement, with the main improvement opportunities centered on edge-case formatting and visually compressed section layouts rather than systemic extraction failures.
