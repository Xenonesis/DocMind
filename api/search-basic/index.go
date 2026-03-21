package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"

	"docscan/pkg/docscanapi"
)

type searchRequest struct {
	Query   string `json:"query"`
	Limit   int    `json:"limit"`
	Filters struct {
		Type     string `json:"type"`
		Category string `json:"category"`
	} `json:"filters"`
}

type searchResult struct {
	DocumentID     string                 `json:"documentId"`
	RelevanceScore float64                `json:"relevanceScore"`
	Reason         string                 `json:"reason"`
	KeyMatches     []string               `json:"keyMatches"`
	Category       string                 `json:"category"`
	Document       map[string]interface{} `json:"document"`
}

func Handler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
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

	payload := searchRequest{Limit: 10}
	if r.Method == http.MethodGet {
		payload.Query = r.URL.Query().Get("q")
		payload.Filters.Type = r.URL.Query().Get("type")
		payload.Filters.Category = r.URL.Query().Get("category")
	} else {
		if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Invalid request payload"})
			return
		}
	}

	if payload.Query == "" {
		writeJSON(w, http.StatusBadRequest, map[string]interface{}{"error": "Search query is required"})
		return
	}
	if payload.Limit <= 0 {
		payload.Limit = 10
	}

	documents, err := client.GetSearchDocuments(user.ID, "COMPLETED", payload.Filters.Type, payload.Filters.Category)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]interface{}{"error": err.Error()})
		return
	}

	terms := strings.Fields(strings.ToLower(payload.Query))
	results := make([]searchResult, 0, len(documents))
	for _, document := range documents {
		score := 0.0
		keyMatches := make([]string, 0)

		nameLower := strings.ToLower(document.Name)
		contentLower := strings.ToLower(document.Content)
		categoryLower := strings.ToLower(document.Category)

		for _, term := range terms {
			if len(term) <= 2 {
				continue
			}
			if strings.Contains(nameLower, term) {
				score += 0.3
				keyMatches = append(keyMatches, term)
			}
			if strings.Contains(contentLower, term) {
				score += 0.5
				keyMatches = append(keyMatches, term)
			}
			if strings.Contains(categoryLower, term) {
				score += 0.4
				keyMatches = append(keyMatches, term)
			}
		}

		queryLower := strings.ToLower(payload.Query)
		if strings.Contains(nameLower, queryLower) || strings.Contains(contentLower, queryLower) {
			score += 0.7
			keyMatches = append(keyMatches, payload.Query)
		}

		if score <= 0 {
			continue
		}

		if score > 1 {
			score = 1
		}

		results = append(results, searchResult{
			DocumentID:     document.ID,
			RelevanceScore: score,
			Reason:         fmt.Sprintf("Keyword match found in %s", strings.Join(uniqueStrings(keyMatches), ", ")),
			KeyMatches:     uniqueStrings(keyMatches),
			Category:       valueOrFallback(document.Category, "Unknown"),
			Document: map[string]interface{}{
				"id":          document.ID,
				"name":        document.Name,
				"type":        document.Type,
				"size":        document.Size,
				"category":    document.Category,
				"uploadDate":  document.UploadDate,
				"processedAt": document.ProcessedAt,
			},
		})
	}

	sort.Slice(results, func(i int, j int) bool {
		return results[i].RelevanceScore > results[j].RelevanceScore
	})
	if len(results) > payload.Limit {
		results = results[:payload.Limit]
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"results":    results,
		"query":      payload.Query,
		"total":      len(results),
		"summary":    fmt.Sprintf("Found %d documents matching your search terms", len(results)),
		"searchType": "keyword-go",
	})
}

func uniqueStrings(items []string) []string {
	seen := map[string]bool{}
	result := make([]string, 0, len(items))
	for _, item := range items {
		if item == "" || seen[item] {
			continue
		}
		seen[item] = true
		result = append(result, item)
	}
	return result
}

func valueOrFallback(value string, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func writeJSON(w http.ResponseWriter, status int, payload map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
