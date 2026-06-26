# TeeMatchApp -V1 
TeeMatch is a full-stack web application designed to help golfers connect with other players in their local area who have similar skill levels and availability.

The project was inspired by a common challenge faced by new and developing golfers: finding a consistent community of players to play with. TeeMatch provides a platform where users can create profiles, organise rounds, and connect with potential playing partners, helping to grow both participation in the sport and meaningful social connections.


## Problem Statement

Many golfers, particularly beginners and those new to an area (myself included), struggle to find regular playing partners with similar skill levels. Existing golf platforms primarily focus on booking tee times rather than facilitating community building.
TeeMatch aims to address this gap by providing a platform that enables golfers to discover, organise, and manage rounds with compatible local players.

---
## Live Demo

The application is available at:
**https://teematchapp.onrender.com**

### Demo Account

To explore the application without creating an account, use the following credentials:

Email: [demoTeeMatchApp@gmail.com]
Password: DemoPassword123

Alternatively, you can register your own account to experience the complete signup and profile creation process.

> **Note:** The application is hosted on Render's free tier. If the application has been inactive, the initial request may take up to a minute while the server starts. Thank you for your patience.
 
---

## Users can:
1. Create an account
2. Build a golfer profile
3. Create rounds
4. Browse available rounds
5. Request to join rounds
6. Accept or reject join requests
7. Manage upcoming and past rounds

## Screen shots
Home Page 
![This is the main Homepage that every user lands on, that allows a golfer to login and signup to the app](/myAppScreenShots/home.png)

Dashboard Page
![This is the page you land in once you have once your logged in or signed up to the app. Through here you can get to veiw other pages and also update your own profile data.](/myAppScreenShots/dashboard1.png) .![screenshot 2](/myAppScreenShots/dashboard2.png). ![ screenshot 3](/myAppScreenShots/dashboard3.png)

Create Round Page.
![This is where a user gets to specifiy, where, when and the number of people needed for a round they would like people to join .](/myAppScreenShots/createRound1.png)![screenshort 2](/myAppScreenShots/createRound2.png)

My Rounds Page.
![This is where a user gets to veiw rounds they have created, joined and rounds that they created and have passed. ](/myAppScreenShots/myRounds1.png)![ screenshort 2](/myAppScreenShots/myRounds2.png)![Screenshorts 3, Joined Tab](/myAppScreenShots/myRounds3-J.png) ![Screenshort 4, History Tab](/myAppScreenShots/myRounds4-H.png)

Requests Page.
![This is page a user can veiw the requests that other golfers make to join towards the rounds they have created.](/myAppScreenShots/roundReq1.png) ![screenshort 2, Veiw Golfer Profile](/myAppScreenShots/roundReq2.png)


## Tech Stack

Frontend:
- HTML
- CSS
- JavaScript

Backend:
- Node.js
- Express.js

Database:
- PostgreSQL

Authentication:
- JWT ( Json Web Token)
- bcrypt

Development Tools:
- Git
- GitHub

## Architecture Diagram

## Database Schema

![This is an image of the users, profiles, rounds and round_requests database screenshot with their relationships](/myAppScreenShots/databaseSchema.png)
I have also been able to generate an SQL file of the SQL Queries related in the creation of the databases. [View SQL Query](/myAppScreenShots/databaseSQLQuery.sql)


## Key Features

### Secure User Authentication

Users can create an account and securely log in to TeeMatch. Authentication is handled using JSON Web Tokens (JWT), allowing protected access to user-specific features throughout the application. User passwords are never stored in plain text and are hashed using bcrypt before being saved to the database.

**Key functionality:**
* User registration
* User login
* JWT-based authentication
* Password hashing with bcrypt
* Protected API routes
* Session persistence using local storage

---

### Golfer Profiles

Each user can build and maintain a golfer profile to help other players understand who they are before joining a round.

Profile information includes:
* Handicap
* Home course
* Availability
* Instagram handle
* Phone number
* Location (Postcode)
* Personal bio

Users can update their profile information at any time, with validation performed before data is submitted to the backend.

---

### Round Creation and Management

Users can create golf rounds and specify important details including:
* Golf course
* Date
* Tee time
* Number of players required
* Additional round information

The creator of a round can:
* Edit round details
* Delete rounds
* Manage player requests
* Track round capacity

Rounds automatically become inactive once their scheduled date and time have passed.

---

### Browse Available Rounds

