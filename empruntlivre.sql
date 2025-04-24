-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 24 avr. 2025 à 12:23
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `empruntlivre`
--

-- --------------------------------------------------------

--
-- Structure de la table `books`
--

CREATE TABLE `books` (
  `id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `author` varchar(100) NOT NULL,
  `isbn` varchar(20) DEFAULT NULL,
  `cover_url` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `total_copies` int(11) NOT NULL DEFAULT 1,
  `available_copies` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `genre` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `books`
--

INSERT INTO `books` (`id`, `title`, `author`, `isbn`, `cover_url`, `description`, `total_copies`, `available_copies`, `created_at`, `genre`) VALUES
(1, 'The Very Hungry Caterpillar1', 'Eric Carle1', '97803992269083', 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Flivre-emprunt-37321734-ae72-4057-9d0f-a316fb1102ba/ImagePicker/cae7ad95-7c90-438a-97c7-889772e537a0.jpeg', 'A classic children\'s book that follows a caterpillar as it eats its way through different foods before transforming into a butterfly..\n', 7, 2, '2025-03-23 15:34:20', 'Fiction 1'),
(4, 'A Journey to the moon 🌙', 'Jules Verne ', '978014044905112', 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Flivre-emprunt-37321734-ae72-4057-9d0f-a316fb1102ba/ImagePicker/0eba9ac8-7793-457c-8f87-021cf6c46e67.jpeg', 'Published in 1865, this novel is one of the earliest examples of science fiction. It tells the story of the Baltimore Gun Club, which embarks on an ambitious project to launch a manned capsule to the moon using a giant cannon. The novel mixes scientific curiosity with humor, adventure, and visionary imagination.', 9, 5, '2025-04-04 14:31:09', ' Fiction'),
(5, 'Harry Potter and the Goblet of Fire', 'J.K. Rowling', '9780747550990', 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Flivre-emprunt-37321734-ae72-4057-9d0f-a316fb1102ba/ImagePicker/6b188eed-b561-4aff-8a2e-5ab6aa9ca951.jpeg', 'In the fourth book of the Harry Potter series, Harry returns to Hogwarts for his fourth year — only to find the school hosting the prestigious Triwizard Tournament, a magical competition between three schools. Mysteriously, Harry\'s name is entered into the contest, even though he\'s underage. As he faces dangerous challenges, he begins to uncover dark forces rising in the wizarding world — and the return of Lord Voldemort looms closer than ever.', 8, 7, '2025-04-04 14:37:27', 'Adventure'),
(10, 'Book MODIF', 'jack', '1234567890', 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Flivre-emprunt-37321734-ae72-4057-9d0f-a316fb1102ba/ImagePicker/e54f6486-4d35-460a-b2f0-58ccf654c3fa.jpeg', 'BOOK FICTION\nmodif\n', 7, 7, '2025-04-23 20:10:52', 'Fiction');

-- --------------------------------------------------------

--
-- Structure de la table `loans`
--

CREATE TABLE `loans` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `book_id` int(11) NOT NULL,
  `borrowed_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `due_date` timestamp NULL DEFAULT NULL,
  `returned_date` timestamp NULL DEFAULT NULL,
  `status` enum('active','returned','overdue') DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `loans`
--

INSERT INTO `loans` (`id`, `user_id`, `book_id`, `borrowed_date`, `due_date`, `returned_date`, `status`) VALUES
(5, 2, 1, '2025-04-05 00:19:14', '2025-04-18 23:19:14', '2025-04-22 21:58:55', 'returned'),
(6, 3, 1, '2025-04-08 15:50:54', '2025-04-22 15:50:54', NULL, 'active'),
(10, 1, 4, '2025-04-23 06:30:05', '2025-05-07 06:30:05', '2025-04-23 06:30:48', 'returned'),
(11, 2, 1, '2025-04-23 18:04:19', '2025-05-07 18:04:19', NULL, 'active'),
(12, 2, 4, '2025-04-23 18:33:05', '2025-05-07 18:33:05', NULL, 'active'),
(13, 5, 5, '2025-04-23 18:46:57', '2025-05-07 18:46:57', '2025-04-23 18:47:37', 'returned'),
(16, 9, 5, '2025-04-23 20:04:15', '2025-05-07 20:04:15', '2025-04-23 20:04:54', 'returned');

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `related_id` int(11) DEFAULT NULL,
  `read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `notifications`
--

INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `related_id`, `read`, `created_at`) VALUES
(3, 3, 'Borrow Confirmed', 'You borrowed \"Basketball 🏀🏀\". Return date: 4/22/2025', 'loan', 3, 0, '2025-04-08 16:02:59'),
(4, 1, 'Borrow Confirmed', 'You borrowed \"The Very Hungry Caterpillar\". Return date: 5/2/2025', 'loan', 1, 0, '2025-04-18 22:24:56'),
(9, 1, 'Borrow Confirmed', 'You borrowed \"A Journey to the Moon\". Return date: 5/7/2025', 'loan', 4, 0, '2025-04-23 06:30:06'),
(10, 5, 'Borrow Confirmed', 'You borrowed \"Harry Potter and the Goblet of Fire\". Return date: 5/7/2025', 'loan', 5, 1, '2025-04-23 18:46:58'),
(12, 8, 'Borrow Confirmed', 'You borrowed \"Harry Potter and the Goblet of Fire\". Return date: 5/7/2025', 'loan', 5, 0, '2025-04-23 19:53:26'),
(13, 9, 'Borrow Confirmed', 'You borrowed \"Harry Potter and the Goblet of Fire\". Return date: 5/7/2025', 'loan', 5, 0, '2025-04-23 20:04:16');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `telephone` varchar(50) NOT NULL,
  `cin` varchar(50) NOT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `telephone`, `cin`, `is_admin`, `created_at`, `reset_token`, `reset_token_expiry`, `profile_image`) VALUES
(1, '', '$2b$10$kLML67nuxRaeRCyOx2rkEuXmaoGgCZFNmp2k/uHh7KsFJdcQkfv0u', '', '212651158648', 'M666667', 0, '2025-03-20 00:45:24', '', NULL, 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Flivre-emprunt-37321734-ae72-4057-9d0f-a316fb1102ba/ImagePicker/e8219fdb-68af-4e28-869d-904ca4902afb.jpeg'),
(2, 'yasmineFK', '$2b$10$4nDSgfDPsgadfkLv/.YQk.o1WRX8YHEMgzbys7I1HNjyWHB5ObuR6', 'yasminefkikih219@gmail.com', '0651158648', 'M221213', 1, '2025-03-20 12:06:21', NULL, NULL, NULL),
(3, 'Lara', '$2b$10$bYZz4XKJOSeqedFISUyi7uiH.S96Ntwswhw7w6rCdbC0Z5FBLL6zC', 'yasmineenimsay219@gmail.com', '212789043215', 'M987654', 0, '2025-03-20 21:05:25', '566076', '2025-04-18 19:13:57', NULL),
(5, 'saadFK', '$2b$10$JmmfOVb1g/JjcUWZNnLfSupNEG8tUd5Qb7mfDJD0hcImqmFqAVPKW', 'saad876@gmail.com', '0612345678', 'G123476', 0, '2025-04-23 18:43:26', NULL, NULL, 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Flivre-emprunt-37321734-ae72-4057-9d0f-a316fb1102ba/ImagePicker/4fca920b-0abd-470d-b47e-942d66b4e8b2.jpeg'),
(8, 'samah fk', '$2b$10$r1Ys7hdKirERegyXlAt0SOxY2cDSbEOlwJwSqb/WXjqxYWrNVT51q', 'samah@gmail.com', '0651158640', 'MOUI12', 0, '2025-04-23 19:50:59', NULL, NULL, 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Flivre-emprunt-37321734-ae72-4057-9d0f-a316fb1102ba/ImagePicker/1a98a6c8-805b-4f35-abae-6560438cf311.jpeg'),
(9, 'nonaFK', '$2b$10$ukX.rIm0i8lMBMWNmLsvfuhyTmwQoj9NZUJYj6np4HX2qrMDVqKxe', 'nona12@gmail.com', '0613518640', 'M12E3', 0, '2025-04-23 20:01:59', NULL, NULL, 'file:///data/user/0/host.exp.exponent/cache/ExperienceData/%2540anonymous%252Flivre-emprunt-37321734-ae72-4057-9d0f-a316fb1102ba/ImagePicker/83eb3248-9782-4ad4-a1b8-1d51991365b8.jpeg');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `isbn` (`isbn`);

--
-- Index pour la table `loans`
--
ALTER TABLE `loans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `book_id` (`book_id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_notifications_idx` (`user_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `books`
--
ALTER TABLE `books`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `loans`
--
ALTER TABLE `loans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `loans`
--
ALTER TABLE `loans`
  ADD CONSTRAINT `loans_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `loans_ibfk_2` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`);

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
