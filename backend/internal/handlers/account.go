// internal/handlers/account.go
package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"github.com/katuhangugi/tiktok-account-system/internal/utils"
)

func (h *Handler) ListAccounts(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	groupIDStr := c.Query("group_id")

	var groupID uint
	if groupIDStr != "" {
		id, err := strconv.ParseUint(groupIDStr, 10, 32)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid group ID")
			return
		}
		groupID = uint(id)
	}

	accounts, err := h.account.ListAccounts(userID, groupID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", accounts)
}

func (h *Handler) CreateAccount(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.TikTokAccountCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	account, err := h.account.CreateAccount(userID, &req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, "Account created successfully", account)
}

func (h *Handler) GetAccount(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid account ID")
		return
	}

	account, err := h.account.GetAccount(uint(id))
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "Account not found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", account)
}

func (h *Handler) UpdateAccount(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid account ID")
		return
	}

	var req models.TikTokAccountUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	account, err := h.account.UpdateAccount(userID, uint(id), &req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Account updated successfully", account)
}

func (h *Handler) DeleteAccount(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid account ID")
		return
	}

	if err := h.account.DeleteAccount(userID, uint(id)); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Account deleted successfully", nil)
}

func (h *Handler) ImportAccounts(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.ImportAccountsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	// Process imported accounts
	var createdAccounts []models.TikTokAccountResponse
	for _, accountReq := range req.Accounts {
		account, err := h.account.CreateAccount(userID, &accountReq)
		if err != nil {
			// Skip failed accounts but continue with others
			continue
		}
		createdAccounts = append(createdAccounts, *account)
	}

	utils.SuccessResponse(c, http.StatusCreated, "Accounts imported successfully", createdAccounts)
}

func (h *Handler) ExportAccounts(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)
	groupIDStr := c.Query("group_id")

	var groupID uint
	if groupIDStr != "" {
		id, err := strconv.ParseUint(groupIDStr, 10, 32)
		if err != nil {
			utils.ErrorResponse(c, http.StatusBadRequest, "Invalid group ID")
			return
		}
		groupID = uint(id)
	}

	accounts, err := h.account.ListAccounts(userID, groupID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Convert to export format
	var exportData []models.TikTokAccountExport
	for _, account := range accounts {
		exportData = append(exportData, models.TikTokAccountExport{
			AccountName:       account.AccountName,
			Nickname:          account.Nickname,
			UID:               account.UID,
			Location:          account.Location,
			RegistrationDate:  account.RegistrationDate,
			GroupName:         account.GroupName,
			AccountOwner:      account.AccountOwner,
			ContactInfo:       account.ContactInfo,
			Notes:             account.Notes,
			ResponsiblePerson: account.ResponsiblePerson,
			Tags:              account.Tags,
			FollowerCount:     account.FollowerCount,
			FollowingCount:    account.FollowingCount,
			TotalLikes:        account.TotalLikes,
			VideoCount:        account.VideoCount,
		})
	}

	utils.SuccessResponse(c, http.StatusOK, "", exportData)
}

func (h *Handler) GetAccountsByGroup(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "Invalid group ID")
		return
	}

	accounts, err := h.account.ListAccounts(userID, uint(id))
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "", accounts)
}

func (h *Handler) TransferAccountToGroup(c *gin.Context) {
	userID := c.MustGet("user_id").(uint)

	var req models.TransferAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ValidationErrorResponse(c, utils.GetValidationErrors(err))
		return
	}

	if err := h.account.TransferToGroup(userID, req.AccountID, req.GroupID); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	utils.SuccessResponse(c, http.StatusOK, "Account transferred successfully", nil)
}
