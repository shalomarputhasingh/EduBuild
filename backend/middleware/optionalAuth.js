import jwt from 'jsonwebtoken';

const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            if (token && token !== 'null' && token !== 'undefined') {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                req.userId = decoded.id;
                req.userRole = decoded.role;
            }
        }
    } catch (error) {
        // Silently proceed for optional auth
    }
    next();
};

export default optionalAuth;
