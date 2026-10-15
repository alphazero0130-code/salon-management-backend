import jwt from "jsonwebtoken";

const protect = (req, res, next) => {
  try {
    // Read the Authorization header
    const authHeader = req.headers.authorization;

    // Check whether the token was provided
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const error = new Error("Authentication required");
      error.statusCode = 401;
      return next(error);
    }

    // Extract the token after "Bearer
    const token = authHeader.split(" ")[1]; // method separates the text wherever there is a space.

    // Verify the token's signature and expiration
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    /*
    sends his token to the backend
    If the token is valid, decoded contains the information from that token.
    */

    // Attach verified information to the request
    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };
    /*
    it copies the ID and role from the verified token into req.user.
    
    Why do this? So the next middleware or controller can easily access Rahul's information without 
    verifying the token again.
    */
    /*
    The middleware attaches those details to the request as req.user. 
    That’s like putting a verified name tag on the package, so the next step can see who sent it.
    */

    // Allow the request to continue
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      error.statusCode = 401;
      error.message = "Invalid or expired token";
    }
    next(error);
  }
};

const authorizeRoles = (...allowedRoles) => { // authorizeRoles("admin"), allowedRoles = ["admin"];, authorizeRoles("admin", "staff"), allowedRoles = ["admin", "staff"];
  return (req, res, next) => {
    //  Check whether the user's role is allowed
    if (!allowedRoles.includes(req.user?.role)) {
        const error = new Error("You do not have permission to perform this action");
        error.statusCode = 403;
        return next(error);
    //   return res.status(403).json({
    //     message: "You do not have permission to perform this action",
    //   });
    }
    /*
    req.user.role is the role identified by the verified JWT.
    includes() checks whether the role exists in the allowed list.
    ! reverses the result, so the if block runs when the role is not allowed.
    - 403 Forbidden means the request is understood, but the user doesn't have permission.
    */

    next();
  };
};

export {protect, authorizeRoles};
