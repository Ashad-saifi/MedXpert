import jwt from "jsonwebtoken";
import User from "../models/User.js";

// In-memory rate limiting map for brute-force protection
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_PERIOD_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Authentication Middleware: Verifies JWT token and attaches authenticated user
 */
export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];

            if (!token || token === "null" || token === "undefined") {
                return res.status(401).json({ message: "401 Unauthorized: Invalid token format" });
            }

            const decoded = jwt.verify(
                token, 
                process.env.JWT_SECRET || "super_secret_cryptographic_compliance_jwt_token_key_123!"
            );

            req.user = await User.findById(decoded.id).select("-password");

            if (!req.user) {
                return res.status(401).json({ message: "401 Unauthorized: User no longer exists" });
            }

            return next();
        } catch (error) {
            console.error("JWT Verification Security Error:", error.message);
            return res.status(401).json({ message: "401 Unauthorized: Session token is invalid or expired" });
        }
    }

    return res.status(401).json({ message: "401 Unauthorized: Authentication token required" });
};

/**
 * Role-Based Access Control (RBAC) Authorization Middleware
 * @param  {...string} roles Allowed roles (e.g. 'admin', 'doctor', 'patient')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "401 Unauthorized: Authentication required" });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: `403 Forbidden: Access denied. Role '${req.user.role}' is not authorized to access this resource` 
            });
        }

        return next();
    };
};

/**
 * Brute-force Login Rate Limiter Middleware
 */
export const loginRateLimiter = (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown_ip";
    const now = Date.now();

    const record = loginAttempts.get(ip);
    if (record) {
        if (record.lockedUntil && now < record.lockedUntil) {
            const minutesLeft = Math.ceil((record.lockedUntil - now) / 60000);
            return res.status(429).json({
                message: `Too many failed login attempts. IP temporarily locked for security. Please retry in ${minutesLeft} minute(s).`
            });
        }

        if (record.lockedUntil && now >= record.lockedUntil) {
            loginAttempts.delete(ip);
        }
    }

    next();
};

/**
 * Helper to record failed login attempts
 */
export const recordFailedLogin = (ip) => {
    const now = Date.now();
    const record = loginAttempts.get(ip) || { count: 0, firstAttempt: now };
    record.count += 1;

    if (record.count >= MAX_ATTEMPTS) {
        record.lockedUntil = now + LOCKOUT_PERIOD_MS;
    }

    loginAttempts.set(ip, record);
};

/**
 * Helper to reset login attempts on success
 */
export const resetLoginAttempts = (ip) => {
    loginAttempts.delete(ip);
};

export default protect;