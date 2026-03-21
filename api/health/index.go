package handler

import (
	"encoding/json"
	"net/http"
	"os"
	"time"
)

func Handler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "ok",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"runtime":   "go",
		"environment": map[string]bool{
			"supabaseUrlConfigured": os.Getenv("NEXT_PUBLIC_SUPABASE_URL") != "" || os.Getenv("SUPABASE_URL") != "",
			"supabaseAnonConfigured": os.Getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") != "" || os.Getenv("SUPABASE_ANON_KEY") != "",
			"supabaseServiceConfigured": os.Getenv("SUPABASE_SERVICE_ROLE_KEY") != "",
		},
		"capabilities": []string{
			"process-document",
			"analyze-document",
			"search-basic",
			"health",
		},
	})
}

func writeJSON(w http.ResponseWriter, status int, payload map[string]interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
