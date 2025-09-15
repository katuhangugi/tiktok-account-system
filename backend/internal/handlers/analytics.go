// internal/handlers/analytics.go
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/katuhangugi/tiktok-account-system/internal/utils"
)

func (h *Handler) GetDashboardData(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	data, err := h.account.GetDashboardData(userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", data)
}

func (h *Handler) GetAccountTrends(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid account ID")
		return
	}

	daysStr := c.DefaultQuery("days", "7")
	days, err := strconv.Atoi(daysStr)
	if err != nil || days <= 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid days parameter")
		return
	}

	// Check if user has access to this account
	account, err := h.account.GetAccount(uint(id))
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Account not found")
		return
	}

	// Verify access
	user, err := h.auth.GetCurrentUser(userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not found")
		return
	}

	if user.Role == "operator" && (user.GroupID == nil || *user.GroupID != account.GroupID) {
		utils.ErrorResponse(c, http.StatusForbidden, "No access to this account")
		return
	}

	if user.Role == "manager" {
		// Check if manager manages this group
		group, err := h.group.GetGroup(account.GroupID)
		if err != nil || group.ManagedBy == nil || *group.ManagedBy != user.ID {
			utils.ErrorResponse(c, http.StatusForbidden, "No access to this account")
			return
		}
	}

	trends, err := h.account.GetAccountTrends(uint(id), days)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", trends)
}

func (h *Handler) CompareAccounts(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.CompareAccountsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	// Verify access to all accounts
	for _, accountID := range req.AccountIDs {
		account, err := h.account.GetAccount(accountID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusNotFound, "Account not found")
			return
		}

		// Verify access
		user, err := h.auth.GetCurrentUser(userID)
		if err != nil {
			utils.ErrorResponse(c, http.StatusUnauthorized, "User not found")
			return
		}

		if user.Role == "operator" && (user.GroupID == nil || *user.GroupID != account.GroupID) {
			utils.ErrorResponse(c, http.StatusForbidden, "No access to one or more accounts")
			return
		}

		if user.Role == "manager" {
			// Check if manager manages this group
			group, err := h.group.GetGroup(account.GroupID)
			if err != nil || group.ManagedBy == nil || *group.ManagedBy != user.ID {
				utils.ErrorResponse(c, http.StatusForbidden, "No access to one or more accounts")
				return
			}
		}
	}

	comparison, err := h.analytics.GetComparisonData(req.AccountIDs, req.Days)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", comparison)
}

func (h *Handler) RefreshAccountData(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.RefreshAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	// Verify access to the account
	account, err := h.account.GetAccount(req.AccountID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Account not found")
		return
	}

	// Verify access
	user, err := h.auth.GetCurrentUser(userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not found")
		return
	}

	if user.Role == "operator" && (user.GroupID == nil || *user.GroupID != account.GroupID) {
		utils.ErrorResponse(c, http.StatusForbidden, "No access to this account")
		return
	}

	if user.Role == "manager" {
		// Check if manager manages this group
		group, err := h.group.GetGroup(account.GroupID)
		if err != nil || group.ManagedBy == nil || *group.ManagedBy != user.ID {
			utils.ErrorResponse(c, http.StatusForbidden, "No access to this account")
			return
		}
	}

	if err := h.tikTok.RefreshAccountData(req.AccountID); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Account data refreshed successfully", nil)
}

func (h *Handler) GetGroupAnalytics(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid group ID")
		return
	}

	daysStr := c.DefaultQuery("days", "30")
	days, err := strconv.Atoi(daysStr)
	if err != nil || days <= 0 {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid days parameter")
		return
	}

	// Verify access to the group
	group, err := h.group.GetGroup(uint(id))
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Group not found")
		return
	}

	// Verify access
	user, err := h.auth.GetCurrentUser(userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "User not found")
		return
	}

	if user.Role == "operator" && (user.GroupID == nil || *user.GroupID != group.ID) {
		utils.ErrorResponse(c, http.StatusForbidden, "No access to this group")
		return
	}

	if user.Role == "manager" && (group.ManagedBy == nil || *group.ManagedBy != user.ID) {
		utils.ErrorResponse(c, http.StatusForbidden, "No access to this group")
		return
	}

	analytics, err := h.analytics.GetGroupTrends(uint(id), days)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", analytics)
}

func (h *Handler) GetSummaryAnalytics(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	data, err := h.account.GetDashboardData(userID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", data)
}
