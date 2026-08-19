-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: leadgrowth_db
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) NOT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `user_id` bigint DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5bm1lt4f4eevt8lv2517soakd` (`user_id`),
  KEY `FKkap2qm3rkywkdvtejawd2vq63` (`workspace_id`),
  CONSTRAINT `FK5bm1lt4f4eevt8lv2517soakd` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKkap2qm3rkywkdvtejawd2vq63` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ad_metrics`
--

DROP TABLE IF EXISTS `ad_metrics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ad_metrics` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `clicks` int DEFAULT NULL,
  `conversions` int DEFAULT NULL,
  `date` date NOT NULL,
  `impressions` int DEFAULT NULL,
  `platform` varchar(50) DEFAULT NULL,
  `spend` decimal(12,2) DEFAULT NULL,
  `campaign_id` bigint DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKgk354t9096mxyixcfo4vkhk4i` (`campaign_id`),
  KEY `FKbm45ly0acn4knyhgv9mi34gcr` (`workspace_id`),
  CONSTRAINT `FKbm45ly0acn4knyhgv9mi34gcr` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKgk354t9096mxyixcfo4vkhk4i` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `assignment_logs`
--

DROP TABLE IF EXISTS `assignment_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `assignment_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `algorithm_details` text,
  `assigned_at` datetime(6) NOT NULL,
  `entity_id` bigint NOT NULL,
  `entity_type` varchar(20) NOT NULL,
  `assigned_to_id` bigint DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmmhn11w1m5sx04t7pemonm18a` (`assigned_to_id`),
  KEY `FK4q6u29vubc1vrhb0uhmci32wh` (`workspace_id`),
  CONSTRAINT `FK4q6u29vubc1vrhb0uhmci32wh` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKmmhn11w1m5sx04t7pemonm18a` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text,
  `ip_address` varchar(255) DEFAULT NULL,
  `target_id` bigint DEFAULT NULL,
  `target_type` varchar(255) DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKjs4iimve3y0xssbtve5ysyef0` (`user_id`),
  KEY `FK2a2ijgeb0gr2y846o22icl0gg` (`workspace_id`),
  CONSTRAINT `FK2a2ijgeb0gr2y846o22icl0gg` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKjs4iimve3y0xssbtve5ysyef0` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `calendar_events`
--

DROP TABLE IF EXISTS `calendar_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calendar_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `all_day` bit(1) DEFAULT NULL,
  `assigned_user_id` bigint DEFAULT NULL,
  `assigned_user_name` varchar(150) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `end_time` datetime(6) NOT NULL,
  `event_type` varchar(30) NOT NULL,
  `lead_id` bigint DEFAULT NULL,
  `lead_name` varchar(150) DEFAULT NULL,
  `lead_stage` varchar(50) DEFAULT NULL,
  `notes` text,
  `priority` varchar(20) DEFAULT NULL,
  `reminder_minutes` int DEFAULT NULL,
  `reminder_sent` bit(1) DEFAULT NULL,
  `source_id` bigint DEFAULT NULL,
  `source_type` varchar(50) DEFAULT NULL,
  `start_time` datetime(6) NOT NULL,
  `status` varchar(20) NOT NULL,
  `title` varchar(150) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKehme86f7hudrd6k8ufvve58ns` (`workspace_id`),
  CONSTRAINT `FKehme86f7hudrd6k8ufvve58ns` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `call_history`
--

DROP TABLE IF EXISTS `call_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `call_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `duration_minutes` double DEFAULT NULL,
  `duration_seconds` bigint DEFAULT NULL,
  `end_time` datetime(6) DEFAULT NULL,
  `formatted_duration` varchar(255) DEFAULT NULL,
  `notes` text,
  `start_time` datetime(6) NOT NULL,
  `status` varchar(255) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `lead_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK2bpmc6h925gcyg00xassoibqv` (`lead_id`),
  KEY `FKcnj8j489pi07wflhiih0c4x61` (`user_id`),
  KEY `FK52gsbqqhhauyppbhvl8grrva0` (`workspace_id`),
  CONSTRAINT `FK2bpmc6h925gcyg00xassoibqv` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`),
  CONSTRAINT `FK52gsbqqhhauyppbhvl8grrva0` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKcnj8j489pi07wflhiih0c4x61` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `campaigns` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `budget` decimal(12,2) DEFAULT NULL,
  `clicks` int DEFAULT NULL,
  `conversions` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `impressions` int DEFAULT NULL,
  `leads_count` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `revenue` decimal(12,2) DEFAULT NULL,
  `spend` decimal(12,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfmhjh7bwtmw86owmjheg67ok8` (`workspace_id`),
  CONSTRAINT `FKfmhjh7bwtmw86owmjheg67ok8` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `email_verification_tokens`
