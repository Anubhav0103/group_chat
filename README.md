# Real-Time Group Chat Application

This is a full-stack, real-time group chat application built with Node.js, Express, MySQL, and Socket.IO. It provides a robust platform for users to create groups, invite members, and communicate through text messages and file sharing, with all shared files securely stored on AWS S3.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [File Structure](#file-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Configuration](#installation--configuration)
  - [Running the Application](#running-the-application)
- [License](#license)

## Overview

This application offers a complete chat solution with a modern, responsive user interface. Users can sign up, log in, create their own chat groups, or join existing ones via invitations. The real-time messaging is powered by WebSockets, and the integration with AWS S3 allows for efficient and scalable handling of multimedia file sharing.

## Key Features

- **User Authentication:** Secure user registration and login using JWT (JSON Web Tokens).
- **Real-Time Messaging:** Instant message delivery and reception powered by **Socket.IO**.
- **Group Management:**
    - Create and delete chat groups.
    - View a list of all joined groups and seamlessly switch between them.
- **Member Management:**
    - View all members within a group.
    - Group admins can invite new users via email.
    - Admins can promote members to admin status or remove them from the group.
- **Secure File Sharing:**
    - Attach and upload any file type to the chat.
    - Files are uploaded directly to a private **AWS S3 bucket**.
    - The application generates secure, pre-signed URLs for safe, temporary access to download files.
- **Scheduled Tasks:** Utilizes `node-cron` for potential background tasks, such as archiving old messages or data cleanup.
- **Responsive UI:** A clean and intuitive three-panel chat interface that works across different screen sizes.

## Tech Stack

- **Backend:**
  - **Runtime:** Node.js
  - **Framework:** Express.js
  - **Database:** MySQL (with `mysql2` driver)
  - **Real-Time Communication:** Socket.IO
  - **Authentication:** bcrypt (password hashing), JSON Web Tokens (JWT)
  - **File Handling:** AWS SDK for S3, Multer for multipart/form-data
  - **Environment:** dotenv
  - **Scheduling:** node-cron

- **Frontend:**
  - **Structure:** HTML5
  - **Styling:** CSS3 (custom, responsive design)
  - **Logic:** Vanilla JavaScript (ES modules)
  - **Client-side Libraries:** Socket.IO Client, jwt-decode

- **Development:**
  - **Server:** Nodemon for automatic live-reloading

## File Structure

group_chat-main/
├── .env                  # Environment variables (DB credentials, JWT secret, AWS keys)
├── .gitignore            # Files to be ignored by Git
├── README.md             # Project documentation (provided)
├── package.json          # Project dependencies and scripts (provided)
├── server.js             # Main application entry point (sets up server, sockets)
│
├── config/
│   └── database.js       # MySQL database connection configuration
│
├── controllers/
│   ├── chatController.js   # Logic for sending/getting messages, file uploads
│   ├── groupController.js  # Logic for creating/deleting groups, managing members
│   └── userController.js   # Logic for user signup, login, and authentication
│
├── middleware/
│   └── auth.js             # JWT verification middleware to protect routes
│
├── models/
│   ├── Chat.js             # Sequelize/MySQL model for the Chat/Message table
│   ├── Group.js            # Sequelize/MySQL model for the Group table
│   ├── User.js             # Sequelize/MySQL model for the User table
│   └── UserGroup.js        # Sequelize/MySQL model for the User-Group join table (many-to-many)
│
├── routes/
│   ├── chatRoutes.js       # Defines API routes for messages (/get-messages, /send-file)
│   ├── groupRoutes.js      # Defines API routes for groups (/create, /invite, /remove-member)
│   └── userRoutes.js       # Defines API routes for users (/signup, /login)
│
├── services/
│   └── s3Service.js        # Handles all AWS S3 logic (uploading, getting pre-signed URLs)
│
└── views/
    ├── chat.html           # Main chat application page (provided)
    ├── login.html          # User login page (provided)
    ├── signup.html         # User signup page (provided)
    │
    ├── js/
    │   ├── chat.js         # Frontend logic for the chat page
    │   ├── login.js        # Frontend logic for the login page
    │   └── signup.js       # Frontend logic for the signup page
    │
    └── style/
        └── styles.css      # All CSS styles for the application (provided)

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- **Node.js:** v14.0.0 or higher
- **NPM:** (comes with Node.js)
- **MySQL:** A running instance of a MySQL server.
- **AWS Account:** An AWS account with an S3 bucket created and IAM credentials (Access Key ID & Secret Access Key) with S3 permissions.

### Installation & Configuration

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/group_chat-main.git
    cd group_chat-main
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of the project and add the following configuration details. Replace the placeholder values with your actual credentials.

    ```env
    # Server Port
    PORT=3000

    # JWT Secret Key for signing tokens
    JWT_SECRET=your_strong_jwt_secret_key

    # MySQL Database Connection
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_mysql_password
    DB_NAME=your_chat_database_name

    # AWS Credentials for S3 File Storage
    AWS_ACCESS_KEY_ID=your_aws_access_key
    AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
    AWS_REGION=your_s3_bucket_region # e.g., us-east-1
    S3_BUCKET_NAME=your_unique_s3_bucket_name
    ```

4.  **Database Setup:**
    - Connect to your MySQL server.
    - Create a new database with the name you provided for `DB_NAME` in your `.env` file.
    - The necessary tables should be created automatically by the application on its first run (if Sequelize or a similar ORM is configured in `server.js`). Otherwise, you may need to run a SQL schema script.

### Running the Application

1.  **For development (with auto-reload):**
    ```sh
    npm run dev
    ```

2.  **For production:**
    ```sh
    npm start
    ```

Once the server is running, open your browser and navigate to `http://localhost:3000` (or the port you configured).

