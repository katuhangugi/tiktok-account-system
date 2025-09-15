// internal/utils/jwt.go
package utils

import (
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/katuhangugi/tiktok-account-system/internal/config"
)

type Claims struct {
	UserID  uint   `json:"user_id"`
	Role    string `json:"role"`
	GroupID uint   `json:"group_id"`
	jwt.RegisteredClaims
}

func GenerateToken(userID uint, role string, groupID uint, cfg *config.Config) (string, error) {
	expirationTime := time.Now().Add(cfg.JWT.AccessTokenTTL)

	claims := &Claims{
		UserID:  userID,
		Role:    role,
		GroupID: groupID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			Issuer:    cfg.JWT.Issuer,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWT.Secret))
}

func GenerateRefreshToken(userID uint, cfg *config.Config) (string, error) {
	expirationTime := time.Now().Add(cfg.JWT.RefreshTokenTTL)

	claims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			Issuer:    cfg.JWT.Issuer,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(cfg.JWT.Secret))
}

func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.JWT.Secret), nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}

	return claims, nil
}
