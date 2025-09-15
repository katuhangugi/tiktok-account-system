// internal/services/auth_service.go
package services

import (
	"errors"

	"github.com/katuhangugi/tiktok-account-system/internal/config"
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"github.com/katuhangugi/tiktok-account-system/internal/repositories"
	"github.com/katuhangugi/tiktok-account-system/internal/utils"
)

type AuthService struct {
	userRepo *repositories.UserRepository
	config   *config.Config
}

func NewAuthService(userRepo *repositories.UserRepository, config *config.Config) *AuthService {
	return &AuthService{userRepo: userRepo, config: config}
}

func (s *AuthService) Login(username, password string) (string, string, error) {
	user, err := s.userRepo.FindByUsername(username)
	if err != nil {
		return "", "", errors.New("invalid credentials")
	}

	if !user.IsActive {
		return "", "", errors.New("account is inactive")
	}

	if !utils.CheckPasswordHash(password, user.Password) {
		return "", "", errors.New("invalid credentials")
	}

	accessToken, err := utils.GenerateToken(user.ID, string(user.Role), user.GroupID, s.config)
	if err != nil {
		return "", "", errors.New("failed to generate token")
	}

	refreshToken, err := utils.GenerateRefreshToken(user.ID, s.config)
	if err != nil {
		return "", "", errors.New("failed to generate refresh token")
	}

	return accessToken, refreshToken, nil
}

func (s *AuthService) RefreshToken(refreshToken string) (string, error) {
	claims, err := utils.ValidateToken(refreshToken)
	if err != nil {
		return "", errors.New("invalid refresh token")
	}

	user, err := s.userRepo.FindByID(claims.UserID)
	if err != nil {
		return "", errors.New("user not found")
	}

	if !user.IsActive {
		return "", errors.New("account is inactive")
	}

	newAccessToken, err := utils.GenerateToken(user.ID, string(user.Role), user.GroupID, s.config)
	if err != nil {
		return "", errors.New("failed to generate new access token")
	}

	return newAccessToken, nil
}

func (s *AuthService) GetCurrentUser(userID uint) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, err
	}

	response := &models.UserResponse{
		ID:        user.ID,
		Username:  user.Username,
		Role:      user.Role,
		GroupID:   user.GroupID,
		CreatedBy: user.CreatedBy,
		ManagedBy: user.ManagedBy,
		IsActive:  user.IsActive,
		CreatedAt: user.CreatedAt,
	}

	if user.Group != nil {
		response.GroupName = &user.Group.Name
	}

	if user.Creator != nil {
		creatorName := user.Creator.Username
		response.CreatorName = &creatorName
	}

	if user.Manager != nil {
		managerName := user.Manager.Username
		response.ManagerName = &managerName
	}

	return response, nil
}