--

DROP TABLE IF EXISTS `email_verification_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `email_verification_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `expiry_date` datetime(6) NOT NULL,
  `token` varchar(100) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKewmvysc7e9y6uy7og2c21axa9` (`token`),
  KEY `FKi1c4mmamlb8keqt74k4lrtwhc` (`user_id`),
  CONSTRAINT `FKi1c4mmamlb8keqt74k4lrtwhc` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `followup_reminders`
--

DROP TABLE IF EXISTS `followup_reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `followup_reminders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `next_followup_date` datetime(6) DEFAULT NULL,
  `notes` text,
  `outcome` varchar(255) DEFAULT NULL,
  `remarks` text,
  `scheduled_at` datetime(6) NOT NULL,
  `status` varchar(255) NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `assigned_to_id` bigint NOT NULL,
  `created_by_id` bigint DEFAULT NULL,
  `lead_id` bigint NOT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKpu1whskxymahwnaougcsnd1vc` (`assigned_to_id`),
  KEY `FKaqgvi7i9ggfrih9m1nk4dpqbi` (`created_by_id`),
  KEY `FKnitplriybcbbnv4a4hsb66eg6` (`lead_id`),
  KEY `FKm669jt3b1i8j10ehcptuoiq9m` (`workspace_id`),
  CONSTRAINT `FKaqgvi7i9ggfrih9m1nk4dpqbi` FOREIGN KEY (`created_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKm669jt3b1i8j10ehcptuoiq9m` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKnitplriybcbbnv4a4hsb66eg6` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`),
  CONSTRAINT `FKpu1whskxymahwnaougcsnd1vc` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `integrations`
--

DROP TABLE IF EXISTS `integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `integrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `api_key` varchar(500) DEFAULT NULL,
  `last_synced_at` datetime(6) DEFAULT NULL,
  `platform` varchar(50) NOT NULL,
  `status` varchar(20) DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKbrb65h3gd37lif5f9nyvrtwuv` (`workspace_id`),
  CONSTRAINT `FKbrb65h3gd37lif5f9nyvrtwuv` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_activities`
--

DROP TABLE IF EXISTS `lead_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_type` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text,
  `title` varchar(200) NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `lead_id` bigint NOT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKg9whjr2rihg0abybh98hi9j2o` (`user_id`),
  KEY `FKle7c8q5nrqmbyt6ewdijgoqqw` (`lead_id`),
  KEY `FKjc9ejhu7slli2uocx7wm3k3ws` (`workspace_id`),
  CONSTRAINT `FKg9whjr2rihg0abybh98hi9j2o` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKjc9ejhu7slli2uocx7wm3k3ws` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKle7c8q5nrqmbyt6ewdijgoqqw` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_assignment_history`
--

