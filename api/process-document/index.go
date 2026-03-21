package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"docscan/internal/docscanapi"
)

type processDocumentRequest struct {
	DocumentID string `json:"documentId"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]interface{}{"error": "Method not allowed"})
		return
	}

	client, err := docscanapi.NewClient()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		return
	}

	user, err := client.VerifyUser(r.Header.Get("Authorization"))
	if err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]interface{}{"error": "Authentication required"})
		return
	}

	var payload processDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.DocumentID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "documentId is required"})
		return
	}

	document, err := client.GetDocument(payload.DocumentID, user.ID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{"error": "Document not found"})
		return
	}

	if document.Status == "COMPLETED" && document.Content != "" {
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"id":          document.ID,
			"status":      document.Status,
			"category":    document.Category,
			"processedAt": document.ProcessedAt,
			"processor":   "go",
			"skipped":     true,
		})
		return
	}

	metadata, err := metadataMap(document.Metadata)
	if err != nil {
		updateDocumentErrorStatus(client, document.ID, user.ID)
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Invalid document metadata"})
		return
	}

	storageRef, _ := metadata["storageRef"].(string)
	if storageRef == "" {
		updateDocumentErrorStatus(client, document.ID, user.ID)
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Document storage reference is missing"})
		return
	}

	contentBytes, err := client.DownloadStorageObject(storageRef)
	if err != nil {
		updateDocumentErrorStatus(client, document.ID, user.ID)
		writeJSON(w, http.StatusBadGateway, map[string]interface{}{"error": err.Error()})
		return
	}

	content, err := docscanapi.ExtractTextContent(document.Name, document.Type, contentBytes)
	if err != nil {
		updateDocumentErrorStatus(client, document.ID, user.ID)
		writeJSON(w, http.StatusUnprocessableEntity, map[string]interface{}{
			"error":   err.Error(),
			"details": "Use the Node fallback processor for unsupported formats.",
		})
		return
	}

	now := time.Now().UTC().Format(time.RFC3339)
	if err := client.UpdateDocument(document.ID, user.ID, map[string]interface{}{
		"status":       "COMPLETED",
		"processed_at": now,
		"content":      content,
		"category":     docscanapi.DetermineCategory(document.Name),
	}); err != nil {
		updateDocumentErrorStatus(client, document.ID, user.ID)
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		return
	}

	_ = client.DeleteRuleBasedAnalyses(document.ID, user.ID)
	if err := client.InsertAnalyses(docscanapi.BuildRuleBasedAnalyses(document.ID, user.ID, document.Name, content)); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"id":          document.ID,
		"status":      "COMPLETED",
		"category":    docscanapi.DetermineCategory(document.Name),
		"processedAt": now,
		"processor":   "go",
	})
}

func metadataMap(raw interface{}) (map[string]interface{}, error) {
	switch typed := raw.(type) {
	case map[string]interface{}:
		return typed, nil
	case string:
		if typed == "" {
			return map[string]interface{}{}, nil
		}
		var parsed map[string]interface{}
		err := json.Unmarshal([]byte(typed), &parsed)
		return parsed, err
	default:
		return map[string]interface{}{}, nil
	}
}

func updateDocumentErrorStatus(client *docscanapi.Client, documentID string, userID string) {
	_ = client.UpdateDocument(documentID, userID, map[string]interface{}{"status": "ERROR"})
}

func writeJSON(w http.ResponseWriter, status int, payload map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
