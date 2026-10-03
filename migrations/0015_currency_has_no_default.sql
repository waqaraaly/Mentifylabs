-- A practitioner's currency must always be chosen explicitly. Until now the column quietly defaulted to 'PKR', so
-- any code that forgot to set it would put the wrong currency on a profile without anyone noticing.
--
-- SQLite can't change a column's default in place, and rebuilding the whole practitioners table would risk the
-- rows of every table that points at it. Instead the values move to a new column that has no default:
--   1. add the new column, 2. copy every currency across, 3. drop the old column, 4. rename the new one.
-- The table itself is never dropped, so nothing else is touched.
ALTER TABLE practitioners ADD COLUMN fee_currency_new TEXT;
UPDATE practitioners SET fee_currency_new = fee_currency;
ALTER TABLE practitioners DROP COLUMN fee_currency;
ALTER TABLE practitioners RENAME COLUMN fee_currency_new TO fee_currency;

-- With no default and no NOT NULL (a column added later can't have one), these two rules do the same job:
-- a practitioner can't be created or changed to have a missing or blank currency.
CREATE TRIGGER practitioners_currency_required_on_insert
BEFORE INSERT ON practitioners
WHEN NEW.fee_currency IS NULL OR trim(NEW.fee_currency) = ''
BEGIN
  SELECT RAISE(ABORT, 'fee_currency is required: choose a currency for every practitioner');
END;

CREATE TRIGGER practitioners_currency_required_on_update
BEFORE UPDATE OF fee_currency ON practitioners
WHEN NEW.fee_currency IS NULL OR trim(NEW.fee_currency) = ''
BEGIN
  SELECT RAISE(ABORT, 'fee_currency is required: choose a currency for every practitioner');
END;
