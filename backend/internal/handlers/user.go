// internal/handlers/user.go
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"github.com/katuhangugi/tiktok-account-system/internal/utils"
)

func (h *Handler) ListUsers(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	role := c.Query("role")
	groupIDStr := c.Query("group_id")
	managerIDStr := c.Query("manager_id")

	var groupID, managerID uint
	if groupIDStr != "" {
		id, err := strconv.ParseUint(groupIDStr, 10, 32)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid group ID")
			return
		}
		groupID = uint(id)
	}

	if managerIDStr != "" {
		id, err := strconv.ParseUint(managerIDStr, 10, 32)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid manager ID")
			return
		}
		managerID = uint(id)
	}

	users, err := h.user.ListUsers(role, groupID, managerID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", users)
}

func (h *Handler) CreateUser(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.UserCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	user, err := h.user.CreateUser(userID, &req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "User created successfully", user)
}

func (h *Handler) GetUser(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, err := h.user.GetUser(uint(id))
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "User not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", user)
}

func (h *Handler) UpdateUser(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	var req models.UserUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	user, err := h.user.UpdateUser(userID, uint(id), &req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User updated successfully", user)
}

func (h *Handler) DeleteUser(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid user ID")
		return
	}

	if err := h.user.DeleteUser(userID, uint(id)); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User deleted successfully", nil)
}

func (h *Handler) GetUsersByRole(c *gin.Context) {
	role := c.Param("role")
	if role != "super_admin" && role != "manager" && role != "operator" {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid role")
		return
	}

	users, err := h.user.ListUsers(role, 0, 0)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", users)
}

func (h *Handler) AssignUserToGroup(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.AssignGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	if err := h.user.AssignToGroup(userID, req.UserID, req.GroupID); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "User assigned to group successfully", nil)
}

func (h *Handler) AssignManagerToGroup(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.AssignManagerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	if err := h.user.AssignManager(userID, req.UserID, req.ManagerID); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Manager assigned successfully", nil)
}
