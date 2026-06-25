const jwt=require("jsonwebtoken");
const authHeader= req.headers.authorization;
const token=authHeader && authHeader.split(" ")[1];

if(!token){
    return res.status(401).json({message:"No token provided"});
}

const decoded=jwt.verify(token,process.env.JWT_SECRET);
const profile=await db.query(`SELECT * FROM profiles WHERE user_id=$1`,[decoded.userId]);
res.json(profile.rows[0]);