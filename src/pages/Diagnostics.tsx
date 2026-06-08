import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUnifiedStorage } from '../hooks/useUnifiedStorage';
import { isSupabaseConfigured } from '../lib/supabase';
import type { CreatorRecord } from '../types/ces';

export default function Diagnostics() {
  const unified = useUnifiedStorage();
  const [supabaseConfigured, setSupabaseConfigured] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null);
  const [pending, setPending] = useState<CreatorRecord[]>([]);
  const [approved, setApproved] = useState<CreatorRecord[]>([]);
  const [localStorageCount, setLocalStorageCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    const configured = isSupabaseConfigured();
    setSupabaseConfigured(configured);
    if (configured) {
      testSupabaseConnection();
    }
    loadProfiles();
    countLocalStorage();
  }, []);

  const testSupabaseConnection = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Testing Supabase connection...');
    console.log('URL:', url);
    console.log('Anon Key (first 20 chars):', anonKey?.slice(0, 20) + '...');
    console.log('Anon Key exists:', !!anonKey);
    console.log('Anon Key length:', anonKey?.length);
    
    try {
      // Test 1: Direct fetch to Supabase REST API
      const response = await fetch(`${url}/rest/v1/profiles?limit=1`, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setSupabaseConnected(false);
        setTestResult(`HTTP ${response.status}: ${response.statusText}. ${errorText.slice(0, 200)}`);
        return;
      }
      
      // Test 2: Try to read data
      const data = await response.json();
      console.log('Success! Data:', data);
      setSupabaseConnected(true);
      setTestResult(`✓ Supabase is reachable. Found ${Array.isArray(data) ? data.length : 0} profiles.`);
    } catch (err: any) {
      console.error('Fetch error:', err);
      setSupabaseConnected(false);
      setTestResult(`Connection error: ${err.message || 'Unknown error'}. Check browser console for details.`);
    }
  };

  const countLocalStorage = () => {
    try {
      const pending = JSON.parse(localStorage.getItem('hlc_pending') || '[]');
      const approved = JSON.parse(localStorage.getItem('hlc_approved') || '[]');
      const returned = JSON.parse(localStorage.getItem('hlc_returned') || '[]');
      setLocalStorageCount(pending.length + approved.length + returned.length);
    } catch {
      setLocalStorageCount(0);
    }
  };

  const loadProfiles = async () => {
    setLoading(true);
    try {
      const [pendingProfiles, approvedProfiles] = await Promise.all([
        unified.getPending(),
        unified.getApproved(),
      ]);
      setPending(pendingProfiles);
      setApproved(approvedProfiles);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 pb-16 max-w-4xl mx-auto">
      <h1 className="font-serif text-3xl text-gold-shimmer mb-8 text-center">
        System Diagnostics ✦
      </h1>

      {/* Supabase Configuration */}
      <div className={`rounded-xl border p-4 mb-6 ${
        supabaseConfigured 
          ? 'border-green-400/20 bg-green-400/5' 
          : 'border-orange-400/20 bg-orange-400/5'
      }`}>
        <h2 className="font-serif text-xl text-cream mb-2">
          {supabaseConfigured ? '✓ Supabase Configured' : '⚠ Supabase Not Configured'}
        </h2>
        <p className="text-sm text-lavender/70 mb-3">
          {supabaseConfigured 
            ? 'Environment variables are present. Testing connection...' 
            : 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing from Vercel environment variables.'}
        </p>
        {supabaseConfigured && (
          <div className="mt-3 p-3 rounded-lg bg-void-900/60 border border-lavender/10">
            <p className="text-xs text-lavender/50 mb-1">Supabase URL:</p>
            <code className="text-xs text-cream">
              {import.meta.env.VITE_SUPABASE_URL?.slice(0, 30)}...
            </code>
          </div>
        )}
        {supabaseConfigured && supabaseConnected === false && (
          <p className="text-sm text-magenta-300 mt-3">
            ⚠️ {testResult}
          </p>
        )}
        {supabaseConfigured && supabaseConnected === true && (
          <p className="text-sm text-green-300 mt-3">
            ✓ {testResult}
          </p>
        )}
      </div>

      {/* localStorage Profiles */}
      <div className="rounded-xl border border-lavender/10 bg-void-900/40 p-4 mb-6">
        <h2 className="font-serif text-lg text-cream mb-2">
          Browser localStorage Profiles: {localStorageCount}
        </h2>
        <p className="text-xs text-lavender/50">
          These profiles exist only in this browser. They won't sync across devices unless Supabase is working.
        </p>
      </div>

      {/* Pending Profiles */}
      <div className="rounded-xl border border-lavender/10 bg-void-900/40 p-6 mb-6">
        <h2 className="font-serif text-xl text-cream mb-4">
          Pending Profiles from Supabase ({pending.length})
        </h2>
        {loading ? (
          <p className="text-lavender/50">Loading...</p>
        ) : pending.length === 0 ? (
          <p className="text-lavender/50">No pending profiles in Supabase.</p>
        ) : (
          <div className="space-y-3">
            {pending.map((profile) => (
              <div key={profile.id} className="p-3 rounded-lg border border-lavender/10 bg-void-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cream font-medium">{profile.name}</p>
                    <p className="text-xs text-lavender/50 font-mono">C.E.S. {profile.cesNumber}</p>
                    <p className="text-xs text-lavender/60 mt-1">{profile.location || 'No location'}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gold-400/10 text-gold-300 border border-gold-400/20">
                    {profile.guideGuardianStatus === 'opted_in' ? '🛡️ Guide & Guardian' : 'Not opted in'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Approved Profiles */}
      <div className="rounded-xl border border-lavender/10 bg-void-900/40 p-6 mb-6">
        <h2 className="font-serif text-xl text-cream mb-4">
          Approved Profiles from Supabase ({approved.length})
        </h2>
        {loading ? (
          <p className="text-lavender/50">Loading...</p>
        ) : approved.length === 0 ? (
          <p className="text-lavender/50">No approved profiles in Supabase.</p>
        ) : (
          <div className="space-y-3">
            {approved.map((profile) => (
              <div key={profile.id} className="p-3 rounded-lg border border-lavender/10 bg-void-800/40">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cream font-medium">{profile.name}</p>
                    <p className="text-xs text-lavender/50 font-mono">C.E.S. {profile.cesNumber}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-400/10 text-green-300 border border-green-400/20">
                    Live in Directory
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Critical Actions */}
      <div className="space-y-3">
        <Link
          to="/steward"
          className="block text-center px-4 py-3 rounded-full border border-gold-400/30 bg-gold-400/10 text-gold-300 hover:bg-gold-400/20 transition-all"
        >
          🛡️ Go to Admin Panel
        </Link>
        
        {!supabaseConfigured && (
          <div className="p-4 rounded-xl border border-magenta-400/20 bg-magenta-400/5">
            <h3 className="font-serif text-lg text-magenta-300 mb-2">
              ⚠️ Critical: Supabase Not Configured
            </h3>
            <p className="text-sm text-lavender/70 mb-3">
              To enable cross-device sync, you MUST add these environment variables to Vercel:
            </p>
            <code className="block text-xs text-cream bg-void-900 p-3 rounded-lg mb-3">
              VITE_SUPABASE_URL=https://rvxogihtwztdzxbwktzr.supabase.co<br/>
              VITE_SUPABASE_ANON_KEY=sb_publishable_...
            </code>
            <p className="text-xs text-lavender/50 mb-3">
              Then redeploy the Vercel project.
            </p>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 rounded-full border border-magenta-400/30 text-magenta-300 hover:bg-magenta-400/10 transition-all text-sm"
            >
              Open Vercel Dashboard
            </a>
          </div>
        )}

        <Link
          to="/"
          className="block text-center px-4 py-3 rounded-full border border-lavender/20 text-lavender/70 hover:bg-lavender/5 transition-all"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
