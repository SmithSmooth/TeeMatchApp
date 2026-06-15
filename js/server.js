require("dotenv").config();
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db = require("C:/Users/smith/TeeMatchApp/database/db.js");


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

        const result =await db.query( `INSERT INTO users(full_name,email,password_hash) VALUES($1,$2,$3) RETURNING id` [name,email,hashedPassword]);

        const userId =result.rows[0].id;

        await db.query(`INSERT INTO profiles(user_id) VALUES($1) `,[userId]);

        const token =jwt.sign({userId},process.env.JWT_SECRET,{expiresIn: "7d"});

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

        const profile = await db.query( `SELECT users.full_name, profiles.phone_number,profiles.instagram_handle,profiles.postcode,
        profiles.home_course,profiles.handicap,profiles.skill_level,profiles.availability,
        profiles.bio FROM users JOIN profiles ON users.id = profiles.user_id WHERE users.id = $1`, [userId]);
        
        res.json(profile.rows[0]);
    } catch (error) {

        console.error("Dashboard Route Error:",error);


        res.status(500).json({
            success: false,
            message: "Error fetching profile"
        });
    }
});

app.put("/profile", authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { phone_number, instagram_handle, postcode, home_course, handicap, skill_level, availability, bio } = req.body;

        await db.query(
            `
            UPDATE profiles
            SET phone_number = $1, instagram_handle = $2, postcode = $3, home_course = $4, handicap = $5, skill_level = $6, availability = $7, bio = $8
            WHERE user_id = $9
            `,
            [phone_number, instagram_handle, postcode, home_course, handicap, skill_level, availability, bio, userId]
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

app.listen(3000, () => {
    console.log("Server running");
});