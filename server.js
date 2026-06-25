require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db=require("./database/db")
const { v4: uuidv4 } = require("uuid");


const app = express();

const allowedOrigins = ["http://127.0.0.1:5500","http://localhost:5500",process.env.CLIENT_URL];
  


app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
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

app.use(express.static("public"));

app.get("/", async (req, res) => {

    const result =
        await db.query("SELECT NOW()");

    res.json(result.rows);

});

app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await db.query(`SELECT * FROM users WHERE email = $1 `, [email]);

        if (user.rows.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Email not found"
            });
        }

        const validPassword = await bcrypt.compare(password, user.rows[0].password_hash);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Incorrect password"

            });

        }

        const token = jwt.sign({ userId: user.rows[0].id },

            process.env.JWT_SECRET,
            {
                expiresIn: "7d"
            });
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

        const { name, email, password } = req.body;

        const existingUser = await db.query(`SELECT * FROM users WHERE email = $1`, [email]);

        if (existingUser.rows.length > 0) {

            return res.status(400).json({

                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await db.query(`INSERT INTO users(full_name,email,password_hash) VALUES($1,$2,$3) RETURNING id`, [name, email, hashedPassword]);

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
            `UPDATE profiles
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

        const created = await db.query(`
            SELECT r.*,
                COUNT(*) FILTER (WHERE rr.status = 'accepted') AS joined_count,
                COUNT(*) FILTER (WHERE rr.status = 'pending') AS pending_count
            FROM rounds r
            LEFT JOIN round_requests rr
            ON rr.round_id = r.id
            WHERE r.creator_id = $1
                AND r.is_active = true
            GROUP BY r.id
            ORDER BY r.round_date ASC, r.tee_time ASC`, [userId]);

        const history = await db.query(`SELECT * FROM rounds WHERE creator_id = $1 AND is_active = false ORDER BY round_date DESC`, [userId]);
        const joined = await db.query(`SELECT rr.id AS request_id,
            rr.status,rr.created_at,rounds.id AS round_id, rounds.course_name, rounds.round_date,
            rounds.tee_time,rounds.players_needed,
            users.full_name AS creator_name,
            profiles.phone_number,
            profiles.instagram_handle 
            FROM round_requests rr JOIN rounds ON rr.round_id = rounds.id
            JOIN users ON rounds.creator_id = users.id LEFT JOIN profiles
            ON users.id = profiles.user_id WHERE rr.requester_id = $1 AND rounds.is_active=true
            ORDER BY rounds.round_date ASC`, [userId])

        res.json({
            created: created.rows,
            joined: joined.rows,
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


        // validate number players needed
        const requestCounts =await db.query(`
            SELECT COUNT(*) FILTER(
            WHERE status='accepted')
            AS accepted,

            COUNT(*) FILTER(
            WHERE status='pending')
            AS pending

            FROM round_requests

            WHERE round_id=$1`,[roundId] );

            const accepted =parseInt(requestCounts.rows[0].accepted);
            const pending = parseInt(requestCounts.rows[0].pending);
            const reserved =accepted + pending;

            if( playersNeeded < reserved){
                return res.status(400).json({
                    success:false,
                    message:`You already have ${reserved} players reserved. Increase player count or remove requests first.`
                });
            }
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
            message: "Round updated Successfully"
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

app.delete("/rounds/:id/leave-round", authenticateUser, async (req, res) => {

    try {
        const roundId = req.params.id;
        const userId = req.user.userId;
        //console.log(roundId,(userId))

        await db.query(
            `DELETE FROM round_requests WHERE round_id = $1 AND requester_id = $2 `,
            [roundId, userId]
        );



        res.json({
            success: true,
            message: "Round Left Successfully"
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Error leaving round"
        });
    }
}
);

app.get("/rounds", authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        await deactivateExpiredRounds();

        const rounds = await db.query(`
            SELECT rounds.id, rounds.course_name, rounds.round_date, 
            rounds.tee_time,
            rounds.players_needed, users.full_name AS host_name,
            
            profiles.handicap, profiles.skill_level,
            profiles.bio,  rr.status AS request_status,
            (
             SELECT COUNT(*) FROM round_requests WHERE round_requests.round_id= rounds.id AND status IN ('pending','accepted')
              ) AS reserved_spots,

              (
                  SELECT COUNT(*)
                  FROM round_requests
                  WHERE round_requests.round_id = rounds.id
                  AND status = 'accepted'
              ) AS accepted_count,
              
              (
                  SELECT COUNT(*)
                  FROM round_requests
                  WHERE round_requests.round_id = rounds.id
                  AND status = 'pending'
              ) AS pending_count

            FROM rounds JOIN users ON rounds.creator_id = users.id
            LEFT JOIN profiles ON users.id = profiles.user_id 
            LEFT JOIN round_requests rr ON rr.round_id = rounds.id
            AND rr.requester_id = $1 WHERE rounds.is_active = true
            AND (
                    SELECT COUNT(*)
                    FROM round_requests
                    WHERE round_requests.round_id = rounds.id
                    AND status IN ('pending','accepted')
                ) < rounds.players_needed

            AND rounds.creator_id != $1  
            ORDER BY rounds.round_date ASC, rounds.tee_time ASC `,
            [userId]);

        res.json(rounds.rows);

    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false
        });
    }

});

app.post("/requests", authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { roundId } = req.body;
        const existing = await db.query(`SELECT * FROM round_requests
            WHERE round_id = $1 AND requester_id = $2 `, [roundId, userId]
        );

        if (existing.rows.length) {
            return res.status(400).json({
                success: false,
                message: "You already requested this round."
            });
        }

        await db.query(
            `INSERT INTO round_requests(id, round_id, requester_id, status)
            VALUES(gen_random_uuid(),$1,$2,'pending')`, [roundId, userId]);

        res.json({
            success: true,
            message: "Request sent."
        });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false
        });
    }
});

app.get("/requests", authenticateUser, async (req, res) => {

    try {
        const userId = req.user.userId;
        await deactivateExpiredRounds();
        const requests = await db.query(` SELECT rr.id AS request_id,rr.created_at,rr.status,rounds.id AS round_id,rounds.course_name,
                rounds.round_date,
                rounds.tee_time,
                users.id AS requester_id,
                users.full_name,
                profiles.handicap,
                profiles.skill_level,
                profiles.bio FROM round_requests rr JOIN rounds
            ON rr.round_id = rounds.id JOIN users ON rr.requester_id = users.id LEFT JOIN profiles
            ON profiles.user_id = users.id WHERE rounds.creator_id = $1
            AND rr.status = 'pending' ORDER BY rounds.round_date ASC `,

            [userId]

        );

        res.json({ requests: requests.rows, success: true });


    }
    catch (error) {

        console.error(error);

        res.status(500).json({
            success: false

        });

    }

});

app.put("/requests/:requestId/accept", authenticateUser, async (req, res) => {
    try {

        const requestId = req.params.requestId;
        await deactivateExpiredRounds();
        await db.query(` UPDATE round_requests SET status = 'accepted' WHERE id = $1`, [requestId]);

        res.json({
            success: true,
            message: "Player accepted"
        });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false
        });
    }
}
);

app.put("/requests/:requestId/reject", authenticateUser, async (req, res) => {
    try {

        const requestId = req.params.requestId;

        await db.query(
            `UPDATE round_requests
                SET status = 'rejected'
                WHERE id = $1
                `, [requestId]);

        res.json({
            success: true,
            message: "Request rejected"
        });

    }
    catch (error) {
        console.error(error);
        res.status(500).json({
            success: false
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
    await db.query(`UPDATE rounds SET is_active = false WHERE is_active = true AND(round_date + tee_time) < NOW()`);

}

