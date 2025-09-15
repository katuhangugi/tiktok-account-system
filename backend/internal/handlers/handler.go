// internal/handlers/handler.go
package handlers

import (
	"github.com/katuhangugi/tiktok-account-system/internal/config"
	"github.com/katuhangugi/tiktok-account-system/internal/repositories"
	"github.com/katuhangugi/tiktok-account-system/internal/services"
	"gorm.io/gorm"
)

type Handler struct {
	db        *gorm.DB
	cfg       *config.Config
	auth      *services.AuthService
	user      *services.UserService
	group     *services.GroupService
	account   *services.AccountService
	analytics *services.AnalyticsService
	tikTok    *services.TikTokService
}

func NewHandler(db *gorm.DB, cfg *config.Config) *Handler {
	// Initialize repositories
	userRepo := repositories.NewUserRepository(db)
	groupRepo := repositories.NewGroupRepository(db)
	accountRepo := repositories.NewAccountRepository(db)
	analyticsRepo := repositories.NewAnalyticsRepository(db)
	tikTokRepo := repositories.NewTikTokRepository(cfg)

	// Initialize services
	authService := services.NewAuthService(userRepo, cfg)
	userService := services.NewUserService(userRepo, groupRepo)
	groupService := services.NewGroupService(groupRepo, userRepo)
	accountService := services.NewAccountService(accountRepo, userRepo, groupRepo, tikTokRepo)
	analyticsService := services.NewAnalyticsService(analyticsRepo, accountRepo)
	tikTokService := services.NewTikTokService(accountRepo, analyticsRepo, tikTokRepo)

	return &Handler{
		db:        db,
		cfg:       cfg,
		auth:      authService,
		user:      userService,
		group:     groupService,
		account:   accountService,
		analytics: analyticsService,
		tikTok:    tikTokService,
	}
}
