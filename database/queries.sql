USE deepfake_db;

-- View all predictions
SELECT *
FROM predictions
ORDER BY created_at DESC;

-- View recent predictions
SELECT *
FROM predictions
ORDER BY created_at DESC
LIMIT 10;

-- View only FAKE predictions
SELECT *
FROM predictions
WHERE prediction = 'FAKE'
ORDER BY created_at DESC;

-- View only REAL predictions
SELECT *
FROM predictions
WHERE prediction = 'REAL'
ORDER BY created_at DESC;

-- Count total predictions
SELECT COUNT(*) AS total_predictions
FROM predictions;

-- Count REAL vs FAKE predictions
SELECT prediction, COUNT(*) AS total
FROM predictions
GROUP BY prediction;

-- Average confidence
SELECT AVG(confidence) AS average_confidence
FROM predictions;

-- Delete a prediction by ID
DELETE FROM predictions
WHERE id = 1;
