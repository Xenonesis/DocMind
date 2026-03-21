package handler

import (
	"encoding/json"
	"net/http"

	"docscan/pkg/docscanapi"
)

type analyzeDocumentRequest struct {
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

	var payload analyzeDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil || payload.DocumentID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "documentId is required"})
		return
	}

	document, err := client.GetDocument(payload.DocumentID, user.ID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]interface{}{"error": "Document not found"})
		return
	}

	if document.Content == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Document content is empty. Process the document first."})
		return
	}

	_ = client.DeleteRuleBasedAnalyses(document.ID, user.ID)
	if err := client.InsertAnalyses(docscanapi.BuildRuleBasedAnalyses(document.ID, user.ID, document.Name, document.Content)); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"id":        document.ID,
		"status":    "COMPLETED",
		"processor": "go",
		"message":   "Rule-based analyses regenerated successfully.",
	})
}

func writeJSON(w http.ResponseWriter, status int, payload map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
