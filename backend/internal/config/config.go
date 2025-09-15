package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"github.com/gin-gonic/gin"
	"github.com/katuhangugi/tiktok-account-system/internal/config"
	"github.com/katuhangugi/tiktok-account-system/internal/database/database"
	"github.com/katuhangugi/tiktok-account-system/internal/handlers"
	"github.com/katuhangugi/tiktok-account-system/internal/middleware"
	"github.com/katuhangugi/tiktok-account-system/pkg/logger"
)

func main() {
	// Initialize logger
	log := logger.Default()
	defer log.Close()

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Set log level from config
	if cfg.Logging.Level != "" {
		switch strings.ToLower(cfg.Logging.Level) {
		case "debug":
			log.SetLevel(logger.DEBUG)
		case "info":
			log.SetLevel(logger.INFO)
		case "warn":
			log.SetLevel(logger.WARN)
		case "error":
			log.SetLevel(logger.ERROR)
		}
	}

	// Initialize database
	db, err := database.Init(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer func() {
		if sqlDB, err := db.DB(); err == nil {
			if err := sqlDB.Close(); err != nil {
				log.Errorf("Failed to close database connection: %v", err)
			}
		}
	}()

	// Run database migrations
	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("Failed to run database migrations: %v", err)
	}

	// Create Gin router with production mode if not in debug
	if !cfg.Server.Debug {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.New()

	// Apply middleware
	router.Use(
		middleware.LoggingMiddleware(log),
		middleware.RecoveryMiddleware(log),
		middleware.CORS(),
		middleware.RequestIDMiddleware(),
	)

	// Initialize handlers
	handler := handlers.NewHandler(db, cfg, log)

	// Setup routes
	setupRoutes(router, handler)

	// Create HTTP server with timeouts
	server := &http.Server{
		Addr:         cfg.Server.Address,
		Handler:      router,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	// Start server in a goroutine
	go func() {
		log.Infof("Starting server on %s", cfg.Server.Address)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Info("Shutting down server...")

	// Create a deadline to wait for
	ctx, cancel := context.WithTimeout(context.Background(), cfg.Server.ShutdownTimeout)
	defer cancel()

	// Gracefully shutdown the server
	if err := server.Shutdown(ctx); err != nil {
		log.Errorf("Server forced to shutdown: %v", err)
	}

	log.Info("Server exited properly")
}

func setupRoutes(router *gin.Engine, handler *handlers.Handler) {
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Authentication routes
	auth := router.Group("/api/auth")
	{
		auth.POST("/login", handler.Login)
		auth.POST("/logout", middleware.AuthRequired(), handler.Logout)
		auth.GET("/me", middleware.AuthRequired(), handler.GetCurrentUser)
		auth.POST("/refresh", handler.RefreshToken)
	}

	// User management routes
	users := router.Group("/api/users").Use(middleware.AuthRequired())
	{
		users.GET("", middleware.RoleRequired("super_admin", "manager"), handler.ListUsers)
		users.POST("", middleware.RoleRequired("super_admin", "manager"), handler.CreateUser)
		users.GET("/:id", middleware.RoleRequired("super_admin", "manager"), handler.GetUser)
		users.PUT("/:id", middleware.RoleRequired("super_admin", "manager"), handler.UpdateUser)
		users.DELETE("/:id", middleware.RoleRequired("super_admin", "manager"), handler.DeleteUser)
		users.GET("/by-role/:role", middleware.RoleRequired("super_admin", "manager"), handler.GetUsersByRole)
		users.POST("/assign-group", middleware.RoleRequired("super_admin", "manager"), handler.AssignUserToGroup)
		users.POST("/assign-manager", middleware.RoleRequired("super_admin"), handler.AssignManagerToGroup)
	}

	// Group management routes
	groups := router.Group("/api/groups").Use(middleware.AuthRequired())
	{
		groups.GET("", middleware.RoleRequired("super_admin", "manager"), handler.ListGroups)
		groups.POST("", middleware.RoleRequired("super_admin", "manager"), handler.CreateGroup)
		groups.GET("/:id", middleware.RoleRequired("super_admin", "manager"), handler.GetGroup)
		groups.PUT("/:id", middleware.RoleRequired("super_admin", "manager"), handler.UpdateGroup)
		groups.DELETE("/:id", middleware.RoleRequired("super_admin"), handler.DeleteGroup)
		groups.GET("/managed", middleware.RoleRequired("manager"), handler.GetManagedGroups)
		groups.POST("/assign-manager", middleware.RoleRequired("super_admin"), handler.AssignManagerToGroup)
		groups.GET("/:id/users", middleware.RoleRequired("super_admin", "manager"), handler.GetGroupUsers)
	}

	// TikTok account routes
	accounts := router.Group("/api/accounts").Use(middleware.AuthRequired())
	{
		accounts.GET("", handler.ListAccounts)
		accounts.POST("", middleware.RoleRequired("super_admin", "manager", "operator"), handler.CreateAccount)
		accounts.GET("/:id", handler.GetAccount)
		accounts.PUT("/:id", middleware.RoleRequired("super_admin", "manager", "operator"), handler.UpdateAccount)
		accounts.DELETE("/:id", middleware.RoleRequired("super_admin", "manager"), handler.DeleteAccount)
		accounts.POST("/import", middleware.RoleRequired("super_admin", "manager"), handler.ImportAccounts)
		accounts.GET("/export", middleware.RoleRequired("super_admin", "manager", "operator"), handler.ExportAccounts)
		accounts.GET("/by-group/:id", handler.GetAccountsByGroup)
		accounts.POST("/transfer-group", middleware.RoleRequired("super_admin", "manager"), handler.TransferAccountToGroup)
	}

	// Analytics routes
	analytics := router.Group("/api/analytics").Use(middleware.AuthRequired())
	{
		analytics.GET("/dashboard", handler.GetDashboardData)
		analytics.GET("/:id/trends", handler.GetAccountTrends)
		analytics.GET("/compare", handler.CompareAccounts)
		analytics.POST("/refresh", middleware.RoleRequired("super_admin", "manager"), handler.RefreshAccountData)
		analytics.GET("/group/:id", handler.GetGroupAnalytics)
		analytics.GET("/summary", handler.GetSummaryAnalytics)
	}

	// TikTok API integration routes
	tiktok := router.Group("/api/tiktok").Use(middleware.AuthRequired())
	{
		tiktok.POST("/fetch", middleware.RoleRequired("super_admin", "manager"), handler.FetchAccountData)
		tiktok.GET("/status", middleware.RoleRequired("super_admin", "manager"), handler.GetTikTokAPIStatus)
		tiktok.POST("/validate", middleware.RoleRequired("super_admin", "manager", "operator"), handler.ValidateAccount)
	}

	// 404 handler
	router.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"error":   "Not Found",
			"message": "The requested resource was not found",
		})
	})
}
