// internal/repositories/user_repository.go
package repositories

import (
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"gorm.io/gorm"
)

type UserRepository struct {
	db *gorm.DB
}

func NewUserRepository(db *gorm.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *UserRepository) FindByID(id uint) (*models.User, error) {
	var user models.User
	err := r.db.Preload("Group").Preload("Creator").Preload("Manager").First(&user, id).Error
	return &user, err
}

func (r *UserRepository) FindByUsername(username string) (*models.User, error) {
	var user models.User
	err := r.db.Where("username = ?", username).First(&user).Error
	return &user, err
}

func (r *UserRepository) ListUsers(role string, groupID uint, managerID uint) ([]models.User, error) {
	var users []models.User
	query := r.db.Preload("Group").Preload("Creator").Preload("Manager")

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if groupID != 0 {
		query = query.Where("group_id = ?", groupID)
	}

	if managerID != 0 {
		query = query.Where("managed_by = ?", managerID)
	}

	err := query.Find(&users).Error
	return users, err
}

func (r *UserRepository) Update(user *models.User) error {
	return r.db.Save(user).Error
}

func (r *UserRepository) Delete(id uint) error {
	return r.db.Delete(&models.User{}, id).Error
}

func (r *UserRepository) AssignToGroup(userID, groupID uint) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("group_id", groupID).Error
}

func (r *UserRepository) AssignManager(userID, managerID uint) error {
	return r.db.Model(&models.User{}).Where("id = ?", userID).Update("managed_by", managerID).Error
}

func (r *UserRepository) CountByRole(role string) (int64, error) {
	var count int64
	err := r.db.Model(&models.User{}).Where("role = ?", role).Count(&count).Error
	return count, err
}

func (r *UserRepository) CanDeleteUser(deleterID, targetID uint) (bool, error) {
	var deleter, target models.User
	if err := r.db.First(&deleter, deleterID).Error; err != nil {
		return false, err
	}

	if err := r.db.First(&target, targetID).Error; err != nil {
		return false, err
	}

	// Cannot delete self
	if deleter.ID == target.ID {
		return false, nil
	}

	// Super admin can delete anyone except other super admins
	if deleter.Role == models.RoleSuperAdmin {
		return target.Role != models.RoleSuperAdmin || deleterID == 1, nil
	}

	// Managers can only delete operators they created
	if deleter.Role == models.RoleManager {
		return target.Role == models.RoleOperator && target.CreatedBy != nil && *target.CreatedBy == deleter.ID, nil
	}

	// Operators cannot delete anyone
	return false, nil
}
