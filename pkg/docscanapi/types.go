package docscanapi

type AuthUser struct {
	ID    string `json:"id"`
	Email string `json:"email"`
	UserMetadata struct {
		Name string `json:"name"`
	} `json:"user_metadata"`
}

type Document struct {
	ID          string      `json:"id"`
	UserID      string      `json:"user_id"`
	Name        string      `json:"name"`
	Type        string      `json:"type"`
	Size        string      `json:"size"`
	Status      string      `json:"status"`
	Content     string      `json:"content"`
	Category    string      `json:"category"`
	Metadata    interface{} `json:"metadata"`
	UploadDate  string      `json:"upload_date"`
	ProcessedAt string      `json:"processed_at"`
}

type AnalysisInsert struct {
	DocumentID   string                 `json:"document_id"`
	UserID       string                 `json:"user_id"`
	AnalysisType string                 `json:"analysis_type"`
	Result       map[string]interface{} `json:"result"`
	AIProvider   string                 `json:"ai_provider"`
	AIModel      string                 `json:"ai_model"`
}

type SearchDocument struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Type        string `json:"type"`
	Size        string `json:"size"`
	Category    string `json:"category"`
	Content     string `json:"content"`
	UploadDate  string `json:"upload_date"`
	ProcessedAt string `json:"processed_at"`
}