The Browse Rounds page allows golfers to discover active rounds created by other users.

Features include:
* Active rounds only
* Search functionality by golf course
* Round creator overview
* Remaining spots calculation
* Join request functionality

Users cannot browse their own rounds, helping keep the experience focused on finding playing partners.

---

### Join Request Workflow

Rather than allowing instant access to rounds, TeeMatch uses a request-based system that gives round creators control over who joins.

Players can:
* Request to join rounds
* Cancel pending requests
* Leave accepted rounds
* Track request status

Round creators can:
* View requests
* Accept requests
* Reject requests

This workflow mirrors how golfers often organise rounds in real life and gives users greater control over their playing groups.

---

### Dynamic Capacity Management

One of the core challenges solved in TeeMatch was managing round capacity.
Both accepted and pending requests are treated as reserved spots.

This means:
* Full rounds automatically disappear from the Browse page
* Rounds reappear if a player leaves
* Rounds reappear if a request is rejected
* Users cannot overbook rounds

This creates a more realistic booking experience and prevents conflicts between players.

---

### Request and Participation Tracking

Users can monitor all rounds they have interacted with through dedicated sections for:
* Accepted rounds
* Pending requests
* Rejected requests

Accepted rounds display host contact information, making it easier for golfers to coordinate before a round takes place.

---

### Dashboard Experience

A central dashboard provides users with quick access to:
* Profile management
* Create Round
* Browse Rounds
* My Rounds
* View Requests

The dashboard acts as the main navigation hub for the application and was designed with a mobile-first approach.

---

### Responsive User Interface

TeeMatch was designed with mobile users in mind, as many golfers are likely to access the platform from their mobile phone.

Features include:
* Responsive layouts
* Mobile-friendly navigation
* Consistent user experience across devices


---

## Challenges and Solutions

### Managing Round Capacity

#### Challenge
A round requiring two players could potentially receive unlimited join requests, creating confusion for users and making it difficult to manage availability.

#### Solution
A capacity management system was implemented where both accepted and pending requests are treated as reserved spots.
When the number of reserved spots reaches the required player count:

* The round is removed from the Browse page
* Additional requests are prevented
* Capacity updates automatically when players leave or requests are rejected
This ensures that rounds remain accurately represented and prevents overbooking.

---

### Protecting User Data

#### Challenge
User information and profile data should only be accessible to authenticated users.

#### Solution
JWT authentication was implemented across protected routes. Each request requiring authentication verifies the user's token before granting access.
Passwords are hashed using bcrypt before storage, ensuring sensitive information is never stored in plain text.

---

### Maintaining Data Integrity

#### Challenge
Users could potentially edit rounds in ways that create inconsistencies, such as reducing available spots below the number of players already reserved.

#### Solution
Server-side validation checks were implemented before updates occur.
For example:

* A round with two reserved players cannot be edited to require only one player.
* Invalid updates are rejected before reaching the database.
This ensures data remains consistent across the application.

---

### Building a Relational Database Structure

#### Challenge
The application required relationships between users, profiles, rounds, and join requests.
#### Solution
A PostgreSQL relational database was designed using foreign key relationships.
Core entities include:

* Users
* Profiles
* Rounds
* Round Requests
This structure allows data to remain normalised while supporting complex queries such as request management, capacity calculations, and player participation tracking.

---

### Mobile-First Design

#### Challenge
Most users are expected to access TeeMatch from mobile devices.

#### Solution
Responsive layouts were designed using flexible containers, adaptive navigation, and mobile-friendly card components to ensure usability across multiple screen sizes.


---

## Future Improvements
Future versions of TeeMatch could include:

* Email verification during registration
* Password reset functionality
* Real-time notifications
* In-app messaging between golfers
* Player rating and review system
* Friend and follow system
* Mobile application version
* Push notifications
* Round statistics and analytics dashboard

These features were intentionally excluded from Version 1 to maintain focus on delivering a complete and functional core experience.

---


## Use of AI During Development

AI tools were used as a learning aid throughout development to explore implementation approaches, debug issues, and better understand unfamiliar technologies. All architectural decisions, business logic, database design, and final implementations were reviewed, adapted, and integrated by me.

---


## Key Learning Outcomes

Through this project I strengthened my understanding of:
- REST API development
- Authentication and authorisation
- Relational database design
- PostgreSQL queries and relationships
- Backend validation
- Full-stack application architecture
- Git and version control