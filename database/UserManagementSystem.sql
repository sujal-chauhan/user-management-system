-- Create Database
CREATE DATABASE IF NOT EXISTS user_management;
USE user_management;

-- Create Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(10) NOT NULL,
  pan_number VARCHAR(10) NOT NULL
);
