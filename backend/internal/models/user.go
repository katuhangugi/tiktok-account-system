// internal/models/user.go
package models

import (
	"time"
)

type Role string

const (
	RoleSuperAdmin Role = "super_admin"
	RoleManager    Role = "manager"
	RoleOperator   Role = "operator"
)

type User struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Username    string    `json:"username" gorm:"unique;not null"`
	Password    string    `json:"-" gorm:"not null"`
	Role        Role      `json:"role" gorm:"type:enum('super_admin','manager','operator');default:'operator'"`
	GroupID     *uint     `json:"group_id"`
	Group       *Group    `json:"group,omitempty" gorm:"foreignKey:GroupID"`
	CreatedBy   *uint     `json:"created_by"`
	Creator     *User     `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
	ManagedBy   *uint     `json:"managed_by"`
	Manager     *User     `json:"manager,omitempty" gorm:"foreignKey:ManagedBy"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type UserCreateRequest struct {
	Username    string `json:"username" binding:"required,min=3,max=50"`
	Password    string `json:"password" binding:"required,min=8"`
	Role        Role   `json:"role" binding:"required,oneof=super_admin manager operator"`
	GroupID     *uint  `json:"group_id"`
	ManagedBy   *uint  `json:"managed_by"`
}

type UserUpdateRequest struct {
	Username    *string `json:"username" binding:"omitempty,min=3,max=50"`
	Password    *string `json:"password" binding:"omitempty,min=8"`
	Role        *Role   `json:"role" binding:"omitempty,oneof=super_admin manager operator"`
	GroupID     *uint   `json:"group_id"`
	IsActive    *bool   `json:"is_active"`
}

type UserResponse struct {
	ID          uint      `json:"id"`
	Username    string    `json:"username"`
	Role        Role      `json:"role"`
	GroupID     *uint     `json:"group_id,omitempty"`
	GroupName   *string   `json:"group_name,omitempty"`
	CreatedBy   *uint     `json:"created_by,omitempty"`
	CreatorName *string   `json:"creator_name,omitempty"`
	ManagedBy   *uint     `json:"managed_by,omitempty"`
	ManagerName *string   `json:"manager_name,omitempty"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
}