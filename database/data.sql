USE deepfake_db;

INSERT INTO predictions
    (filename, fake_probability, prediction, confidence)
VALUES
    ('sample_real.mp4', 0.08, 'REAL', 0.92),
    ('sample_fake.mp4', 0.94, 'FAKE', 0.94);
