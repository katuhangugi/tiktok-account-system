package tiktok

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// TikTokUserInfo represents the user information scraped from TikTok
type TikTokUserInfo struct {
	Username  string    `json:"username"`
	Name      string    `json:"name"`
	Region    string    `json:"region"`
	ID        string    `json:"id"`
	CreatedAt time.Time `json:"created_at"`
	Followers int64     `json:"followers"`
	Following int64     `json:"following"`
	Likes     int64     `json:"likes"`
	Videos    int64     `json:"videos"`
}

// Scraper handles TikTok data scraping
type Scraper struct {
	client *http.Client
}

// NewScraper creates a new TikTok scraper instance
func NewScraper(timeout time.Duration) *Scraper {
	return &Scraper{
		client: &http.Client{
			Timeout: timeout,
		},
	}
}

// GetUserInfo scrapes TikTok user information
func (s *Scraper) GetUserInfo(username string) (*TikTokUserInfo, error) {
	if strings.TrimSpace(username) == "" {
		return nil, errors.New("username cannot be empty")
	}

	url := fmt.Sprintf("https://www.tiktok.com/@%s", username)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	// Set headers to mimic a browser request
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.88 Safari/537.36")
	req.Header.Set("Accept-Language", "en-US,en;q=0.9")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("request failed with status code: %d", resp.StatusCode)
	}

	htmlBytes, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	// Parse the HTML to find user info
	doc, err := goquery.NewDocumentFromReader(bytes.NewReader(htmlBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML: %v", err)
	}

	var scriptContent string
	doc.Find("script").EachWithBreak(func(i int, s *goquery.Selection) bool {
		txt := s.Text()
		if strings.Contains(txt, "userInfo") {
			scriptContent = txt
			return false
		}
		return true
	})

	if scriptContent == "" {
		return nil, errors.New("user info script not found")
	}

	// Extract JSON from script
	start := strings.Index(scriptContent, "{")
	end := strings.LastIndex(scriptContent, "}")
	if start < 0 || end < 0 || end <= start {
		return nil, errors.New("invalid JSON in script")
	}
	rawJSON := scriptContent[start : end+1]

	// Parse JSON
	var root map[string]interface{}
	if err := json.Unmarshal([]byte(rawJSON), &root); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %v", err)
	}

	// Navigate through the JSON structure
	scope, ok := root["__DEFAULT_SCOPE__"].(map[string]interface{})
	if !ok {
		return nil, errors.New("__DEFAULT_SCOPE__ not found")
	}

	detail, ok := scope["webapp.user-detail"].(map[string]interface{})
	if !ok {
		return nil, errors.New("webapp.user-detail not found")
	}

	userInfo, ok := detail["userInfo"].(map[string]interface{})
	if !ok {
		return nil, errors.New("userInfo not found")
	}

	user, ok := userInfo["user"].(map[string]interface{})
	if !ok {
		return nil, errors.New("user node not found")
	}

	stats, ok := userInfo["stats"].(map[string]interface{})
	if !ok {
		return nil, errors.New("stats node not found")
	}

	// Build the result
	info := &TikTokUserInfo{
		Username:  username,
		Name:      fmt.Sprint(user["nickname"]),
		Region:    fmt.Sprint(user["region"]),
		ID:        fmt.Sprint(user["id"]),
		Followers: int64(stats["followerCount"].(float64)),
		Following: int64(stats["followingCount"].(float64)),
		Likes:     int64(stats["heartCount"].(float64)),
		Videos:    int64(stats["videoCount"].(float64)),
	}

	// Parse creation time
	if t, ok := user["createTime"].(float64); ok && t > 0 {
		info.CreatedAt = time.Unix(int64(t), 0).UTC()
	}

	return info, nil
}
