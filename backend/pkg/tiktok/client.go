package tiktok

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/katuhangugi/tiktok-account-system/internal/config"
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"github.com/katuhangugi/tiktok-account-system/internal/services"
)

// Client handles all TikTok API interactions and data operations
type Client struct {
	scraper     *Scraper
	config      *config.Config
	dataService *services.DataService
}

// NewClient creates a new TikTok client
func NewClient(cfg *config.Config, dataService *services.DataService) *Client {
	return &Client{
		scraper:     NewScraper(cfg.TikTokAPI.Timeout),
		config:      cfg,
		dataService: dataService,
	}
}

// AccountData represents the TikTok account data structure
type AccountData struct {
	AccountName    string    `json:"account_name"`
	Nickname       string    `json:"nickname"`
	UID            string    `json:"uid"`
	Location       string    `json:"location"`
	FollowerCount  int64     `json:"follower_count"`
	FollowingCount int64     `json:"following_count"`
	TotalLikes     int64     `json:"total_likes"`
	VideoCount     int64     `json:"video_count"`
	DailyUploads   int64     `json:"daily_uploads"`
	CreatedAt      time.Time `json:"created_at"`
}

// GetAccountData fetches account data from TikTok
func (c *Client) GetAccountData(accountName string) (*AccountData, error) {
	info, err := c.scraper.GetUserInfo(accountName)
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %v", err)
	}

	return &AccountData{
		AccountName:    info.Username,
		Nickname:       info.Name,
		UID:            info.ID,
		Location:       info.Region,
		FollowerCount:  info.Followers,
		FollowingCount: info.Following,
		TotalLikes:     info.Likes,
		VideoCount:     info.Videos,
		CreatedAt:      info.CreatedAt,
		DailyUploads:   0, // Will need to calculate from historical data
	}, nil
}

// FetchAndStoreAccountData fetches account data from TikTok and stores it
func (c *Client) FetchAndStoreAccountData(ctx context.Context, account *models.TikTokAccount) error {
	// Fetch data from TikTok
	data, err := c.GetAccountData(account.AccountName)
	if err != nil {
		return err
	}

	// Convert to our data model
	tikTokData := &models.TikTokData{
		AccountName:  data.AccountName,
		Nickname:     data.Nickname,
		UID:          data.UID,
		Region:       data.Location,
		CreatedAt:    data.CreatedAt,
		Followers:    data.FollowerCount,
		Following:    data.FollowingCount,
		Likes:        data.TotalLikes,
		Videos:       data.VideoCount,
		DailyUploads: data.DailyUploads,
	}

	// Store the data
	return c.dataService.StoreTikTokData(ctx, account, tikTokData)
}

// ValidateAccount checks if a TikTok account exists
func (c *Client) ValidateAccount(accountName string) (bool, error) {
	_, err := c.scraper.GetUserInfo(accountName)
	if err != nil {
		if strings.Contains(err.Error(), "request failed with status code: 404") {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

// GetStatus checks the TikTok API status
func (c *Client) GetStatus() (string, error) {
	// Try to fetch a known account to check if API is working
	_, err := c.scraper.GetUserInfo("tiktok")
	if err != nil {
		if errors.Is(err, context.DeadlineExceeded) {
			return "timeout", nil
		}
		return "unavailable", err
	}
	return "operational", nil
}

// RefreshAccountData refreshes data for a specific account
func (c *Client) RefreshAccountData(ctx context.Context, account *models.TikTokAccount) error {
	return c.FetchAndStoreAccountData(ctx, account)
}
