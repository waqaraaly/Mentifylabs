-- Feature access was an admin-only list that nothing in the app ever read, so it is gone from the code and the
-- three tables behind it go with it. Children first, because they point at `features`.
DROP INDEX IF EXISTS feature_access_logs_feature_idx;
DROP TABLE IF EXISTS feature_access_logs;
DROP TABLE IF EXISTS feature_access;
DROP TABLE IF EXISTS features;
