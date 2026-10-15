import jwt from "jsonwebtoken"

const protect = (req, res, next) => {
    try {
        // Read the Authorization header
        const authHeader = req.headers.authorization;

        // Check whether the token was provided
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            const error = new Error("Authentication required");
            error.statusCode = 401;
            return next(error);
        }

        // Extract the token after "Bearer 
        const token = authHeader.split(" ")[1];

        // Verify the token's signature and expiration
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach verified information to the request
        req.user = {
            id: decoded.sub,
            role: decoded.role
        }

        // Allow the request to continue
        next();
    } catch(error) {
        if (error instanceof jwt.JsonWebTokenError) {
            error.statusCode = 401;
            error.message = "Invalid or expired token";
        }
        next(error);
    }
} 

export default protect;