-- ============================================
-- ADMIN RLS POLICIES FIX
-- Giornale Scolastico Cesaris
-- ============================================
-- 
-- This script adds missing RLS policies that allow admins
-- (caporedattore/docente) to manage user profiles.
--
-- Run this in Supabase SQL Editor AFTER the main schema.
--
-- ============================================

-- ============================================
-- DROP EXISTING RESTRICTIVE POLICIES (if they exist)
-- ============================================
DROP POLICY IF EXISTS "Users can update own profile" ON profili_utenti;
DROP POLICY IF EXISTS "Users can delete own profile" ON profili_utenti;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profili_utenti;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profili_utenti;

-- ============================================
-- RECREATE USER SELF-UPDATE POLICY
-- ============================================
CREATE POLICY "Users can update own profile" ON profili_utenti
    FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- ADD ADMIN POLICIES FOR PROFILE MANAGEMENT
-- ============================================

-- Policy: Admins (caporedattore/docente) can UPDATE any profile
CREATE POLICY "Admins can update all profiles" ON profili_utenti
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profili_utenti 
            WHERE id = auth.uid() 
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- Policy: Admins can DELETE profiles (except their own to prevent accidents)
CREATE POLICY "Admins can delete profiles" ON profili_utenti
    FOR DELETE USING (
        id != auth.uid() AND
        EXISTS (
            SELECT 1 FROM profili_utenti 
            WHERE id = auth.uid() 
            AND ruolo IN ('caporedattore', 'docente')
        )
    );

-- ============================================
-- VERIFY POLICIES
-- ============================================
SELECT 
    policyname, 
    cmd, 
    qual::text 
FROM pg_policies 
WHERE tablename = 'profili_utenti';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================
SELECT 'Admin RLS policies added successfully! Admins can now update/delete user profiles.' as status;
