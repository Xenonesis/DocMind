-- FINAL CLEANUP: Remove all test providers and clean up database
-- This will remove the test_provider you see in the screenshot
-- Run each section separately for better control and debugging

-- ============================================================================
-- SECTION 1: SHOW CURRENT STATE
-- ============================================================================

-- Show current AI provider settings before cleanup
SELECT 
    'BEFORE CLEANUP - AI PROVIDERS:' as status,
    COUNT(*) as total_count
FROM public.ai_provider_settings;

-- Show all current providers with details
SELECT 
    id,
    user_id,
    provider_name,
    CASE 
        WHEN LENGTH(api_key) > 10 THEN LEFT(api_key, 10) || '...' 
        ELSE api_key 
    END as api_key_preview,
    model_name,
    base_url,
    is_active,
    created_at
FROM public.ai_provider_settings
ORDER BY created_at DESC;

-- ============================================================================
-- SECTION 2: IDENTIFY TARGETS FOR DELETION
-- ============================================================================

-- Show what will be deleted (preview)
SELECT 
    'TARGETS FOR DELETION:' as status,
    id,
    user_id,
    provider_name,
    model_name,
    base_url,
    'WILL BE DELETED' as action
FROM public.ai_provider_settings 
WHERE 
    -- Remove test_provider (from screenshot)
    LOWER(provider_name) LIKE '%test%' OR
    provider_name IN ('test_provider', 'test-provider', 'testProvider') OR
    -- Remove CUSTOM providers
    UPPER(provider_name) LIKE '%CUSTOM%' OR
    provider_name = 'CUSTOM' OR
    -- Remove providers with test models
    LOWER(model_name) LIKE '%test%' OR
    model_name = 'test' OR
    -- Remove providers with empty/invalid API keys (except local ones)
    (TRIM(api_key) = '' AND UPPER(provider_name) NOT IN ('OLLAMA', 'LM_STUDIO', 'LOCALAI')) OR
    api_key IS NULL OR
    -- Remove demo/placeholder providers
    LOWER(provider_name) LIKE '%demo%' OR
    LOWER(provider_name) LIKE '%sample%' OR
    LOWER(provider_name) LIKE '%placeholder%' OR
    LOWER(provider_name) LIKE '%example%'
ORDER BY provider_name;

-- Count how many will be deleted
SELECT 
    'DELETION COUNT:' as status,
    COUNT(*) as records_to_delete
FROM public.ai_provider_settings 
WHERE 
    LOWER(provider_name) LIKE '%test%' OR
    provider_name IN ('test_provider', 'test-provider', 'testProvider') OR
    UPPER(provider_name) LIKE '%CUSTOM%' OR
    provider_name = 'CUSTOM' OR
    LOWER(model_name) LIKE '%test%' OR
    model_name = 'test' OR
    (TRIM(api_key) = '' AND UPPER(provider_name) NOT IN ('OLLAMA', 'LM_STUDIO', 'LOCALAI')) OR
    api_key IS NULL OR
    LOWER(provider_name) LIKE '%demo%' OR
    LOWER(provider_name) LIKE '%sample%' OR
    LOWER(provider_name) LIKE '%placeholder%' OR
    LOWER(provider_name) LIKE '%example%';

-- ============================================================================
-- SECTION 3: PERFORM DELETION (Uncomment to execute)
-- ============================================================================

-- BEGIN TRANSACTION for safety
BEGIN;

-- Store deletion count for reporting
WITH deleted_records AS (
    DELETE FROM public.ai_provider_settings 
    WHERE 
        -- Remove test_provider (from screenshot)
        LOWER(provider_name) LIKE '%test%' OR
        provider_name IN ('test_provider', 'test-provider', 'testProvider') OR
        -- Remove CUSTOM providers
        UPPER(provider_name) LIKE '%CUSTOM%' OR
        provider_name = 'CUSTOM' OR
        -- Remove providers with test models
        LOWER(model_name) LIKE '%test%' OR
        model_name = 'test' OR
        -- Remove providers with empty/invalid API keys (except local ones)
        (TRIM(api_key) = '' AND UPPER(provider_name) NOT IN ('OLLAMA', 'LM_STUDIO', 'LOCALAI')) OR
        api_key IS NULL OR
        -- Remove demo/placeholder providers
        LOWER(provider_name) LIKE '%demo%' OR
        LOWER(provider_name) LIKE '%sample%' OR
        LOWER(provider_name) LIKE '%placeholder%' OR
        LOWER(provider_name) LIKE '%example%'
    RETURNING *
)
SELECT 
    'DELETION EXECUTED:' as status,
    COUNT(*) as deleted_count
FROM deleted_records;

-- COMMIT the transaction
COMMIT;

-- ============================================================================
-- SECTION 4: VERIFY RESULTS
-- ============================================================================

-- Show what remains after cleanup
SELECT 
    'AFTER CLEANUP - REMAINING PROVIDERS:' as status,
    COUNT(*) as remaining_count
FROM public.ai_provider_settings;

-- Show remaining providers
SELECT 
    id,
    user_id,
    provider_name,
    model_name,
    base_url,
    is_active,
    created_at
FROM public.ai_provider_settings
ORDER BY created_at DESC;

-- Verify no test providers remain
SELECT 
    'VERIFICATION - TEST PROVIDERS REMAINING:' as check_status,
    COUNT(*) as test_count
FROM public.ai_provider_settings 
WHERE 
    LOWER(provider_name) LIKE '%test%' OR
    UPPER(provider_name) LIKE '%CUSTOM%' OR
    LOWER(model_name) LIKE '%test%';

-- Show final summary
SELECT 
    'CLEANUP COMPLETE' as final_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM public.ai_provider_settings 
            WHERE LOWER(provider_name) LIKE '%test%' 
               OR UPPER(provider_name) LIKE '%CUSTOM%' 
               OR LOWER(model_name) LIKE '%test%'
        ) 
        THEN 'WARNING: Some test providers may still remain - check manually'
        ELSE 'SUCCESS: All test providers have been removed from the database'
    END as message;