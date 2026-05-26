/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  X, MessageSquare, Plus, ArrowRight, User as UserIcon, LogOut, CheckCircle, 
  AlertCircle, Sparkles, Send, ShieldAlert, Loader 
} from 'lucide-react';
import { User } from 'firebase/auth';
import { googleSignIn, initAuth, logout } from '../utils/firebaseAuth';

interface ChatIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatSpace {
  name: string; // e.g., "spaces/spacesId"
  displayName?: string;
  type?: string;
}

export default function ChatIntegrationModal({ isOpen, onClose }: ChatIntegrationModalProps) {
  // Auth state flags
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(true);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

  // Google Chat loaded states
  const [spaces, setSpaces] = useState<ChatSpace[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');
  const [customSpaceId, setCustomSpaceId] = useState<string>('');
  const [useCustomSpace, setUseCustomSpace] = useState<boolean>(false);

  const [isFetchingSpaces, setIsFetchingSpaces] = useState<boolean>(false);
  const [isPostingMessage, setIsPostingMessage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Feature request form inputs
  const [featureTitle, setFeatureTitle] = useState<string>('');
  const [featureCategory, setFeatureCategory] = useState<string>('Timeline');
  const [featureDescription, setFeatureDescription] = useState<string>('');
  const [featurePriority, setFeaturePriority] = useState<string>('High');

  // Confirmation dialog state
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // Initialize auth listener
  useEffect(() => {
    if (isOpen) {
      const unsubscribe = initAuth(
        (authedUser, retrievedToken) => {
          setUser(authedUser);
          setToken(retrievedToken);
          setNeedsAuth(false);
          loadChatSpaces(retrievedToken);
        },
        () => {
          setNeedsAuth(true);
        }
      );
      return () => unsubscribe();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Active Sign-in execution
  const handleLogin = async () => {
    setIsLoggingIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        loadChatSpaces(result.accessToken);
      }
    } catch (err: any) {
      console.error('Authentication Fail:', err);
      setErrorMessage(err?.message || 'Login cancelled or Google Workspace authentication failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Sign out
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setSpaces([]);
      setSelectedSpace('');
      setSuccessMessage(null);
    } catch (err: any) {
      setErrorMessage('Sign out failed');
    }
  };

  // Load Google Chat spaces
  const loadChatSpaces = async (accessToken: string) => {
    setIsFetchingSpaces(true);
    setErrorMessage(null);
    try {
      const response = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load Google Chat spaces (HTTP ${response.status})`);
      }

      const data = await response.json();
      const loadedSpaces: ChatSpace[] = data.spaces || [];
      setSpaces(loadedSpaces);
      
      if (loadedSpaces.length > 0) {
        setSelectedSpace(loadedSpaces[0].name);
      } else {
        setUseCustomSpace(true); // default to input if no spaces exist yet
      }
    } catch (err: any) {
      console.error('Spaces fetch error:', err);
      // Suppress hard crashing, allow entering space ID manually
      setUseCustomSpace(true);
    } finally {
      setIsFetchingSpaces(false);
    }
  };

  // Submit Feedback to Google Chat
  const handlePostFeedback = async () => {
    const targetSpace = useCustomSpace ? customSpaceId.trim() : selectedSpace;
    if (!targetSpace) {
      setErrorMessage('Please select or specify a valid Google Chat space.');
      return;
    }

    if (!featureTitle.trim() || !featureDescription.trim()) {
      setErrorMessage('Please fill in the Feature Title and Description fields.');
      return;
    }

    setIsPostingMessage(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowConfirm(false);

    try {
      // Build aesthetic, polished markdown payload
      const markdownText = `
*⚡ NEW FEATURE SPECIFICATION REQUESTED BY STUDIO CLIENT*
---
*📌 Title:* ${featureTitle.trim()}
*📂 Category:* ${featureCategory}
*⭐ Priority/Impact:* ${featurePriority}
*👤 Requestor:* ${user?.displayName || 'Anonymous Producer'} (${user?.email || 'N/A'})

*📋 Functional Description:*
${featureDescription.trim()}

---
_Sent securely via CapClip Studio Google Chat Integration Integration Hub._
      `.trim();

      const response = await fetch(`https://chat.googleapis.com/v1/${targetSpace}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: markdownText
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Failed to deliver Chat message (HTTP ${response.status})`);
      }

      setSuccessMessage('Feature proposal dispatched successfully into your Google Chat space!');
      // Reset form fields
      setFeatureTitle('');
      setFeatureDescription('');
    } catch (err: any) {
      console.error('Feature deliver err:', err);
      setErrorMessage(err?.message || 'Failed to dispatch webhook message. Verify space membership permission.');
    } finally {
      setIsPostingMessage(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#111111] border border-white/10 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header Branding */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0f0f0f]">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-400 stroke-[2]" />
            <h3 className="font-semibold text-xs text-gray-200 uppercase tracking-widest font-display">
              Google Chat Backlog Sync
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1 rounded-xl hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Modal View content */}
        <div className="p-6 overflow-y-auto max-h-[80vh] space-y-5">
          {needsAuth ? (
            /* Needs authentication view */
            <div className="flex flex-col items-center text-center p-6 space-y-5">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-2 max-w-sm">
                <h4 className="text-gray-200 text-sm font-bold uppercase tracking-wider font-display">
                  Connect Workspace Account
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Collaboratively brainstorm new studio capabilities! Authenticate with Google to route your requested features securely into your active Google Chat conversation spaces.
                </p>
              </div>

              {/* GSI Material Button standard */}
              <button 
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button w-full max-w-xs cursor-pointer select-none py-1.5 duration-150 rounded-xl hover:scale-[1.02] active:scale-98"
                style={{
                  background: 'white',
                  color: '#1f2937',
                  border: '1px solid #e5e7eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                {isLoggingIn ? (
                  <div className="flex items-center gap-2.5">
                    <Loader className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="text-gray-700">Connecting Google APIs...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                    <span className="font-semibold text-zinc-950">Authenticate Google Workspace</span>
                  </div>
                )}
              </button>

              <div className="bg-zinc-900 border border-white/5 p-3 rounded-lg flex items-start gap-2.5 max-w-sm text-left">
                <ShieldAlert className="w-4.5 h-4.5 text-yellow-500 shrink-0 mt-0.5" />
                <span className="text-[10px] text-zinc-500 leading-normal">
                  Requires <code className="text-zinc-400 font-mono">chat</code> scopes. This allows you to log suggestions with your authorized workspace identity securely. Credentials cached solely in-memory.
                </span>
              </div>
            </div>
          ) : (
            /* Authenticated view: space selector and feedback submission form */
            <div className="space-y-4">
              
              {/* Profile Card Header with Signout */}
              <div className="flex items-center justify-between bg-[#0a0a0a] border border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <div className="bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-full w-8 h-8 flex items-center justify-center text-white text-xs font-bold font-mono">
                    {user?.displayName ? user.displayName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-200 block leading-tight">{user?.displayName || 'Studio Manager'}</span>
                    <span className="text-[10px] text-gray-500 block">{user?.email || 'N/A'}</span>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 hover:border-rose-500/25 hover:bg-rose-500/10 text-rose-400 text-[10px] font-bold uppercase transition"
                  title="Disconnect account session"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              </div>

              {/* Space Selection Configuration */}
              <div className="bg-zinc-900/60 p-4 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                    🛰️ GOOGLE CHAT CHANNEL ROUTE
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUseCustomSpace(false)}
                      className={`px-2 py-0.5 text-[9px] rounded font-semibold transition ${
                        !useCustomSpace ? 'bg-indigo-600 text-white' : 'text-zinc-500 bg-black/40'
                      }`}
                    >
                      Autoloaded Spaces
                    </button>
                    <button
                      onClick={() => setUseCustomSpace(true)}
                      className={`px-2 py-0.5 text-[9px] rounded font-semibold transition ${
                        useCustomSpace ? 'bg-indigo-600 text-white' : 'text-zinc-500 bg-black/40'
                      }`}
                    >
                      Manual Space ID
                    </button>
                  </div>
                </div>

                {useCustomSpace ? (
                  <div className="space-y-1.5">
                    <label className="block text-[10px] text-zinc-550 font-bold uppercase tracking-wide">Enter Space Path ID</label>
                    <input 
                      type="text" 
                      value={customSpaceId}
                      onChange={(e) => setCustomSpaceId(e.target.value)}
                      placeholder="e.g. spaces/AAAAx-xxxx"
                      className="w-full bg-black text-xs text-white border border-zinc-800 focus:ring-1 focus:ring-indigo-500 outline-none px-3 py-2 rounded-lg font-mono"
                    />
                    <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                      Paste the resource path ID from Google Chat URL space properties. E.g. <code className="text-zinc-400">spaces/AAAA883nn2_f</code>
                    </p>
                  </div>
                ) : (
                  <div>
                    {isFetchingSpaces ? (
                      <div className="flex items-center gap-2 text-xs text-zinc-500 py-2">
                        <Loader className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                        <span>Querying Google Chat spaces listing...</span>
                      </div>
                    ) : spaces.length === 0 ? (
                      <div className="p-3 bg-black/40 border border-yellow-500/10 rounded-lg text-left space-y-1.5">
                        <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wide block">No Shared Spaces Detected</span>
                        <p className="text-[10px] text-zinc-400 leading-normal">
                          We didn't detect any shared group spaces for this account profile. Toggle <strong>Manual Space ID</strong> to specify your workspace chat thread directly!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-[10px] text-zinc-550 font-bold uppercase tracking-wide">Select Destination Space</label>
                        <select 
                          value={selectedSpace}
                          onChange={(e) => setSelectedSpace(e.target.value)}
                          className="w-full bg-black text-xs text-zinc-200 border border-zinc-800 px-3 py-2 rounded-lg focus:ring-1 focus:ring-indigo-500"
                        >
                          {spaces.map((s) => (
                            <option key={s.name} value={s.name}>
                              {s.displayName || s.name} ({s.type || 'GROUP'})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Main Feature Suggestion Form */}
              <div className="bg-zinc-900/40 p-4 border border-zinc-800/80 rounded-xl space-y-3.5">
                <span className="block text-[10px] text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 pb-2">
                  ✍️ FEATURE SPECIFICATION DETAILS
                </span>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">Requested Feature Name / Slug</label>
                    <input
                      type="text"
                      value={featureTitle}
                      onChange={(e) => setFeatureTitle(e.target.value)}
                      placeholder="e.g. Dynamic particle overlays on cuts"
                      className="w-full bg-zinc-950 text-zinc-200 px-3 py-2 rounded-lg border border-zinc-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Functional Category</label>
                      <select
                        value={featureCategory}
                        onChange={(e) => setFeatureCategory(e.target.value)}
                        className="w-full bg-zinc-950 text-zinc-300 border border-zinc-800 px-2 py-1.8 rounded-lg text-xs"
                      >
                        {['Timeline', 'Audio Synth', 'FX Chromatic', 'Gemini AI', 'capclip presets', 'General UI'].map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 mb-1.5 uppercase tracking-wider">Production Impact / Priority</label>
                      <select
                        value={featurePriority}
                        onChange={(e) => setFeaturePriority(e.target.value)}
                        className="w-full bg-zinc-950 text-zinc-300 border border-zinc-800 px-2 py-1.8 rounded-lg text-xs"
                      >
                        {['Low Comfort', 'Medium Expansion', 'High Value', 'Game-changing Spark!'].map((pri) => (
                          <option key={pri} value={pri}>{pri}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Aesthetic Description & Use-Cases</label>
                      <span className="text-[9px] text-zinc-650 font-mono">Markdown supported</span>
                    </div>
                    <textarea
                      rows={3}
                      value={featureDescription}
                      onChange={(e) => setFeatureDescription(e.target.value)}
                      placeholder="Provide steps on what the user does, expected preview behavior, color profiles, etc."
                      className="w-full bg-zinc-950 text-zinc-300 px-3 py-2.5 rounded-lg border border-zinc-800 text-xs focus:ring-1 focus:ring-indigo-500 outline-none min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Status or Success Dialog panels */}
              {errorMessage && (
                <div className="flex items-start gap-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-[11px] leading-relaxed">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              {successMessage && (
                <div className="flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-[11px] leading-relaxed">
                  <CheckCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-400" />
                  <p>{successMessage}</p>
                </div>
              )}

              {/* Submission Action Blocks */}
              <div className="pt-2">
                {showConfirm ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl space-y-3">
                    <span className="block text-[10px] text-yellow-400 font-bold uppercase tracking-wider">
                      ⚠️ EXPLICIT DATA DISPATCH CONFIRMATION
                    </span>
                    <p className="text-[11px] text-zinc-300 leading-normal">
                      With your explicit permission, CapClip Studio will post this structured specification document on your behalf to the Google Chat Space: <strong>{useCustomSpace ? customSpaceId : (spaces.find(s => s.name === selectedSpace)?.displayName || selectedSpace)}</strong>. Click confirm to dispatch.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePostFeedback}
                        disabled={isPostingMessage}
                        className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
                      >
                        {isPostingMessage ? 'Sending Specification...' : 'Yes, Confirm Post'}
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      if (!featureTitle.trim() || !featureDescription.trim()) {
                        setErrorMessage('Please fill in the Feature Title and Description fields before creating a proposal.');
                        return;
                      }
                      setShowConfirm(true);
                    }}
                    disabled={isPostingMessage}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold font-sans uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/15 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Post Feature Specification to Space</span>
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Footer Warning standard */}
        <div className="px-6 py-2 border-t border-white/5 bg-[#0a0a0a] text-center text-[9px] text-gray-600">
          Syncs securely via real-time Workspace endpoints. Content mutations require explicit user dialogue confirmation.
        </div>
      </div>
    </div>
  );
}
