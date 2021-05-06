/**************************************************************************
 *  (C) Copyright ModusBox Inc. 2021 - All rights reserved.               *
 *                                                                        *
 *  This file is made available under the terms of the license agreement  *
 *  specified in the corresponding source code repository.                *
 *                                                                        *
 *  ORIGINAL AUTHOR:                                                      *
 *       James Bush - james.bush@modusbox.com                             *
 **************************************************************************/

CREATE DATABASE  IF NOT EXISTS `paymentssor` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `paymentssor`;
-- MySQL dump 10.13  Distrib 8.0.13, for Linux (x86_64)
--
-- Host: 172.20.0.6    Database: paymentssor
-- ------------------------------------------------------
-- Server version   8.0.23

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
 SET NAMES utf8 ;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `transactionRecord`
--

DROP TABLE IF EXISTS `transactionRecord`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
 SET character_set_client = utf8mb4 ;
CREATE TABLE `transactionRecord` (
  `transactionRecordId` bigint NOT NULL AUTO_INCREMENT,
  `uniqueId` varchar(36) NOT NULL,
  `insertTimestamp` timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `eventTimestamp` timestamp(3) NOT NULL,
  `eventType` varchar(128),
  `data` json NOT NULL,
  PRIMARY KEY (`transactionRecordId`),
  KEY `idxUniqueId` (`uniqueId`) USING BTREE,
  KEY `idxInsertTimestamp` (`insertTimestamp`) USING BTREE,
  KEY `idxEventTimestamp` (`eventTimestamp`) USING BTREE,
  KEY `idxEventType` (`eventType`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactionRecord`
--

LOCK TABLES `transactionRecord` WRITE;
/*!40000 ALTER TABLE `transactionRecord` DISABLE KEYS */;
/*!40000 ALTER TABLE `transactionRecord` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'paymentssor'
--

--
-- Dumping routines for database 'paymentssor'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-04-08 14:47:50
