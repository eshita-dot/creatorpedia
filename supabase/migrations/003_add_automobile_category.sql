-- Add 'automobile' to creators category check constraint
ALTER TABLE creators DROP CONSTRAINT IF EXISTS creators_category_check;

ALTER TABLE creators
  ADD CONSTRAINT creators_category_check
  CHECK (category IN (
    'beauty','fitness','finance','food','travel',
    'tech','fashion','lifestyle','gaming','entertainment','parenting',
    'automobile'
  ));