DROP TABLE IF EXISTS `lead_assignment_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_assignment_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `assigned_at` datetime(6) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `assigned_by_id` bigint NOT NULL,
  `from_user_id` bigint DEFAULT NULL,
  `lead_id` bigint NOT NULL,
  `to_user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK77mbgdkudxelx3x5yjgytje4g` (`assigned_by_id`),
  KEY `FKihmar7fsfxr5u3kqwsfos9070` (`from_user_id`),
  KEY `FKkry3h58471q7mn8k7o8fbcrhd` (`lead_id`),
  KEY `FKqp7tnu9pynoe1c1etowgg2wpl` (`to_user_id`),
  CONSTRAINT `FK77mbgdkudxelx3x5yjgytje4g` FOREIGN KEY (`assigned_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKihmar7fsfxr5u3kqwsfos9070` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKkry3h58471q7mn8k7o8fbcrhd` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`),
  CONSTRAINT `FKqp7tnu9pynoe1c1etowgg2wpl` FOREIGN KEY (`to_user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_assignments`
--

DROP TABLE IF EXISTS `lead_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `assigned_at` datetime(6) NOT NULL,
  `lead_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK31y9wc1fqvmuekybhwekcejcy` (`lead_id`),
  KEY `FKeisv35kkckayttt4adjhhkcae` (`user_id`),
  CONSTRAINT `FK31y9wc1fqvmuekybhwekcejcy` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`),
  CONSTRAINT `FKeisv35kkckayttt4adjhhkcae` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_history`
--

