# Restaurant Reservation API

## Overview
A REST API built using Node.js and Express.js for managing restaurant reservations. It allows customers to check table availability, create reservations, retrieve booking details, and cancel reservations.

## Technologies Used
- Node.js
- Express.js
- JavaScript
- JSON
- Postman

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | /api/availability | Check table availability |
| POST | /api/reservations | Create a reservation |
| GET | /api/reservations/:reservationId | Get reservation details |
| PATCH | /api/reservations/:reservationId/cancel | Cancel a reservation |

## Reservation Rules
- Party size must be between 1 and 10.
- Restaurant operating hours are 10 AM to 10 PM.
- Reservations require a valid future date and time.
- Customers can cancel at least 2 hours before their reservation.
- Already cancelled reservations cannot be cancelled again.

## Status Codes
- 200: Successful request
- 201: Reservation created
- 400: Invalid request
- 404: Reservation not found
- 409: Reservation conflict
- 500: Internal server error

## Error Handling
The API returns JSON error messages for invalid input, unavailable tables, missing reservations, and invalid cancellation requests.

## Run Locally

Install dependencies:

npm install

Start the server:

npm run dev

Server URL:

http://localhost:3000

## Testing
The four endpoints can be tested using Postman or cURL. Screenshots of successful requests and error responses are included in the screenshots folder.

## Storage
This project uses temporary in-memory storage. Reservation records reset whenever the server restarts.

## Author
Glory Jain

             CUSTOMER
                 |
                 v
       RESTAURANT RESERVATION API
                 |
       +---------+---------+
       |         |         |
       v         v         v
   CHECK      CREATE     RETRIEVE
 AVAILABILITY RESERVATION RESERVATION
       |         |         |
       +---------+---------+
                 |
                 v
          CANCEL RESERVATION
                 |
                 v
         VALIDATE 2-HOUR RULE
                 |
                 v
          UPDATE BOOKING STATUS