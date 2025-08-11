-- FINAL CLEANUP: Remove all test providers and clean up database
-- This will remove the test_provider you see in the screenshot

-- Show current AI provider settings before cleanup
SELECT 
    'BEFORE CLEANUP - AI PROVIDERS:' as status,
    COUNT(*) as total_count
FROM ai_provider_settings;

SELECT 
    id,
    user_id,
    provider_name,
    api_key,
    model_name,
    is_active,
    created_at
FROM ai_provider_settings
ORDER BY created_at DESC;

-- Remove ALL test-related AI provider settings
DELETE FROM ai_provider_settings 
WHERE 
    -- Remove test_provider (from screenshot)
    provider_name ILIKE '%test%' OR
    provider_name = 'test_provider' OR
    provider_name = 'test-provider' OR
    provider_name = 'testProvider' OR
    -- Remove CUSTOM providers
    provider_name ILIKE '%CUSTOM%' OR
    provider_name = 'CUSTOM' OR
    -- Remove providers with test models
    model_name ILIKE '%test%' OR
    model_name = 'test' OR
    -- Remove providers with empty/invalid API keys (except local ones)
    (api_key = '' AND provider_name NOT IN ('OLLAMA', 'LM_STUDIO')) OR
    api_key IS NULL OR
    -- Remove demo/placeholder providers
    provider_name ILIKE '%demo%' OR
    provider_name ILIKE '%sample%' OR
    provider_name ILIKE '%placeholder%';

-- Show what remains after cleanup
SELECT 
    'AFTER CLEANUP - REMAINING PROVIDERS:' as status,
    COUNT(*) as remaining_count
FROM ai_provider_settings;

SELECT 
    id,
    provider_name,
    model_name,
    is_active,
    created_at
FROM ai_provider_settings
ORDER BY created_at DESC;

-- Verify no test providers remain
SELECT 
    'VERIFICATION - TEST PROVIDERS REMAINING:' as check_status,
    COUNT(*) as test_count
FROM ai_provider_settings 
WHERE 
    provider_name ILIKE '%test%' OR
    provider_name ILIKE '%CUSTOM%' OR
    model_name ILIKE '%test%';