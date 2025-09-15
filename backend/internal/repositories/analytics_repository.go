// internal/repositories/analytics_repository.go
package repositories

import (
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"gorm.io/gorm"
)

type AnalyticsRepository struct {
	db *gorm.DB
}

func NewAnalyticsRepository(db *gorm.DB) *AnalyticsRepository {
	return &AnalyticsRepository{db: db}
}

func (r *AnalyticsRepository) Create(analytics *models.DailyAnalytics) error {
	return r.db.Create(analytics).Error
}

func (r *AnalyticsRepository) GetByAccountAndDate(accountID uint, date string) (*models.DailyAnalytics, error) {
	var analytics models.DailyAnalytics
	err := r.db.Where("tiktok_account_id = ? AND date = ?", accountID, date).First(&analytics).Error
	return &analytics, err
}

func (r *AnalyticsRepository) Update(analytics *models.DailyAnalytics) error {
	return r.db.Save(analytics).Error
}

func (r *AnalyticsRepository) GetAccountTrends(accountID uint, days int) ([]models.DailyAnalytics, error) {
	var analytics []models.DailyAnalytics
	err := r.db.Where("tiktok_account_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)",
		accountID, days).Order("date asc").Find(&analytics).Error
	return analytics, err
}

func (r *AnalyticsRepository) GetGroupTrends(groupID uint, days int) ([]models.DailyAnalytics, error) {
	var analytics []models.DailyAnalytics
	err := r.db.Joins("JOIN tiktok_accounts ON daily_analytics.tiktok_account_id = tiktok_accounts.id").
		Where("tiktok_accounts.group_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)",
			groupID, days).Order("date asc").Find(&analytics).Error
	return analytics, err
}

func (r *AnalyticsRepository) GetComparisonData(accountIDs []uint, days int) ([]models.DailyAnalytics, error) {
	var analytics []models.DailyAnalytics
	err := r.db.Where("tiktok_account_id IN ? AND date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)",
		accountIDs, days).Order("tiktok_account_id, date asc").Find(&analytics).Error
	return analytics, err
}
