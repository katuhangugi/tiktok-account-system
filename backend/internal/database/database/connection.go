// internal/database/connection.go
package database

import (
	"fmt"
	"log"
	"time"

	"github.com/katuhangugi/tiktok-account-system/internal/config"
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func Init(cfg *config.Config) (*gorm.DB, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.Name,
	)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	sqlDB, err := DB.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %v", err)
	}

	// Set connection pool settings
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Successfully connected to database")
	return DB, nil
}

func AutoMigrate(db *gorm.DB) error {
	// List all your models here
	err := db.AutoMigrate(
		&models.User{},
		&models.Group{},
		&models.TikTokAccount{},
		&models.DailyAnalytics{},
	)

	if err != nil {
		return fmt.Errorf("failed to auto-migrate database: %v", err)
	}

	return nil
}
