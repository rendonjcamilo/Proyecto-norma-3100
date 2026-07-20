-- Fix criterion.number to match the hierarchical numbering already present in the
-- criterion name text (e.g. "4.1. Convenio vigente..." should have number='4.1',
-- not a sequential id like '5'). 339 rows affected system-wide.
--
-- Root cause: the frontend's expand/collapse-subitems feature (AssessmentForm.tsx,
-- getHierarchicalNumber/getBranchChildIds) detects parent-child relationships by
-- checking whether a criterion's `number` field starts with its parent's `number`
-- followed by '.'. Where `number` holds a flat sequential value instead of the real
-- hierarchical notation, no children are ever detected and the collapse UI never
-- appears for that parent -- exactly what was observed for criterion "4." (Anexo 4 /
-- escenario de práctica formativa) during testing 2026-07-19.
UPDATE evaluation_criteria
SET number = (regexp_match(name, '^(\d+\.\d+(?:\.\d+)*)'))[1]
WHERE name ~ '^\d+\.\d+'
  AND number IS DISTINCT FROM (regexp_match(name, '^(\d+\.\d+(?:\.\d+)*)'))[1];
