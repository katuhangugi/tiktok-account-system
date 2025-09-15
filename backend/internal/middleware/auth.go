// internal/middleware/auth.go
package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/katuhangugi/tiktok-account-system/internal/utils"
)

func AuthRequired() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token not found"})
			c.Abort()
			return
		}

		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		// Set user information in context
		c.Set("user_id", claims.UserID)
		c.Set("user_role", claims.Role)
		c.Set("user_group_id", claims.GroupID)

		c.Next()
	}
}

func RoleRequired(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{"error": "User role not found"})
			c.Abort()
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"error": "Invalid user role type"})
			c.Abort()
			return
		}

		hasRole := false
		for _, role := range roles {
			if roleStr == role {
				hasRole = true
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

func GroupAccess() gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, _ := c.Get("user_role")
		userGroupID, _ := c.Get("user_group_id")
		requestedGroupID := c.Param("group_id")

		if userRole == "super_admin" {
			c.Next()
			return
		}

		// For managers, check if they manage the requested group
		if userRole == "manager" {
			// Implement logic to check if manager has access to this group
			// This would typically involve a database query
			hasAccess := false // Replace with actual check
			if !hasAccess {
				c.JSON(http.StatusForbidden, gin.H{"error": "No access to this group"})
				c.Abort()
				return
			}
		}

		// For operators, check if the requested group is their own
		if userRole == "operator" {
			if requestedGroupID != userGroupID {
				c.JSON(http.StatusForbidden, gin.H{"error": "No access to this group"})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
