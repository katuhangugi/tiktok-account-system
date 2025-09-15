package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"github.com/katuhangugi/tiktok-account-system/internal/utils"
	"github.com/katuhangugi/tiktok-account-system/internal/services"
)

type TikTokHandler struct {
	account *services.AccountService
	auth    *services.AuthService
	group   *services.GroupService
	tikTok  *services.TikTokService
}

func NewTikTokHandler(account *services.AccountService, auth *services.AuthService,
	group *services.GroupService, tikTok *services.TikTokService) *TikTokHandler {
	return &TikTokHandler{
		account: account,
		auth:    auth,
		group:   group,
		tikTok:  tikTok,
	}
}

func (h *TikTokHandler) FetchAccountData(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.FetchAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

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

	if user.Role == models.RoleOperator && (user.GroupID == nil || *user.GroupID != account.GroupID) {
		utils.ErrorResponse(c, http.StatusForbidden, "No access to this account")
		return
	}

	if user.Role == models.RoleManager {
		// Check if manager manages this group
		group, err := h.group.GetGroup(account.GroupID)
		if err != nil || group.ManagedBy == nil || *group.ManagedBy != user.ID {
			utils.ErrorResponse(c, http.StatusForbidden, "No access to this account")
			return
		}
	}

	if err := h.tikTok.FetchAccountData(account); err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Get updated account data
	updatedAccount, err := h.account.GetAccount(req.AccountID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Account data fetched successfully", updatedAccount)
}

func (h *TikTokHandler) GetTikTokAPIStatus(c *gin.Context) {
	status, err := h.tikTok.GetAPIStatus()
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", gin.H{"status": status})
}

func (h *TikTokHandler) ValidateAccount(c *gin.Context) {
	var req models.ValidateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	valid, err := h.tikTok.ValidateAccount(req.AccountName)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", gin.H{"valid": valid})
}
