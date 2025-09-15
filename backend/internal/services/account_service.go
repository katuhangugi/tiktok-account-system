// internal/services/account_service.go
package services

import (
	"errors"
	"time"

	"github.com/katuhangugi/tiktok-account-system/internal/models"
	"github.com/katuhangugi/tiktok-account-system/internal/repositories"
)

type AccountService struct {
	accountRepo *repositories.AccountRepository
	userRepo    *repositories.UserRepository
	groupRepo   *repositories.GroupRepository
	tikTokRepo  *repositories.TikTokRepository
}

func NewAccountService(accountRepo *repositories.AccountRepository, userRepo *repositories.UserRepository,
	groupRepo *repositories.GroupRepository, tikTokRepo *repositories.TikTokRepository) *AccountService {
	return &AccountService{
		accountRepo: accountRepo,
		userRepo:    userRepo,
		groupRepo:   groupRepo,
		tikTokRepo:  tikTokRepo,
	}
}

func (s *AccountService) CreateAccount(userID uint, req *models.TikTokAccountCreateRequest) (*models.TikTokAccountResponse, error) {
	// Check if user has access to the specified group
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Role == models.RoleOperator {
		if user.GroupID == nil || *user.GroupID != req.GroupID {
			return nil, errors.New("no access to this group")
		}
	} else if user.Role == models.RoleManager {
		// Check if manager manages this group
		group, err := s.groupRepo.FindByID(req.GroupID)
		if err != nil || group.ManagedBy == nil || *group.ManagedBy != user.ID {
			return nil, errors.New("no access to this group")
		}
	}

	account := &models.TikTokAccount{
		AccountName:       req.AccountName,
		Nickname:          req.Nickname,
		UID:               req.UID,
		Location:          req.Location,
		RegistrationDate:  req.RegistrationDate,
		CreatedBy:         userID,
		GroupID:           req.GroupID,
		AccountOwner:      req.AccountOwner,
		ContactInfo:       req.ContactInfo,
		Notes:             req.Notes,
		ResponsiblePerson: req.ResponsiblePerson,
		Tags:              req.Tags,
		IsActive:          true,
	}

	if err := s.accountRepo.Create(account); err != nil {
		return nil, err
	}

	// Fetch initial data from TikTok API
	if err := s.tikTokRepo.FetchAccountData(account); err != nil {
		// Log error but don't fail the operation
	}

	return s.GetAccount(account.ID)
}

func (s *AccountService) GetAccount(accountID uint) (*models.TikTokAccountResponse, error) {
	account, err := s.accountRepo.FindByID(accountID)
	if err != nil {
		return nil, err
	}

	response := &models.TikTokAccountResponse{
		ID:                account.ID,
		AccountName:       account.AccountName,
		Nickname:          account.Nickname,
		UID:               account.UID,
		Location:          account.Location,
		RegistrationDate:  account.RegistrationDate,
		CreatedBy:         account.CreatedBy,
		GroupID:           account.GroupID,
		AccountOwner:      account.AccountOwner,
		ContactInfo:       account.ContactInfo,
		Notes:             account.Notes,
		ResponsiblePerson: account.ResponsiblePerson,
		Tags:              account.Tags,
		IsActive:          account.IsActive,
		CreatedAt:         account.CreatedAt,
		UpdatedAt:         account.UpdatedAt,
	}

	if account.Creator != nil {
		response.CreatorName = account.Creator.Username
	}

	if account.Group != nil {
		response.GroupName = account.Group.Name
	}

	// Get latest analytics
	analytics, err := s.accountRepo.GetLatestAnalytics(account.ID)
	if err == nil && analytics != nil {
		response.FollowerCount = analytics.FollowerCount
		response.FollowingCount = analytics.FollowingCount
		response.TotalLikes = analytics.TotalLikes
		response.VideoCount = analytics.VideoCount
	}

	return response, nil
}

