// internal/models/tiktok_account.go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

// TikTokAccount represents a TikTok account in our system
type TikTokAccount struct {
	ID                uint             `json:"id" gorm:"primaryKey"`
	AccountName       string           `json:"account_name" gorm:"not null;uniqueIndex"`
	Nickname          string           `json:"nickname"`
	UID               string           `json:"uid" gorm:"index"`
	Location          string           `json:"location"`
	RegistrationDate  *time.Time       `json:"registration_date"`
	CreatedBy         uint             `json:"created_by" gorm:"not null"`
	Creator           User             `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	GroupID           uint             `json:"group_id" gorm:"not null"`
	Group             Group            `json:"group,omitempty" gorm:"foreignKey:GroupID"`
	AccountOwner      string           `json:"account_owner"`
	ContactInfo       string           `json:"contact_info"`
	Notes             string           `json:"notes"`
	ResponsiblePerson string           `json:"responsible_person"`
	Tags              JSON             `json:"tags" gorm:"type:json"`
	IPAddress         string           `json:"ip_address"`
	IsActive          bool             `json:"is_active" gorm:"default:true"`
	CreatedAt         time.Time        `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time        `json:"updated_at" gorm:"autoUpdateTime"`
	Analytics         []DailyAnalytics `json:"analytics,omitempty" gorm:"foreignKey:TikTokAccountID"`
}

// TikTokData represents scraped TikTok account data
type TikTokData struct {
	AccountName  string    `json:"account_name"`
	Nickname     string    `json:"nickname"`
	UID          string    `json:"uid"`
	Region       string    `json:"region"`
	CreatedAt    time.Time `json:"created_at"`
	Followers    int64     `json:"followers"`
	Following    int64     `json:"following"`
	Likes        int64     `json:"likes"`
	Videos       int64     `json:"videos"`
	DailyUploads int64     `json:"daily_uploads"`
}

// TikTokAccountCreateRequest represents the payload for creating a new TikTok account
type TikTokAccountCreateRequest struct {
	AccountName       string     `json:"account_name" binding:"required"`
	Nickname          string     `json:"nickname"`
	UID               string     `json:"uid"`
	Location          string     `json:"location"`
	RegistrationDate  *time.Time `json:"registration_date"`
	GroupID           uint       `json:"group_id" binding:"required"`
	AccountOwner      string     `json:"account_owner"`
	ContactInfo       string     `json:"contact_info"`
	Notes             string     `json:"notes"`
	ResponsiblePerson string     `json:"responsible_person"`
	Tags              JSON       `json:"tags"`
}

// TikTokAccountUpdateRequest represents the payload for updating a TikTok account
type TikTokAccountUpdateRequest struct {
	AccountName       *string    `json:"account_name"`
	Nickname          *string    `json:"nickname"`
	UID               *string    `json:"uid"`
	Location          *string    `json:"location"`
	RegistrationDate  *time.Time `json:"registration_date"`
	GroupID           *uint      `json:"group_id"`
	AccountOwner      *string    `json:"account_owner"`
	ContactInfo       *string    `json:"contact_info"`
	Notes             *string    `json:"notes"`
	ResponsiblePerson *string    `json:"responsible_person"`
	Tags              *JSON      `json:"tags"`
	IsActive          *bool      `json:"is_active"`
}

// TikTokAccountResponse represents the response format for TikTok account data
type TikTokAccountResponse struct {
	ID                uint             `json:"id"`
	AccountName       string           `json:"account_name"`
	Nickname          string           `json:"nickname"`
	UID               string           `json:"uid"`
	Location          string           `json:"location"`
	RegistrationDate  *time.Time       `json:"registration_date,omitempty"`
	CreatedBy         uint             `json:"created_by"`
	CreatorName       string           `json:"creator_name"`
	GroupID           uint             `json:"group_id"`
	GroupName         string           `json:"group_name"`
	AccountOwner      string           `json:"account_owner,omitempty"`
	ContactInfo       string           `json:"contact_info,omitempty"`
	Notes             string           `json:"notes,omitempty"`
	ResponsiblePerson string           `json:"responsible_person,omitempty"`
	Tags              JSON             `json:"tags,omitempty"`
	IsActive          bool             `json:"is_active"`
	CreatedAt         time.Time        `json:"created_at"`
	UpdatedAt         time.Time        `json:"updated_at"`
	LatestAnalytics   *DailyAnalytics  `json:"latest_analytics,omitempty"`
	AnalyticsHistory  []DailyAnalytics `json:"analytics_history,omitempty"`
}

// JSON type for handling JSON data in GORM
type JSON map[string]interface{}

// Scan implements the sql.Scanner interface for JSON type
func (j *JSON) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	return json.Unmarshal(bytes, j)
}

// Value implements the driver.Valuer interface for JSON type
func (j JSON) Value() (driver.Value, error) {
	if j == nil {
		return nil, nil
	}
	return json.Marshal(j)
}

// ToResponse converts TikTokAccount to TikTokAccountResponse
func (a *TikTokAccount) ToResponse(latestAnalytics *DailyAnalytics, history []DailyAnalytics) *TikTokAccountResponse {
	return &TikTokAccountResponse{
		ID:                a.ID,
		AccountName:       a.AccountName,
		Nickname:          a.Nickname,
		UID:               a.UID,
		Location:          a.Location,
		RegistrationDate:  a.RegistrationDate,
		CreatedBy:         a.CreatedBy,
		GroupID:           a.GroupID,
		GroupName:         a.Group.Name, // Assuming Group has Name field
		AccountOwner:      a.AccountOwner,
		ContactInfo:       a.ContactInfo,
		Notes:             a.Notes,
		ResponsiblePerson: a.ResponsiblePerson,
		Tags:              a.Tags,
		IsActive:          a.IsActive,
		CreatedAt:         a.CreatedAt,
		UpdatedAt:         a.UpdatedAt,
		LatestAnalytics:   latestAnalytics,
		AnalyticsHistory:  history,
	}
}
