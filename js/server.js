require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db = require("C:/Users/smith/TeeMatchApp/database/db.js");
const { v4: uuidv4 } = require("uuid");


const app = express();


app.use(cors({
    origin: "http://127.0.0.1:5500",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Access-Control-Allow-Origin"],
}));

function authenticateUser(req, res, next) {

    const authHeader = req.headers.authorization;


    if (!authHeader) {

        return res.status(401).json({
            success: false,
            message: "No token provided"
        })
    }

    const token = authHeader.split(" ")[1];

    try {

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();

    }
    catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });

    }

}


app.use(express.json());

app.get("/", async (req, res) => {

    const result =
        await db.query("SELECT NOW()");

    res.json(result.rows);

});

app.post("/login", async (req, res) => {

    try {

        const {

            email,
            password

        } = req.body;

        const user =
            await db.query(

                `
            SELECT *
            FROM users
            WHERE email = $1
            `,

                [email]

            );

        if (user.rows.length === 0) {

            return res.status(401).json({

                success: false,

                message: "Email not found"

            });

        }

        const validPassword =
            await bcrypt.compare(

                password,

                user.rows[0].password_hash

            );

        if (!validPassword) {

            return res.status(401).json({

                success: false,

                message:
                    "Incorrect password"

            });

        }

        const token =
            jwt.sign(

                {

                    userId:
                        user.rows[0].id

                },

                process.env.JWT_SECRET,

                {

                    expiresIn: "7d"

                }

            );

        res.status(200).json({

            success: true,

            token

        });

    }
    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message: "Server error"

        });

    }

});

app.post("/signup", async (req, res) => {

    try {

        const {

            name,
            email,
            password

        } = req.body;

        const existingUser =
            await db.query(

                `
                SELECT *
                FROM users
                WHERE email = $1
                `,

                [email]

            );

        if (existingUser.rows.length > 0) {

            return res.status(400).json({

                success: false,

                message:
                    "User already exists"

            });

        }

        const hashedPassword =
            await bcrypt.hash(

                password,

                10

            );

        const result = await db.query(`INSERT INTO users(full_name,email,password_hash) VALUES($1,$2,$3) RETURNING id`[name, email, hashedPassword]);

        const userId = result.rows[0].id;

        await db.query(`INSERT INTO profiles(user_id) VALUES($1) `, [userId]);

        const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({
            success: true,
            token
        });

    }
    catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Server error"
        });

    }

});

app.get("/dashboard", authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;

        await deactivateExpiredRounds();

        const profile = await db.query(`SELECT users.full_name, profiles.phone_number,profiles.instagram_handle,profiles.postcode,
        profiles.home_course,profiles.handicap,profiles.skill_level,profiles.availability,
        profiles.bio FROM users JOIN profiles ON users.id = profiles.user_id WHERE users.id = $1`, [userId]);

        res.json(profile.rows[0]);
    } catch (error) {

        console.error("Dashboard Route Error:", error);


        res.status(500).json({
            success: false,
            message: "Error fetching profile"
        });
    }
});

app.put("/profile", authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { phoneNumber, instagramHandle, postcode, homeCourse, handicap, skillLevel, availability, bio } = req.body;

        await db.query(
            `
            UPDATE profiles
            SET phone_number = $1, instagram_handle = $2, postcode = $3, home_course = $4, handicap = $5, skill_level = $6, availability = $7, bio = $8
            WHERE user_id = $9
            `,
            [phoneNumber, instagramHandle, postcode, homeCourse, handicap, skillLevel, availability, bio, userId]
        );

        res.json({ success: true, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Profile Update Error:", error);

        res.status(500).json({
            success: false,
            message: "Error updating profile"
        });
    }
});

