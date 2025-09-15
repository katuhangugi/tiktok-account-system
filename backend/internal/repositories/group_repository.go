// internal/repositories/group_repository.go
package repositories

import (
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"gorm.io/gorm"
)

type GroupRepository struct {
	db *gorm.DB
}

func NewGroupRepository(db *gorm.DB) *GroupRepository {
	return &GroupRepository{db: db}
}

func (r *GroupRepository) Create(group *models.Group) error {
	return r.db.Create(group).Error
}

func (r *GroupRepository) FindByID(id uint) (*models.Group, error) {
	var group models.Group
	err := r.db.Preload("Creator").Preload("Manager").First(&group, id).Error
	return &group, err
}

func (r *GroupRepository) ListGroups(managerID uint) ([]models.Group, error) {
	var groups []models.Group
	query := r.db.Preload("Creator").Preload("Manager")

	if managerID != 0 {
		query = query.Where("managed_by = ?", managerID)
	}

	err := query.Find(&groups).Error
	return groups, err
}

func (r *GroupRepository) Update(group *models.Group) error {
	return r.db.Save(group).Error
}

func (r *GroupRepository) Delete(id uint) error {
	return r.db.Delete(&models.Group{}, id).Error
}

func (r *GroupRepository) AssignManager(groupID, managerID uint) error {
	return r.db.Model(&models.Group{}).Where("id = ?", groupID).Update("managed_by", managerID).Error
}

func (r *GroupRepository) GetGroupUsers(groupID uint) ([]models.User, error) {
	var users []models.User
	err := r.db.Where("group_id = ?", groupID).Find(&users).Error
	return users, err
}

func (r *GroupRepository) GetGroupAccounts(groupID uint) ([]models.TikTokAccount, error) {
	var accounts []models.TikTokAccount
	err := r.db.Where("group_id = ?", groupID).Find(&accounts).Error
	return accounts, err
}

func (r *GroupRepository) GetGroupStats(groupID uint) (*models.GroupStats, error) {
	var stats models.GroupStats
	// Implement group statistics query
	return &stats, nil
}