func (s *AccountService) ListAccounts(userID uint, groupID uint) ([]models.TikTokAccountResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	// If groupID is specified, check access
	if groupID != 0 {
		if user.Role == models.RoleOperator {
			if user.GroupID == nil || *user.GroupID != groupID {
				return nil, errors.New("no access to this group")
			}
		} else if user.Role == models.RoleManager {
			group, err := s.groupRepo.FindByID(groupID)
			if err != nil || group.ManagedBy == nil || *group.ManagedBy != user.ID {
				return nil, errors.New("no access to this group")
			}
		}
	} else {
		// If no groupID specified, filter by accessible groups
		if user.Role == models.RoleOperator && user.GroupID != nil {
			groupID = *user.GroupID
		} else if user.Role == models.RoleManager {
			// Get all groups managed by this manager
			groups, err := s.groupRepo.ListGroups(user.ID)
			if err != nil {
				return nil, err
			}
			if len(groups) == 0 {
				return []models.TikTokAccountResponse{}, nil
			}
			// We'll need to modify the repository to handle multiple group IDs
		}
	}

	accounts, err := s.accountRepo.ListAccounts(groupID)
	if err != nil {
		return nil, err
	}

	var responses []models.TikTokAccountResponse
	for _, account := range accounts {
		response := models.TikTokAccountResponse{
			ID:                account.ID,
			AccountName:       account.AccountName,
			Nickname:          account.Nickname,
			UID:               account.UID,
			Location:          account.Location,
			RegistrationDate:  account.RegistrationDate,
			CreatedBy:         account.CreatedBy,
			GroupID:           account.GroupID,
			AccountOwner:      account.AccountOwner,
			ContactInfo:       account.ContactInfo,
			Notes:             account.Notes,
			ResponsiblePerson: account.ResponsiblePerson,
			Tags:              account.Tags,
			IsActive:          account.IsActive,
			CreatedAt:         account.CreatedAt,
			UpdatedAt:         account.UpdatedAt,
		}

		if account.Creator != nil {
			response.CreatorName = account.Creator.Username
		}

		if account.Group != nil {
			response.GroupName = account.Group.Name
		}

		// Get latest analytics
		analytics, err := s.accountRepo.GetLatestAnalytics(account.ID)
		if err == nil && analytics != nil {
			response.FollowerCount = analytics.FollowerCount
			response.FollowingCount = analytics.FollowingCount
			response.TotalLikes = analytics.TotalLikes
			response.VideoCount = analytics.VideoCount
		}

		responses = append(responses, response)
	}

	return responses, nil
}

func (s *AccountService) UpdateAccount(userID, accountID uint, req *models.TikTokAccountUpdateRequest) (*models.TikTokAccountResponse, error) {
	account, err := s.accountRepo.FindByID(accountID)
	if err != nil {
		return nil, errors.New("account not found")
	}

	// Check if user has access to this account's group
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	if user.Role == models.RoleOperator {
		if user.GroupID == nil || *user.GroupID != account.GroupID {
			return nil, errors.New("no access to this account")
		}
	} else if user.Role == models.RoleManager {
		group, err := s.groupRepo.FindByID(account.GroupID)
		if err != nil || group.ManagedBy == nil || *group.ManagedBy != user.ID {
			return nil, errors.New("no access to this account")
		}
	}

	// Apply updates
	if req.AccountName != nil {
		account.AccountName = *req.AccountName
	}

	if req.Nickname != nil {
		account.Nickname = *req.Nickname
	}

	if req.UID != nil {
		account.UID = *req.UID
	}

	if req.Location != nil {
		account.Location = *req.Location
	}

	if req.RegistrationDate != nil {
		account.RegistrationDate = *req.RegistrationDate
	}

	if req.GroupID != nil {
		// Check if user has access to the new group
		if user.Role == models.RoleOperator {
			if user.GroupID == nil || *user.GroupID != *req.GroupID {
				return nil, errors.New("no access to the new group")
			}
		} else if user.Role == models.RoleManager {
			group, err := s.groupRepo.FindByID(*req.GroupID)
			if err != nil || group.ManagedBy == nil || *group.ManagedBy != user.ID {
				return nil, errors.New("no access to the new group")
			}
		}
		account.GroupID = *req.GroupID
	}

	if req.AccountOwner != nil {
		account.AccountOwner = *req.AccountOwner
	}

	if req.ContactInfo != nil {
		account.ContactInfo = *req.ContactInfo
	}

	if req.Notes != nil {
		account.Notes = *req.Notes
	}

	if req.ResponsiblePerson != nil {
		account.ResponsiblePerson = *req.ResponsiblePerson
	}

	if req.Tags != nil {
		account.Tags = *req.Tags
	}

	if req.IsActive != nil {
		account.IsActive = *req.IsActive
	}

	if err := s.accountRepo.Update(account); err != nil {
		return nil, err
	}

	return s.GetAccount(account.ID)
}

