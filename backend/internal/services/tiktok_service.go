package services

import (
	"context"
	"errors"
	"time"

	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"github.com/katuhangugi/tiktok-account-system/internal/repositories"
	"github.com/katuhangugi/tiktok-account-system/pkg/logger"
)

// TikTokService handles all business logic related to TikTok account operations
type TikTokService struct {
	accountRepo   *repositories.AccountRepository
	analyticsRepo *repositories.AnalyticsRepository
	tikTokClient  repositories.TikTokClientInterface
	log           *logger.Logger
}

// NewTikTokService creates a new instance of TikTokService
func NewTikTokService(
	accountRepo *repositories.AccountRepository,
	analyticsRepo *repositories.AnalyticsRepository,
	tikTokClient repositories.TikTokClientInterface,
	log *logger.Logger,
) *TikTokService {
	return &TikTokService{
		accountRepo:   accountRepo,
		analyticsRepo: analyticsRepo,
		tikTokClient:  tikTokClient,
		log:           log,
	}
}

// TikTokData represents the response structure from TikTok API
type TikTokData struct {
	AccountName  string `json:"account_name"`
	Nickname     string `json:"nickname"`
	UID          string `json:"uid"`
	Region       string `json:"region"`
	Followers    int64  `json:"follower_count"`
	Following    int64  `json:"following_count"`
	Likes        int64  `json:"total_likes"`
	Videos       int64  `json:"video_count"`
	DailyUploads int64  `json:"daily_uploads"`
}

// TikTokClientInterface defines the contract for TikTok API clients
type TikTokClientInterface interface {
	GetAccountData(accountName string) (*TikTokData, error)
	ValidateAccount(accountName string) (bool, error)
	GetStatus() (string, error)
}

// FetchAccountData retrieves account data from TikTok API and stores it
func (s *TikTokService) FetchAccountData(account *models.TikTokAccount) error {
	data, err := s.tikTokClient.GetAccountData(account.AccountName)
	if err != nil {
		s.log.Error("Failed to fetch account data",
			"accountID", account.ID,
			"accountName", account.AccountName,
			"error", err)
		return err
	}

	return s.StoreTikTokData(context.Background(), account, data)
}

// StoreTikTokData persists TikTok data to the database
func (s *TikTokService) StoreTikTokData(ctx context.Context, account *models.TikTokAccount, data *TikTokData) error {
	// Update account basic info if changed
	if account.Nickname != data.Nickname ||
		account.UID != data.UID ||
		account.Location != data.Region {
		account.Nickname = data.Nickname
		account.UID = data.UID
		account.Location = data.Region
		if err := s.accountRepo.Update(account); err != nil {
			s.log.Error("Failed to update account",
				"accountID", account.ID,
				"error", err)
			return err
		}
	}

	// Create analytics record
	analytics := &models.DailyAnalytics{
		TikTokAccountID: account.ID,
		Date:            time.Now().UTC().Truncate(24 * time.Hour),
		FollowerCount:   data.Followers,
		FollowingCount:  data.Following,
		TotalLikes:      data.Likes,
		VideoCount:      data.Videos,
		DailyUploads:    data.DailyUploads,
	}

	// Check if analytics already exists for this date
	existing, err := s.analyticsRepo.GetByAccountAndDate(account.ID, analytics.Date)
	if err == nil && existing != nil {
		// Update existing record
		existing.FollowerCount = analytics.FollowerCount
		existing.FollowingCount = analytics.FollowingCount
		existing.TotalLikes = analytics.TotalLikes
		existing.VideoCount = analytics.VideoCount
		existing.DailyUploads = analytics.DailyUploads
		return s.analyticsRepo.Update(existing)
	}

	// Create new record
	return s.analyticsRepo.Create(analytics)
}

// ValidateAccount checks if a TikTok account exists
func (s *TikTokService) ValidateAccount(accountName string) (bool, error) {
	valid, err := s.tikTokClient.ValidateAccount(accountName)
	if err != nil {
		s.log.Error("Account validation failed",
			"accountName", accountName,
			"error", err)
		return false, err
	}
	return valid, nil
}

// GetAPIStatus checks the TikTok API availability
func (s *TikTokService) GetAPIStatus() (string, error) {
	status, err := s.tikTokClient.GetStatus()
	if err != nil {
		s.log.Error("Failed to get API status",
			"error", err)
		return "", err
	}
	return status, nil
}

// RefreshAccountData refreshes data for a specific account
func (s *TikTokService) RefreshAccountData(accountID uint) error {
	account, err := s.accountRepo.FindByID(accountID)
	if err != nil {
		s.log.Error("Account not found",
			"accountID", accountID,
			"error", err)
		return errors.New("account not found")
	}

	return s.FetchAccountData(account)
}

// BatchRefresh refreshes data for all accounts in a group
func (s *TikTokService) BatchRefresh(groupID uint) error {
	accounts, err := s.accountRepo.ListAccounts(groupID)
	if err != nil {
		s.log.Error("Failed to list accounts",
			"groupID", groupID,
			"error", err)
		return err
	}

	var errs []error
	for _, account := range accounts {
		if err := s.FetchAccountData(&account); err != nil {
			s.log.Warn("Failed to refresh account data",
				"accountID", account.ID,
				"accountName", account.AccountName,
				"error", err)
			errs = append(errs, err)
			continue
		}
	}

	if len(errs) > 0 {
		return errors.New("some accounts failed to refresh")
	}
	return nil
}
