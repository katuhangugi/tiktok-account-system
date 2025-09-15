// internal/repositories/account_repository.go
package repositories

import (
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"gorm.io/gorm"
)

type AccountRepository struct {
	db *gorm.DB
}

func NewAccountRepository(db *gorm.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

func (r *AccountRepository) Create(account *models.TikTokAccount) error {
	return r.db.Create(account).Error
}

func (r *AccountRepository) FindByID(id uint) (*models.TikTokAccount, error) {
	var account models.TikTokAccount
	err := r.db.Preload("Creator").Preload("Group").First(&account, id).Error
	return &account, err
}

func (r *AccountRepository) FindByAccountName(name string) (*models.TikTokAccount, error) {
	var account models.TikTokAccount
	err := r.db.Where("account_name = ?", name).First(&account).Error
	return &account, err
}

func (r *AccountRepository) ListAccounts(groupID uint) ([]models.TikTokAccount, error) {
	var accounts []models.TikTokAccount
	query := r.db.Preload("Creator").Preload("Group")

	if groupID != 0 {
		query = query.Where("group_id = ?", groupID)
	}

	err := query.Find(&accounts).Error
	return accounts, err
}

func (r *AccountRepository) Update(account *models.TikTokAccount) error {
	return r.db.Save(account).Error
}

func (r *AccountRepository) Delete(id uint) error {
	return r.db.Delete(&models.TikTokAccount{}, id).Error
}

func (r *AccountRepository) TransferToGroup(accountID, groupID uint) error {
	return r.db.Model(&models.TikTokAccount{}).Where("id = ?", accountID).Update("group_id", groupID).Error
}

func (r *AccountRepository) GetLatestAnalytics(accountID uint) (*models.DailyAnalytics, error) {
	var analytics models.DailyAnalytics
	err := r.db.Where("tiktok_account_id = ?", accountID).Order("date desc").First(&analytics).Error
	return &analytics, err
}

func (r *AccountRepository) GetAccountTrends(accountID uint, days int) ([]models.DailyAnalytics, error) {
	var analytics []models.DailyAnalytics
	err := r.db.Where("tiktok_account_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)",
		accountID, days).Order("date asc").Find(&analytics).Error
	return analytics, err
}

func (r *AccountRepository) GetDashboardData(groupID uint) (*models.DashboardResponse, error) {
	var dashboard models.DashboardResponse
	// Implement dashboard data query
	return &dashboard, nil
}
