-- Transfer the existing report to the current admin user
UPDATE saved_reports 
SET user_id = '1088baf3-40e3-4dfb-b3ac-a3081071b313'
WHERE user_id = 'ee2f12ba-cd23-444d-8511-8256588e3e3d';