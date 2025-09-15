// internal/models/analytics.go
package models

import (
	"time"
)

type DailyAnalytics struct {
	ID              uint      `json:"id" gorm:"primaryKey"`
	TikTokAccountID uint      `json:"tiktok_account_id" gorm:"not null"`
	TikTokAccount   TikTokAccount `json:"-" gorm:"foreignKey:TikTokAccountID"`
	Date            time.Time `json:"date" gorm:"type:date;not null"`
	FollowerCount   int       `json:"follower_count" gorm:"default:0"`
	FollowingCount  int       `json:"following_count" gorm:"default:0"`
	TotalLikes      int64     `json:"total_likes" gorm:"default:0"`
	VideoCount      int       `json:"video_count" gorm:"default:0"`
	DailyUploads    int       `json:"daily_uploads" gorm:"default:0"`
	RecordedAt      time.Time `json:"recorded_at" gorm:"autoCreateTime"`
}

type AnalyticsResponse struct {
	Date            time.Time `json:"date"`
	FollowerCount   int       `json:"follower_count"`
	FollowingCount  int       `json:"following_count"`
	TotalLikes      int64     `json:"total_likes"`
	VideoCount      int       `json:"video_count"`
	DailyUploads    int       `json:"daily_uploads"`
	FollowerChange  int       `json:"follower_change"`
	FollowerGrowth  float64   `json:"follower_growth"`
	LikeGrowth      float64   `json:"like_growth"`
	UploadRate      float64   `json:"upload_rate"`
}

type DashboardResponse struct {
	TotalAccounts     int `json:"total_accounts"`
	TotalFollowers    int64 `json:"total_followers"`
	TotalLikes        int64 `json:"total_likes"`
	TotalVideos       int `json:"total_videos"`
	RecentGrowth      float64 `json:"recent_growth"`
	TopAccounts       []TikTokAccountResponse `json:"top_accounts"`
	RecentActivity    []DailyAnalytics `json:"recent_activity"`
	GroupStats        []GroupStats `json:"group_stats"`
}

type GroupStats struct {
	GroupID       uint   `json:"group_id"`
	GroupName     string `json:"group_name"`
	AccountCount  int    `json:"account_count"`
	TotalFollowers int64 `json:"total_followers"`
	GrowthRate    float64 `json:"growth_rate"`
}

type TrendResponse struct {
	Dates           []time.Time `json:"dates"`
	FollowerCounts  []int       `json:"follower_counts"`
	LikeCounts      []int64     `json:"like_counts"`
	VideoCounts     []int       `json:"video_counts"`
	UploadCounts    []int       `json:"upload_counts"`
}

type ComparisonResponse struct {
	Accounts       []TikTokAccountResponse `json:"accounts"`
	ComparisonData []ComparisonData `json:"comparison_data"`
}

type ComparisonData struct {
	Metric         string  `json:"metric"`
	Values         []int64 `json:"values"`
	GrowthRates    []float64 `json:"growth_rates"`
}