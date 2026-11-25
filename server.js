const express = require("express");

const app = express();
app.use(express.json());

const PORT = 3000;

// Temporary reservation storage
let reservations = [];
let nextId = 1;

// Restaurant configuration
const TOTAL_TABLES = 10;

// Home route
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Restaurant Reservation API is running!"
    });
});

// API 1: Check Table Availability
app.get("/api/availability", (req, res) => {
    const { date, time, partySize } = req.query;

    if (!date || !time || !partySize) {
        return res.status(400).json({
            success: false,
            message: "Date, time and party size are required."
        });
    }

    const guests = Number(partySize);

    if (!Number.isInteger(guests) || guests < 1 || guests > 10) {
        return res.status(400).json({
            success: false,
            message: "Party size must be between 1 and 10."
        });
    }

    const bookingDate = new Date(`${date}T${time}:00`);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
        Number.isNaN(bookingDate.getTime()) ||
        bookingDate.toISOString().slice(0, 10) !== date ||
        bookingDate <= new Date()
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid future date and time."
        });
    }

    const hour = Number(time.split(":")[0]);

    if (hour < 10 || hour >= 22) {
        return res.status(400).json({
            success: false,
            message: "Restaurant operates between 10:00 and 22:00."
        });
    }

    const bookedTables = reservations.filter(r =>
        r.date === date &&
        r.time === time &&
        r.status === "CONFIRMED"
    ).reduce((total, r) => total + Math.ceil(r.partySize / 4), 0);

    const availableTables = TOTAL_TABLES - bookedTables;
    const requiredTables = Math.ceil(guests / 4);

    res.status(200).json({
        success: true,
        date,
        time,
        partySize: guests,
        available: availableTables >= requiredTables,
        availableTables: Math.max(0, availableTables)
    });
});

// API 2: Create Reservation
app.post("/api/reservations", (req, res) => {
    const { customerName, phone, date, time, partySize } = req.body;

    if (!customerName || !phone || !date || !time || partySize === undefined) {
        return res.status(400).json({
            success: false,
            message: "All reservation fields are required."
        });
    }

    if (typeof customerName !== "string" || !customerName.trim()) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid customer name."
        });
    }

    if (!/^\d{10}$/.test(String(phone))) {
        return res.status(400).json({
            success: false,
            message: "Phone number must contain exactly 10 digits."
        });
    }

    const guests = Number(partySize);

    if (!Number.isInteger(guests) || guests < 1 || guests > 10) {
        return res.status(400).json({
            success: false,
            message: "Party size must be between 1 and 10."
        });
    }

    const bookingDate = new Date(`${date}T${time}:00`);

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
        Number.isNaN(bookingDate.getTime()) ||
        bookingDate.toISOString().slice(0, 10) !== date ||
        bookingDate <= new Date()
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide a valid future date and time."
        });
    }

    const hour = Number(time.split(":")[0]);

    if (hour < 10 || hour >= 22) {
        return res.status(400).json({
            success: false,
            message: "Restaurant operates between 10:00 and 22:00."
        });
    }

    const bookedTables = reservations.filter(r =>
        r.date === date &&
        r.time === time &&
        r.status === "CONFIRMED"
    ).reduce((total, r) => total + Math.ceil(r.partySize / 4), 0);

    const requiredTables = Math.ceil(guests / 4);

    if (bookedTables + requiredTables > TOTAL_TABLES) {
        return res.status(409).json({
            success: false,
            error: {
                code: "TABLE_NOT_AVAILABLE",
                message: "No tables are available for the selected date and time."
            }
        });
    }

    const reservation = {
        reservationId: `RES${nextId++}`,
        customerName: customerName.trim(),
        phone: String(phone),
        date,
        time,
        partySize: guests,
        status: "CONFIRMED"
    };

    reservations.push(reservation);

    res.status(201).json({
        success: true,
        message: "Reservation created successfully.",
        reservation
    });
});

// API 3: Get Reservation Details
app.get("/api/reservations/:reservationId", (req, res) => {
    const reservation = reservations.find(
        r => r.reservationId === req.params.reservationId
    );

    if (!reservation) {
        return res.status(404).json({
            success: false,
            message: "Reservation not found."
        });
    }

    res.status(200).json({
        success: true,
        reservation
    });
});

// API 4: Cancel Reservation
app.patch("/api/reservations/:reservationId/cancel", (req, res) => {
    const reservation = reservations.find(
        r => r.reservationId === req.params.reservationId
    );

    if (!reservation) {
        return res.status(404).json({
            success: false,
            message: "Reservation not found."
        });
    }

    if (reservation.status === "CANCELLED") {
        return res.status(409).json({
            success: false,
            message: "Reservation has already been cancelled."
        });
    }

    const reservationDateTime = new Date(
        `${reservation.date}T${reservation.time}:00`
    );

    const currentTime = new Date();
    const hoursRemaining =
        (reservationDateTime - currentTime) / (1000 * 60 * 60);

    if (hoursRemaining < 2) {
        return res.status(409).json({
            success: false,
            message: "Reservations can only be cancelled at least 2 hours before booking."
        });
    }

    reservation.status = "CANCELLED";

    res.status(200).json({
        success: true,
        message: "Reservation cancelled successfully.",
        reservation: {
            reservationId: reservation.reservationId,
            status: reservation.status
        }
    });
});

// Handle invalid routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found."
    });
});

// Handle invalid JSON and other errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Invalid JSON request body."
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal server error."
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});