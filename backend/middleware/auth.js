const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes
const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Get token from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

      // Get user from token
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'User account is deactivated'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Middleware to check if user has specific permissions
const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    const userPermissions = req.user.getPermissions();
    const hasPermission = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `User role is not authorized to access this route. Required permissions: ${permissions.join(', ')}`
      });
    }

    next();
  };
};

// Middleware to check if user has premium access
const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route'
    });
  }

  if (!req.user.hasPremiumAccess()) {
    return res.status(403).json({
      success: false,
      error: 'Premium subscription required to access this feature'
    });
  }

  next();
};

// Middleware to check if user owns the resource
const checkOwnership = (Model, paramName = 'id', populateField = null) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[paramName];

      let query = Model.findById(resourceId);
      if (populateField) {
        query = query.populate(populateField);
      }

      const resource = await query;

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      // Check if the resource belongs to the authenticated user
      if (resource.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this resource'
        });
      }

      // Add resource to request object
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  };
};

// Middleware to validate JWT token without requiring authentication
const validateToken = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Get token from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

        // Get user from token
        const user = await User.findById(decoded.userId).select('-password');

        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Token is invalid, but we don't fail the request
        console.log('Invalid token provided');
      }
    }

    next();
  } catch (error) {
    console.error('Token validation error:', error);
    next();
  }
};

// Middleware to refresh token if it's close to expiry
const refreshToken = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    let token;

    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Get token from cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');

        // Check if token expires within 1 day
        const expiryTime = decoded.exp * 1000;
        const oneDayFromNow = Date.now() + (24 * 60 * 60 * 1000);

        if (expiryTime < oneDayFromNow) {
          // Generate new token
          const newToken = req.user.generateAuthToken();

          // Set new token in response header
          res.setHeader('X-New-Token', newToken);

          // If using cookies, set new cookie
          if (req.cookies && req.cookies.token) {
            res.cookie('token', newToken, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
          }
        }
      } catch (error) {
        // Token verification failed, but we already have the user from protect middleware
        console.log('Token refresh check failed');
      }
    }

    next();
  } catch (error) {
    console.error('Token refresh error:', error);
    next();
  }
};

module.exports = {
  protect,
  authorize,
  requirePremium,
  checkOwnership,
  validateToken,
  refreshToken
};