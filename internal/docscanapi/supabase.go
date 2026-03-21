package docscanapi

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

type Client struct {
	SupabaseURL        string
	SupabaseAnonKey    string
	SupabaseServiceKey string
	HTTPClient         *http.Client
}

func NewClient() (*Client, error) {
	supabaseURL := os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	if supabaseURL == "" {
		supabaseURL = os.Getenv("SUPABASE_URL")
	}
	anonKey := os.Getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
	if anonKey == "" {
		anonKey = os.Getenv("SUPABASE_ANON_KEY")
	}
	serviceKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" {
		return nil, fmt.Errorf("supabase url is not configured")
	}
	if anonKey == "" && serviceKey == "" {
		return nil, fmt.Errorf("supabase keys are not configured")
	}
	if serviceKey == "" {
		return nil, fmt.Errorf("supabase service role key is required for go serverless functions")
	}

	return &Client{
		SupabaseURL:        strings.TrimRight(supabaseURL, "/"),
		SupabaseAnonKey:    anonKey,
		SupabaseServiceKey: serviceKey,
		HTTPClient: &http.Client{
			Timeout: 25 * time.Second,
		},
	}, nil
}

func (c *Client) VerifyUser(authHeader string) (*AuthUser, error) {
	if authHeader == "" {
		return nil, fmt.Errorf("missing authorization header")
	}

	req, err := http.NewRequest(http.MethodGet, c.SupabaseURL+"/auth/v1/user", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", authHeader)
	req.Header.Set("apikey", firstNonEmpty(c.SupabaseAnonKey, c.SupabaseServiceKey))

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("auth verification failed: %s", string(body))
	}

	var user AuthUser
	if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
		return nil, err
	}
	return &user, nil
}

func (c *Client) GetDocument(documentID string, userID string) (*Document, error) {
	var rows []Document
	query := fmt.Sprintf("%s/rest/v1/documents?id=eq.%s&user_id=eq.%s&select=id,user_id,name,type,size,status,content,category,metadata,upload_date,processed_at",
		c.SupabaseURL,
		url.QueryEscape(documentID),
		url.QueryEscape(userID),
	)
	if err := c.restJSON(http.MethodGet, query, nil, &rows); err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, fmt.Errorf("document not found")
	}
	return &rows[0], nil
}

func (c *Client) UpdateDocument(documentID string, userID string, payload map[string]interface{}) error {
	query := fmt.Sprintf("%s/rest/v1/documents?id=eq.%s&user_id=eq.%s",
		c.SupabaseURL,
		url.QueryEscape(documentID),
		url.QueryEscape(userID),
	)
	return c.restNoContent(http.MethodPatch, query, payload)
}

func (c *Client) DeleteRuleBasedAnalyses(documentID string, userID string) error {
	query := fmt.Sprintf("%s/rest/v1/analyses?document_id=eq.%s&user_id=eq.%s&ai_provider=eq.system&ai_model=eq.rule-based",
		c.SupabaseURL,
		url.QueryEscape(documentID),
		url.QueryEscape(userID),
	)
	return c.restNoContent(http.MethodDelete, query, nil)
}

func (c *Client) InsertAnalyses(analyses []AnalysisInsert) error {
	if len(analyses) == 0 {
		return nil
	}
	return c.restNoContent(http.MethodPost, c.SupabaseURL+"/rest/v1/analyses", analyses)
}

func (c *Client) GetSearchDocuments(userID string, status string, typeFilter string, categoryFilter string) ([]SearchDocument, error) {
	parts := []string{
		fmt.Sprintf("user_id=eq.%s", url.QueryEscape(userID)),
		fmt.Sprintf("status=eq.%s", url.QueryEscape(status)),
		"select=id,name,type,size,category,content,upload_date,processed_at",
		"order=created_at.desc",
		"limit=50",
	}
	if typeFilter != "" {
		parts = append(parts, fmt.Sprintf("type=ilike.*%s*", url.QueryEscape(typeFilter)))
	}
	if categoryFilter != "" {
		parts = append(parts, fmt.Sprintf("category=ilike.*%s*", url.QueryEscape(categoryFilter)))
	}
	query := c.SupabaseURL + "/rest/v1/documents?" + strings.Join(parts, "&")

	var rows []SearchDocument
	if err := c.restJSON(http.MethodGet, query, nil, &rows); err != nil {
		return nil, err
	}
	return rows, nil
}

func (c *Client) DownloadStorageObject(storagePath string) ([]byte, error) {
	if storagePath == "" {
		return nil, fmt.Errorf("storage path is empty")
	}
	encodedPath := encodeStoragePath(storagePath)
	req, err := http.NewRequest(http.MethodGet, c.SupabaseURL+"/storage/v1/object/authenticated/documents/"+encodedPath, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+c.SupabaseServiceKey)
	req.Header.Set("apikey", c.SupabaseServiceKey)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("storage download failed: %s", string(body))
	}
	return io.ReadAll(resp.Body)
}

func ExtractTextContent(fileName string, contentType string, body []byte) (string, error) {
	extension := strings.ToLower(strings.TrimPrefix(filepath.Ext(fileName), "."))

	switch extension {
	case "txt", "csv", "xml":
		return string(body), nil
	case "json":
		var pretty bytes.Buffer
		if err := json.Indent(&pretty, body, "", "  "); err != nil {
			return "", fmt.Errorf("invalid json content")
		}
		return pretty.String(), nil
	default:
		return "", fmt.Errorf("unsupported go extraction format: %s", extension)
	}
}

