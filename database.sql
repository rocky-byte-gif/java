-- Database script for MediSync Lite - Clinic Management System
-- [Practical 10] MySQL Database and Table Creation

CREATE DATABASE IF NOT EXISTS medisync;
USE medisync;

DROP TABLE IF EXISTS bill;
DROP TABLE IF EXISTS record;
DROP TABLE IF EXISTS appointment;
DROP TABLE IF EXISTS doctor;
DROP TABLE IF EXISTS patient;

CREATE TABLE patient (
    id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(50),
    age INT,
    phone VARCHAR(15),
    blood_group VARCHAR(5),
    allergies VARCHAR(100)
);

CREATE TABLE doctor (
    id INT PRIMARY KEY,
    name VARCHAR(40),
    specialization VARCHAR(30)
);

CREATE TABLE appointment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(20),
    doctor_id INT,
    slot_time VARCHAR(10),
    status VARCHAR(15)
);

CREATE TABLE record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(20),
    diagnosis VARCHAR(200),
    prescription VARCHAR(200),
    doctor_name VARCHAR(40),
    date_text VARCHAR(20)
);

CREATE TABLE bill (
    id INT PRIMARY KEY,
    patient_id VARCHAR(20),
    consultation DOUBLE,
    medicine DOUBLE,
    test_fee DOUBLE,
    total DOUBLE,
    status VARCHAR(15)
);

-- Default doctors
INSERT INTO doctor VALUES (1, 'Dr. Mehta', 'General');
INSERT INTO doctor VALUES (2, 'Dr. Rao', 'Cardiology');
INSERT INTO doctor VALUES (3, 'Dr. Khan', 'Pediatrics');

-- Default sample patients
INSERT INTO patient VALUES ('MS-2026-0001', 'Aarav Sharma', 32, '9876543210', 'B+', 'None');
INSERT INTO patient VALUES ('MS-2026-0002', 'Sunita Deshmukh', 45, '9822334455', 'O+', 'Penicillin');
INSERT INTO patient VALUES ('MS-2026-0003', 'Vikram Joshi', 28, '9123456789', 'A+', 'Dust');

INSERT INTO patient VALUES ('MS-2026-0004', 'Neha Kulkarni', 36, '9988776655', 'AB+', 'None');
INSERT INTO patient VALUES ('MS-2026-0005', 'Rahul Patil', 52, '9765432109', 'O-', 'Sulfa drugs');
INSERT INTO patient VALUES ('MS-2026-0006', 'Ananya Iyer', 8, '9812345670', 'B-', 'Peanuts');

-- Waitlist (used by the app when a slot is already taken)
DROP TABLE IF EXISTS waitlist;
CREATE TABLE waitlist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(20),
    doctor_id INT,
    slot_time VARCHAR(10),
    queued_at VARCHAR(30)
);
