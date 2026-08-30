CREATE DATABASE IF NOT EXISTS deepfake_db;

USE deepfake_db;

CREATE TABLE IF NOT EXISTS predictions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    fake_probability FLOAT NOT NULL,
    prediction VARCHAR(10) NOT NULL,
    confidence FLOAT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_predictions_created_at
ON predictions(created_at);