func DetermineCategory(fileName string) string {
	switch strings.ToLower(strings.TrimPrefix(filepath.Ext(fileName), ".")) {
	case "pdf", "doc", "docx":
		return "Document"
	case "txt":
		return "Text"
	case "jpg", "jpeg", "png":
		return "Image"
	case "json", "xml", "csv":
		return "Data"
	default:
		return "Other"
	}
}

func BuildRuleBasedAnalyses(documentID string, userID string, fileName string, content string) []AnalysisInsert {
	wordCount := len(strings.Fields(content))
	charCount := len(content)
	lineCount := len(strings.Split(content, "\n"))

	analyses := []AnalysisInsert{
		{
			DocumentID:   documentID,
			UserID:       userID,
			AnalysisType: "INSIGHT",
			Result: map[string]interface{}{
				"title":       "Document Statistics",
				"description": fmt.Sprintf("Document contains %d words, %d characters, and %d lines.", wordCount, charCount, lineCount),
				"confidence":  100,
			},
			AIProvider: "system",
			AIModel:    "rule-based",
		},
		{
			DocumentID:   documentID,
			UserID:       userID,
			AnalysisType: "INSIGHT",
			Result: map[string]interface{}{
				"title":       "Content Analysis",
				"description": describeContent(fileName, content),
				"confidence":  95,
			},
			AIProvider: "system",
			AIModel:    "rule-based",
		},
	}

	sensitivePatterns := []*regexp.Regexp{
		regexp.MustCompile(`\b\d{3}-\d{2}-\d{4}\b`),
		regexp.MustCompile(`\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b`),
		regexp.MustCompile(`\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b`),
	}

	sensitiveDetected := false
	for _, pattern := range sensitivePatterns {
		if pattern.MatchString(content) {
			sensitiveDetected = true
			break
		}
	}

	if sensitiveDetected {
		analyses = append(analyses, AnalysisInsert{
			DocumentID:   documentID,
			UserID:       userID,
			AnalysisType: "COMPLIANCE",
			Result: map[string]interface{}{
				"title":       "Sensitive Data Detected",
				"description": "Document may contain sensitive information such as email addresses, phone numbers, or other PII.",
				"confidence":  85,
				"severity":    "HIGH",
			},
			AIProvider: "system",
			AIModel:    "rule-based",
		})
	} else {
		analyses = append(analyses, AnalysisInsert{
			DocumentID:   documentID,
			UserID:       userID,
			AnalysisType: "COMPLIANCE",
			Result: map[string]interface{}{
				"title":       "No Sensitive Data Detected",
				"description": "Initial scan found no obvious sensitive data patterns.",
				"confidence":  80,
				"severity":    "LOW",
			},
			AIProvider: "system",
			AIModel:    "rule-based",
		})
	}

	if strings.Contains(content, "TODO") || strings.Contains(content, "FIXME") {
		analyses = append(analyses, AnalysisInsert{
			DocumentID:   documentID,
			UserID:       userID,
			AnalysisType: "OPPORTUNITY",
			Result: map[string]interface{}{
				"title":       "Action Items Found",
				"description": "Document contains TODO or FIXME items that may require attention.",
				"confidence":  90,
				"severity":    "MEDIUM",
			},
			AIProvider: "system",
			AIModel:    "rule-based",
		})
	}

	return analyses
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func describeContent(fileName string, content string) string {
	extension := strings.ToLower(strings.TrimPrefix(filepath.Ext(fileName), "."))
	switch extension {
	case "json":
		return "Valid JSON structure detected with proper formatting."
	case "csv":
		lines := strings.Split(content, "\n")
		headers := 0
		if len(lines) > 0 {
			headers = len(strings.Split(lines[0], ","))
		}
		return fmt.Sprintf("CSV file with %d columns and %d data rows.", headers, maxInt(len(lines)-1, 0))
	case "txt":
		return "Plain text document processed successfully."
	case "xml":
		return "XML document processed successfully."
	default:
		return strings.ToUpper(extension) + " file type processed."
	}
}

func encodeStoragePath(storagePath string) string {
	return strings.ReplaceAll(url.PathEscape(storagePath), "%2F", "/")
}

func maxInt(a int, b int) int {
	if a > b {
		return a
	}
	return b
}

func (c *Client) restJSON(method string, endpoint string, payload interface{}, out interface{}) error {
	req, err := c.newRestRequest(method, endpoint, payload)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase rest error: %s", string(body))
	}

	if out == nil {
		return nil
	}
	return json.NewDecoder(resp.Body).Decode(out)
}

func (c *Client) restNoContent(method string, endpoint string, payload interface{}) error {
	req, err := c.newRestRequest(method, endpoint, payload)
	if err != nil {
		return err
	}
	req.Header.Set("Prefer", "return=minimal")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("supabase rest error: %s", string(body))
	}
	return nil
}

func (c *Client) newRestRequest(method string, endpoint string, payload interface{}) (*http.Request, error) {
	var body io.Reader
	if payload != nil {
		encoded, err := json.Marshal(payload)
		if err != nil {
			return nil, err
		}
		body = bytes.NewReader(encoded)
	}

	req, err := http.NewRequest(method, endpoint, body)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.SupabaseServiceKey)
	req.Header.Set("apikey", c.SupabaseServiceKey)
	return req, nil
}