DROP TABLE IF EXISTS `lead_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `action` varchar(100) NOT NULL,
  `description` text,
  `new_status` varchar(50) DEFAULT NULL,
  `previous_status` varchar(50) DEFAULT NULL,
  `timestamp` datetime(6) NOT NULL,
  `lead_id` bigint NOT NULL,
  `performed_by_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK5ujkq30qgnxikbcwuvr972yvc` (`lead_id`),
  KEY `FK622heo0qa7o62shhcbmqahgf6` (`performed_by_id`),
  CONSTRAINT `FK5ujkq30qgnxikbcwuvr972yvc` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`),
  CONSTRAINT `FK622heo0qa7o62shhcbmqahgf6` FOREIGN KEY (`performed_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `lead_notes`
--

DROP TABLE IF EXISTS `lead_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_notes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `note` text NOT NULL,
  `lead_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKpgleeh9alpqu33f2ac651l1ae` (`lead_id`),
  KEY `FKfsu3l1635gqrokrpofyck44r8` (`user_id`),
  CONSTRAINT `FKfsu3l1635gqrokrpofyck44r8` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKpgleeh9alpqu33f2ac651l1ae` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `assigned_date` datetime(6) DEFAULT NULL,
  `campaign_name` varchar(100) DEFAULT NULL,
  `client_notes` text,
  `company` varchar(100) DEFAULT NULL,
  `conversion_probability` double DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `due_date` datetime(6) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `last_followup_date` datetime(6) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `priority` varchar(20) DEFAULT NULL,
  `progress_percentage` int DEFAULT NULL,
  `proposal_amount` double DEFAULT NULL,
  `proposal_status` varchar(30) DEFAULT NULL,
  `quality_score` int DEFAULT NULL,
  `quality_tier` varchar(20) DEFAULT NULL,
  `queue_status` varchar(30) DEFAULT NULL,
  `source_platform` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `assigned_by_id` bigint DEFAULT NULL,
  `assigned_to_id` bigint DEFAULT NULL,
  `campaign_id` bigint DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKr3b8qovv2mogf9akd0lwhrx1w` (`assigned_by_id`),
  KEY `FKjebse43efn0rhjmgrkdncxyqr` (`assigned_to_id`),
  KEY `FKf5okqmm1apco959009ic8ptnr` (`campaign_id`),
  KEY `FK25rtn7e8765cx4hygm3e2v33s` (`workspace_id`),
  CONSTRAINT `FK25rtn7e8765cx4hygm3e2v33s` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKf5okqmm1apco959009ic8ptnr` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`),
  CONSTRAINT `FKjebse43efn0rhjmgrkdncxyqr` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKr3b8qovv2mogf9akd0lwhrx1w` FOREIGN KEY (`assigned_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `is_read` bit(1) DEFAULT NULL,
  `message` text,
  `title` varchar(150) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK9y21adhxn0ayjhfocscqox7bh` (`user_id`),
  CONSTRAINT `FK9y21adhxn0ayjhfocscqox7bh` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `expiry_date` datetime(6) NOT NULL,
  `token` varchar(100) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK71lqwbwtklmljk3qlsugr1mig` (`token`),
  KEY `FKk3ndxg5xp6v7wd4gjyusp15gq` (`user_id`),
  CONSTRAINT `FKk3ndxg5xp6v7wd4gjyusp15gq` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `expiry_date` datetime(6) NOT NULL,
  `token` varchar(255) NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKghpmfn23vmxfu3spu3lfg4r2d` (`token`),
  UNIQUE KEY `UK7tdcd6ab5wsgoudnvj7xf1b7l` (`user_id`),
  CONSTRAINT `FK1lih5y2npsf8u5o3vhdb9y0os` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `report_history`
--

DROP TABLE IF EXISTS `report_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report_history` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `end_date` varchar(255) DEFAULT NULL,
  `export_format` varchar(20) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `kpi_summary_json` text,
  `period_filter` varchar(30) NOT NULL,
  `report_category` varchar(50) NOT NULL,
  `start_date` varchar(255) DEFAULT NULL,
  `generated_by_id` bigint DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKncwcyrtgs34buxcjsjknhh4qo` (`generated_by_id`),
  KEY `FKp3edtf89q6hiwpw6m6av5lc9t` (`workspace_id`),
  CONSTRAINT `FKncwcyrtgs34buxcjsjknhh4qo` FOREIGN KEY (`generated_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKp3edtf89q6hiwpw6m6av5lc9t` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `completed_calls` int DEFAULT NULL,
  `completed_leads` int DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `followups_count` int DEFAULT NULL,
  `manager_comment` text,
  `next_day_plan` text,
  `pending_leads` int DEFAULT NULL,
  `problems_faced` text,
  `remarks` text,
  `reviewed_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `submitted_at` datetime(6) DEFAULT NULL,
  `type` varchar(20) NOT NULL,
  `generated_by_id` bigint DEFAULT NULL,
  `reviewed_by_id` bigint DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8gmknif2nrsrculaou0e7ntfi` (`generated_by_id`),
  KEY `FKn1iu2ses25aoxypgjeym3owpl` (`reviewed_by_id`),
  KEY `FKtn0cfkeeclkc53owal8x0fyf2` (`workspace_id`),
  CONSTRAINT `FK8gmknif2nrsrculaou0e7ntfi` FOREIGN KEY (`generated_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKn1iu2ses25aoxypgjeym3owpl` FOREIGN KEY (`reviewed_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKtn0cfkeeclkc53owal8x0fyf2` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKofx66keruapi6vyqpv6f2or37` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales_activities`
--

DROP TABLE IF EXISTS `sales_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_activities` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_key` varchar(50) NOT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `completion_remarks` text,
  `created_at` datetime(6) DEFAULT NULL,
  `remarks` text,
  `status` varchar(20) NOT NULL,
  `title` varchar(100) NOT NULL,
  `completed_by_id` bigint DEFAULT NULL,
  `lead_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKibu1r8janiwdmajbhs7wjwki8` (`completed_by_id`),
  KEY `FKjqr5yqgq23vhuns84naqs8910` (`lead_id`),
  CONSTRAINT `FKibu1r8janiwdmajbhs7wjwki8` FOREIGN KEY (`completed_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKjqr5yqgq23vhuns84naqs8910` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sales_activity_logs`
--

DROP TABLE IF EXISTS `sales_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales_activity_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `activity_number` int NOT NULL,
  `attachments` text,
  `communication_type` varchar(50) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `duration` varchar(30) DEFAULT NULL,
  `next_followup_date` datetime(6) DEFAULT NULL,
  `outcome` varchar(50) NOT NULL,
  `remarks` text,
  `status` varchar(30) NOT NULL,
  `lead_id` bigint NOT NULL,
  `logged_by_id` bigint NOT NULL,
  `sales_activity_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKrm74vcfdtb7xyub9vsbn26pgd` (`lead_id`),
  KEY `FK8nda3kaluqbc670r06riemdq8` (`logged_by_id`),
  KEY `FKgmdu52eah1wec1ubcyav46w6f` (`sales_activity_id`),
  CONSTRAINT `FK8nda3kaluqbc670r06riemdq8` FOREIGN KEY (`logged_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKgmdu52eah1wec1ubcyav46w6f` FOREIGN KEY (`sales_activity_id`) REFERENCES `sales_activities` (`id`),
  CONSTRAINT `FKrm74vcfdtb7xyub9vsbn26pgd` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scheduled_tasks`
--

DROP TABLE IF EXISTS `scheduled_tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheduled_tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `new_due_date` date NOT NULL,
  `new_due_time` varchar(20) DEFAULT NULL,
  `new_priority` varchar(20) DEFAULT NULL,
  `notes` text,
  `old_due_date` date DEFAULT NULL,
  `old_due_time` varchar(20) DEFAULT NULL,
  `old_priority` varchar(20) DEFAULT NULL,
  `reminder_minutes` int DEFAULT NULL,
  `rescheduled_by_id` bigint DEFAULT NULL,
  `task_id` bigint NOT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKoof5uiole4bbjfod9f8ijkx0` (`rescheduled_by_id`),
  KEY `FKtqycf4ve43gna4p5q2laxwx7a` (`task_id`),
  KEY `FK3voxf5wuybsf9ajidjww2lb5k` (`workspace_id`),
  CONSTRAINT `FK3voxf5wuybsf9ajidjww2lb5k` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKoof5uiole4bbjfod9f8ijkx0` FOREIGN KEY (`rescheduled_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKtqycf4ve43gna4p5q2laxwx7a` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `sync_logs`
--

DROP TABLE IF EXISTS `sync_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sync_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `details` text,
  `platform` varchar(50) DEFAULT NULL,
  `status` varchar(20) DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKfo0ujwl5bpe2i19kthpdtpiak` (`workspace_id`),
  CONSTRAINT `FKfo0ujwl5bpe2i19kthpdtpiak` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=343 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `task_assignments`
--

DROP TABLE IF EXISTS `task_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `task_assignments` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `assigned_at` datetime(6) NOT NULL,
  `assigned_by_id` bigint DEFAULT NULL,
  `task_id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKtovnr7ljpnvn7expvkeptfyel` (`assigned_by_id`),
  KEY `FKk36vhf9tt6t3woselwnkis6v6` (`task_id`),
  KEY `FKovnod7lqp56uups16si7jh6uu` (`user_id`),
  CONSTRAINT `FKk36vhf9tt6t3woselwnkis6v6` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`),
  CONSTRAINT `FKovnod7lqp56uups16si7jh6uu` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKtovnr7ljpnvn7expvkeptfyel` FOREIGN KEY (`assigned_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `assigned_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `description` text,
  `due_date` date DEFAULT NULL,
  `due_time` varchar(20) DEFAULT NULL,
  `priority` varchar(20) DEFAULT NULL,
  `reminder_minutes` int DEFAULT NULL,
  `reschedule_count` int DEFAULT NULL,
  `reschedule_notes` text,
  `status` varchar(20) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `assigned_by_id` bigint DEFAULT NULL,
  `assigned_to_id` bigint DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKk223sqirb7d32pd0rbgips492` (`assigned_by_id`),
  KEY `FK4516wfa828r15k9u3iw5er4vi` (`assigned_to_id`),
  KEY `FKc9qtufdiesth3hltky4dnacje` (`workspace_id`),
  CONSTRAINT `FK4516wfa828r15k9u3iw5er4vi` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKc9qtufdiesth3hltky4dnacje` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKk223sqirb7d32pd0rbgips492` FOREIGN KEY (`assigned_by_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_productivity`
--

DROP TABLE IF EXISTS `user_productivity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_productivity` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `average_response_time` double NOT NULL,
  `completed_leads_count` int NOT NULL,
  `completed_tasks_count` int NOT NULL,
  `conversion_rate` double NOT NULL,
  `record_date` date NOT NULL,
  `productivity_score` double NOT NULL,
  `user_id` bigint NOT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKaransfrdvcik6j9uwiggmbsyl` (`user_id`),
  KEY `FKa8f4q7g23hyu42ba5ngbqnltu` (`workspace_id`),
  CONSTRAINT `FKa8f4q7g23hyu42ba5ngbqnltu` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`),
  CONSTRAINT `FKaransfrdvcik6j9uwiggmbsyl` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` bigint NOT NULL,
  `role_id` bigint NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `FKh8ciramu9cc9q3qcqiv4ue8a6` (`role_id`),
  CONSTRAINT `FKh8ciramu9cc9q3qcqiv4ue8a6` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `FKhfh9dx7w3ubf1co1vdev94g3f` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) DEFAULT NULL,
  `is_expired` bit(1) NOT NULL,
  `last_active_time` datetime(6) NOT NULL,
  `login_time` datetime(6) NOT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `user_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8klxsgb8dcjjklmqebqp1twd5` (`user_id`),
  CONSTRAINT `FK8klxsgb8dcjjklmqebqp1twd5` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `availability_status` varchar(20) NOT NULL,
  `bio` text,
  `created_at` datetime(6) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `is_email_verified` bit(1) NOT NULL,
  `last_active_at` datetime(6) DEFAULT NULL,
  `last_assigned_at` datetime(6) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_image` longtext,
  `status` varchar(20) NOT NULL,
  `workspace_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UK6dotkott2kjsp8vw4d0m25fb7` (`email`),
  KEY `FK1hj24ju99ddbjpnv66ycum2k6` (`workspace_id`),
  CONSTRAINT `FK1hj24ju99ddbjpnv66ycum2k6` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workspace_invites`
--

DROP TABLE IF EXISTS `workspace_invites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspace_invites` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `expiry_date` datetime(6) DEFAULT NULL,
  `role` varchar(50) NOT NULL,
  `status` varchar(20) NOT NULL,
  `token` varchar(100) NOT NULL,
  `expires_at` datetime(6) NOT NULL,
  `invited_by_id` bigint DEFAULT NULL,
  `workspace_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKrk9vrwn7cyfstdvuhxof5ofxa` (`token`),
  KEY `FKfw8yt6m5q499guljqtrqgu7w7` (`invited_by_id`),
  KEY `FKjgai7acsn6tey02gqqcfl2m6a` (`workspace_id`),
  CONSTRAINT `FKfw8yt6m5q499guljqtrqgu7w7` FOREIGN KEY (`invited_by_id`) REFERENCES `users` (`id`),
  CONSTRAINT `FKjgai7acsn6tey02gqqcfl2m6a` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `workspaces`
--

DROP TABLE IF EXISTS `workspaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `workspaces` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `company_name` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT NULL,
  `industry` varchar(50) DEFAULT NULL,
  `invite_code` varchar(50) NOT NULL,
  `max_leads` int DEFAULT NULL,
  `max_storage_mb` int DEFAULT NULL,
  `max_users` int DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `subscription_plan` varchar(30) NOT NULL,
  `team_size` int DEFAULT NULL,
  `timezone` varchar(50) DEFAULT NULL,
  `website` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKf8gr92weadyqi5dnikyf9b354` (`invite_code`),
  UNIQUE KEY `UK5n2kj8tecruebslxu9fm3k3t3` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-19 13:57:38