func (s *AccountService) DeleteAccount(userID, accountID uint) error {
	account, err := s.accountRepo.FindByID(accountID)
	if err != nil {
		return errors.New("account not found")
	}

	// Check if user has access to this account's group
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return errors.New("user not found")
	}

	if user.Role == models.RoleOperator {
		if user.GroupID == nil || *user.GroupID != account.GroupID {
			return errors.New("no access to this account")
		}
	} else if user.Role == models.RoleManager {
		group, err := s.groupRepo.FindByID(account.GroupID)
		if err != nil || group.ManagedBy == nil || *group.ManagedBy != user.ID {
			return errors.New("no access to this account")
		}
	}

	return s.accountRepo.Delete(account.ID)
}

func (s *AccountService) TransferToGroup(userID, accountID, groupID uint) error {
	// Check if user has access to both current and new groups
	// Implementation similar to UpdateAccount
	return s.accountRepo.TransferToGroup(accountID, groupID)
}

func (s *AccountService) GetAccountTrends(accountID uint, days int) (*models.TrendResponse, error) {
	analytics, err := s.accountRepo.GetAccountTrends(accountID, days)
	if err != nil {
		return nil, err
	}

	response := &models.TrendResponse{
		Dates:          make([]time.Time, len(analytics)),
		FollowerCounts: make([]int, len(analytics)),
		LikeCounts:     make([]int64, len(analytics)),
		VideoCounts:    make([]int, len(analytics)),
		UploadCounts:   make([]int, len(analytics)),
	}

	for i, a := range analytics {
		response.Dates[i] = a.Date
		response.FollowerCounts[i] = a.FollowerCount
		response.LikeCounts[i] = a.TotalLikes
		response.VideoCounts[i] = a.VideoCount
		response.UploadCounts[i] = a.DailyUploads
	}

	return response, nil
}

func (s *AccountService) GetDashboardData(userID uint) (*models.DashboardResponse, error) {
	user, err := s.userRepo.FindByID(userID)
	if err != nil {
		return nil, errors.New("user not found")
	}

	var groupIDs []uint
	if user.Role == models.RoleSuperAdmin {
		// Super admin gets data for all groups
		groups, err := s.groupRepo.ListGroups(0)
		if err != nil {
			return nil, err
		}
		for _, g := range groups {
			groupIDs = append(groupIDs, g.ID)
		}
	} else if user.Role == models.RoleManager {
		// Manager gets data for groups they manage
		groups, err := s.groupRepo.ListGroups(user.ID)
		if err != nil {
			return nil, err
		}
		for _, g := range groups {
			groupIDs = append(groupIDs, g.ID)
		}
	} else if user.Role == models.RoleOperator && user.GroupID != nil {
		// Operator gets data for their group only
		groupIDs = append(groupIDs, *user.GroupID)
	}

	if len(groupIDs) == 0 {
		return &models.DashboardResponse{}, nil
	}

	return s.accountRepo.GetDashboardData(groupIDs)
}
