// internal/models/group.go
package models

import (
	"time"
)

type Group struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description"`
	CreatedBy   uint      `json:"created_by" gorm:"not null"`
	Creator     User      `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	ManagedBy   *uint     `json:"managed_by"`
	Manager     *User     `json:"manager,omitempty" gorm:"foreignKey:ManagedBy"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type GroupCreateRequest struct {
	Name        string `json:"name" binding:"required,min=3,max=100"`
	Description string `json:"description" binding:"max=500"`
	ManagedBy   *uint  `json:"managed_by"`
}

type GroupUpdateRequest struct {
	Name        *string `json:"name" binding:"omitempty,min=3,max=100"`
	Description *string `json:"description" binding:"omitempty,max=500"`
	ManagedBy   *uint   `json:"managed_by"`
	IsActive    *bool   `json:"is_active"`
}

type GroupResponse struct {
	ID          uint       `json:"id"`
	Name        string     `json:"name"`
	Description string     `json:"description"`
	CreatedBy   uint       `json:"created_by"`
	CreatorName string     `json:"creator_name"`
	ManagedBy   *uint      `json:"managed_by,omitempty"`
	ManagerName *string    `json:"manager_name,omitempty"`
	IsActive    bool       `json:"is_active"`
	CreatedAt   time.Time  `json:"created_at"`
	UserCount   int        `json:"user_count"`
	AccountCount int       `json:"account_count"`
}