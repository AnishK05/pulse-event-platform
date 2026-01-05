package http

import (
	"encoding/json"
	"fmt"
	"net/http"
)

// ErrorCode represents standard error codes
type ErrorCode string

const (
	ErrorCodeValidation    ErrorCode = "VALIDATION_ERROR"
	ErrorCodeUnauthorized  ErrorCode = "UNAUTHORIZED"
	ErrorCodeRateLimited   ErrorCode = "RATE_LIMITED"
	ErrorCodeInternal      ErrorCode = "INTERNAL_ERROR"
	ErrorCodeBadRequest    ErrorCode = "BAD_REQUEST"
)

// ErrorResponse represents a standardized error response
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail contains error code and message
type ErrorDetail struct {
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
}

// AppError represents an application error with HTTP status
type AppError struct {
	Code       ErrorCode
	Message    string
	HTTPStatus int
}

func (e *AppError) Error() string {
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

// Error constructors
func NewValidationError(message string) *AppError {
	return &AppError{
		Code:       ErrorCodeValidation,
		Message:    message,
		HTTPStatus: http.StatusBadRequest,
	}
}

func NewUnauthorizedError(message string) *AppError {
	return &AppError{
		Code:       ErrorCodeUnauthorized,
		Message:    message,
		HTTPStatus: http.StatusUnauthorized,
	}
}

func NewRateLimitError(message string) *AppError {
	return &AppError{
		Code:       ErrorCodeRateLimited,
		Message:    message,
		HTTPStatus: http.StatusTooManyRequests,
	}
}

func NewInternalError(message string) *AppError {
	return &AppError{
		Code:       ErrorCodeInternal,
		Message:    message,
		HTTPStatus: http.StatusInternalServerError,
	}
}

// RespondJSON sends a JSON response
func RespondJSON(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

// RespondError sends a standardized error response
func RespondError(w http.ResponseWriter, err error) {
	var appErr *AppError
	var ok bool

	if appErr, ok = err.(*AppError); !ok {
		appErr = NewInternalError(err.Error())
	}

	response := ErrorResponse{
		Error: ErrorDetail{
			Code:    appErr.Code,
			Message: appErr.Message,
		},
	}

	RespondJSON(w, appErr.HTTPStatus, response)
}


