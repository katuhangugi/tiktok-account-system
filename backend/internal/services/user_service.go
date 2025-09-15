// internal/services/user_service.go
package services

import (
	"errors"

	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"github.com/katuhangugi/tiktok-account-system/internal/repositories"
	"github.com/katuhangugi/tiktok-account-system/internal/utils"
)

type UserService struct {
	userRepo  *repositories.UserRepository
	groupRepo *repositories.GroupRepository
}

func NewUserService(userRepo *repositories.UserRepository, groupRepo *repositories.GroupRepository) *UserService {
	return &UserService{userRepo: userRepo, groupRepo: groupRepo}
}

func (s *UserService) CreateUser(creatorID uint, req *models.UserCreateRequest) (*models.UserResponse, error) {
	// Check if creator has permission to create this role
	creator, err := s.userRepo.FindByID(creatorID)
	if err != nil {
		return nil, errors.New("creator not found")
	}

	// Super admin can create any role
	if creator.Role != models.RoleSuperAdmin {
		// Manager can only create operators
		if creator.Role == models.RoleManager && req.Role != models.RoleOperator {
			return nil, errors.New("managers can only create operators")
		}
		// Operators cannot create users
		if creator.Role == models.RoleOperator {
			return nil, errors.New("operators cannot create users")
		}
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, errors.New("failed to hash password")
	}

	user := &models.User{
		Username:  req.Username,
		Password:  hashedPassword,
		Role:      req.Role,
		GroupID:   req.GroupID,
		CreatedBy: &creatorID,
		ManagedBy: req.ManagedBy,
		IsActive:  true,
	}

	if req.Role == models.RoleOperator && req.ManagedBy == nil {
		// Operators must have a manager
		return nil, errors.New("operators must have a manager")
	}

	if req.Role == models.RoleManager && req.ManagedBy != nil {
		// Managers can't have managers (only super admin can create managers)
		return nil, errors.New("managers cannot have managers")
	}

	if err := s.userRepo.Create(user); err != nil {
		return nil, err
	}

	return s.GetUser(user.ID)
}

func (s *UserService) GetUser(userID uint) (*models.UserResponse, error) {
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

func (s *UserService) ListUsers(role string, groupID uint, managerID uint) ([]models.UserResponse, error) {
	users, err := s.userRepo.ListUsers(role, groupID, managerID)
	if err != nil {
		return nil, err
	}

	var responses []models.UserResponse
	for _, user := range users {
		response := models.UserResponse{
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

		responses = append(responses, response)
	}

	return responses, nil
}

func (s *UserService) UpdateUser(updaterID, userID uint, req *models.UserUpdateRequest) (*models.UserResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	updater, err := s.userRepo.FindByID(updaterID)
	if err != nil {
		return nil, errors.New("updater not found")
	}

	// Check if updater has permission to update this user
	if updater.Role != models.RoleSuperAdmin {
		if updater.Role == models.RoleManager {
			// Managers can only update operators they created
			if user.Role != models.RoleOperator || user.CreatedBy == nil || *user.CreatedBy != updater.ID {
				return nil, errors.New("no permission to update this user")
			}
		} else {
			// Operators can only update themselves
			if user.ID != updater.ID {
				return nil, errors.New("no permission to update this user")
			}
		}
	}

	// Apply updates
	if req.Username != nil {
		user.Username = *req.Username
	}

	if req.Password != nil {
		hashedPassword, err := utils.HashPassword(*req.Password)
		if err != nil {
			return nil, errors.New("failed to hash password")
		}
		user.Password = hashedPassword
	}

	if req.Role != nil {
		// Only super admin can change roles
		if updater.Role != models.RoleSuperAdmin {
			return nil, errors.New("only super admin can change roles")
		}
		user.Role = *req.Role
	}

	if req.GroupID != nil {
		user.GroupID = req.GroupID
	}

	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := s.userRepo.Update(user); err != nil {
		return nil, err
	}

	return s.GetUser(user.ID)
}

func (s *UserService) DeleteUser(deleterID, userID uint) error {
	canDelete, err := s.userRepo.CanDeleteUser(deleterID, userID)
	if err != nil {
		return err
	}

	if !canDelete {
		return errors.New("no permission to delete this user")
	}

	return s.userRepo.Delete(userID)
}

func (s *UserService) AssignToGroup(assignerID, userID, groupID uint) error {
	// Check if assigner has permission to assign to this group
	// Implementation depends on your business logic
	return s.userRepo.AssignToGroup(userID, groupID)
}

func (s *UserService) AssignManager(assignerID, userID, managerID uint) error {
	// Check if assigner has permission to assign this manager
	// Implementation depends on your business logic
	return s.userRepo.AssignManager(userID, managerID)
}