app.post("/rounds", authenticateUser, async (req, res) => {
    try {
        const creatorId = req.user.userId;
        const { courseName, roundDate, teeTime, playersNeeded, notes } = req.body;
        const today = new Date();

        today.setHours(0, 0, 0, 0);

        const selectedDate = new Date(roundDate);

        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: "Round date cannot be in the past."
            });
        }

        const hour = parseInt(teeTime.split(":")[0]);
        if (hour < 6 || hour > 18) {
            return res.status(400).json({
                success: false,
                message: "Tee time must be between 06:00 and 18:59."
            });
        }

        const now = new Date();

        const isToday = selectedDate.toDateString() === now.toDateString();

        if (isToday) {
            const currentHour = now.getHours();
            const selectedHour = parseInt(teeTime.split(":")[0]);
            if (selectedHour <= currentHour) {
                return {
                    valid: false,
                    message: "Please select a future tee time."
                };
            }
        }

        const roundId = uuidv4();

        await db.query(`INSERT INTO rounds(
                id,creator_id,course_name,round_date,tee_time,players_needed,notes) VALUES( $1,$2,$3,$4,$5,$6,$7 )`,
            [roundId, creatorId, courseName, roundDate, teeTime, playersNeeded, notes || null]);

        res.status(201).json({
            success: true,
            message: "Round created successfully."
        });

    }
    catch (error) {
        console.error(error);

        res.status(500).json({
            success: false, message: "Error creating round."
        });
    }
});

app.get("/my-rounds", authenticateUser, async (req, res) => {

    try {
        const userId = req.user.userId;

        await deactivateExpiredRounds();

        const created = await db.query(`SELECT * FROM rounds WHERE creator_id = $1 AND is_active = true ORDER BY round_date ASC ,tee_time ASC `, [userId]);

        const history = await db.query(
            `SELECT * FROM rounds WHERE creator_id = $1 AND is_active = false ORDER BY round_date DESC`, [userId]);

        res.json({
            created: created.rows,
            joined: [],
            history: history.rows
        });


    }
    catch (error) {
        console.error(error);

        res.status(500).json({ success: false, message: "Error fetching rounds." });
    }

});

app.delete("/rounds/:id", authenticateUser, async (req, res) => {

    try {
        const userId = req.user.userId;
        const roundId = req.params.id;
        await db.query(
            `DELETE FROM rounds WHERE id = $1 AND creator_id = $2 `,
            [roundId, userId]
        );

        res.json({
            success: true,
            message: "Round deleted."
        });
    }
    catch (error) {
        console.error(error);

        res.status(500).json({
            success: false
        });
    }
});

app.put("/rounds/:id", authenticateUser, async (req, res) => {

    try {

        const roundId = req.params.id;
        const userId = req.user.userId;
        const { courseName, roundDate, teeTime, playersNeeded, notes } = req.body;

        // validate the round data in the backend

        if (!courseName || courseName.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: "Course name required."
    
            });
    
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const selectedDate = new Date(roundDate);
    
        if (selectedDate < today) {
            return res.status(400).json({
                success: false,
                message: "Round date cannot be in the past."
    
            });
        }
    
        const hour = parseInt(teeTime.split(":")[0]);
    
        if (hour < 6 || hour >= 18) {
            return res.status(400).json({
                success: false,
                message: "Invalid tee time."
            });
        }
    
        const playerCount = parseInt(playersNeeded);
    
        if (isNaN(playerCount) || playerCount < 1 || playerCount > 3) {
            return res.status(400).json({
                success: false,
                message: "Players needed must be between 1 and 3."
            });
        }
    
        if (notes && notes.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Notes too long."
            });
        }
    
        const now = new Date();
    
        const isToday = selectedDate.toDateString() === now.toDateString();
        if (isToday) {
            const currentHour = now.getHours();
            const selectedHour = parseInt(teeTime.split(":")[0]);
    
            if (selectedHour <= currentHour) {
                return res.status(400).json({
                    success: false,
                    message: "Please choose a future tee time."
                });
    
            }
    
        }
    
        const result = await db.query(`UPDATE rounds SET course_name = $1, round_date = $2,
                tee_time = $3,players_needed = $4,notes = $5 WHERE id = $6 AND creator_id = $7 RETURNING * `,
            [courseName, roundDate, teeTime, playersNeeded, notes, roundId, userId]);

        if (result.rowCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Round not found"
            });
        }
        res.json({
            success: true,
            message: "Round updated"
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error updating round"
        });
    }
}
);

app.listen(3000, () => {
    console.log("Server running");
});

async function deactivateExpiredRounds() {
    // this is to set a false bool value to is active if the time and date of the 
    //round is in past time
    await db.query(`UPDATE rounds SET is_active = false WHERE is_active = true AND (round_date + tee_time) < NOW() `);

}

