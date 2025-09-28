# TODOs

**MeetingSetupForm.tsx**

- [ ] test scheduling meetings

**ReviewMinutesView.tsx** & **ApprovedMinutesView.tsx**

- [ ] add reasoning and sources to the minutes

# TODOs

**MeetingSetupForm.tsx**

- [ ] test scheduling meetings

**ReviewMinutesView.tsx** & **ApprovedMinutesView.tsx**

- [ ] add reasoning and sources to the minutes

## To-Test-List

### Step 5.5 - Global Navbar

- [ ] Navbar appears on authenticated pages (/meetings, /meeting-setup, /settings, /meeting/[id])
- [ ] Navbar does NOT appear on auth pages (/auth/login, /auth/sign-up, etc.) or root page (/)
- [ ] Navbar shows user's initials in avatar when no avatar_url
- [ ] Navbar dropdown shows user name and email
- [ ] Navbar logout button works correctly
- [ ] Navbar padding matches content padding
- [ ] Theme switcher works in navbar

### Step 6.1 - Enhanced Meeting Setup Form

- [ ] Language selection dropdown shows all supported languages
- [ ] "Auto-detect Language" is default selection
- [ ] "Send introductory message in chat" checkbox is checked by default
- [ ] Form validation works with new fields
- [ ] Form submission includes language and send_initial_message fields

### Step 6.2 - Updated create-meeting API

- [ ] API accepts language and send_initial_message parameters
- [ ] Language mapping works correctly for Deepgram (e.g., en -> en-US)
- [ ] Language mapping works correctly for Whisper (e.g., en -> English)
- [ ] Auto-detect language uses "multi" for Deepgram, omits lang for Whisper
- [ ] Chat message is sent in correct language when send_initial_message is true
- [ ] Chat message is NOT sent when send_initial_message is false
- [ ] All 20+ language translations are correct and display properly

### Dynamic Language Selection (New Feature)

- [ ] Language options change based on diarization setting (enabled/disabled)
- [ ] Diarization ON: Shows only Deepgram Nova-3 supported languages (~20 languages)
- [ ] Diarization OFF: Shows all Whisper supported languages (~60+ languages)
- [ ] Language selection updates immediately when diarization toggle changes
- [ ] Selected language persists when switching diarization if supported by both
- [ ] Selected language resets to auto-detect if not supported by new model
- [ ] UI performance is smooth when switching between language sets

### General Integration Testing

- [ ] Complete meeting flow: setup -> creation -> bot join -> transcription -> summary
- [ ] Language selection affects actual transcription accuracy
- [ ] Chat messages appear in correct language in meeting platforms
- [ ] Scheduled meetings work with new language/messaging options
- [ ] Error handling works for unsupported language combinations
- [ ] Database stores language and messaging preferences correctly

## Other

- [ ] implement rate limiting for Gemini API
- [ ] add better way to secure api routes (auth, gemini, skribby)
- [ ] add google login
- [ ] implement testing for all routes (& possibly also pages/components?)
- [ ] implement minutes parser that checks for
  - [ ] no broken md stuff
  - [ ] all analysis & sources can be stringmatched using the agenda topics
- [ ] re-enable no-explicit-any, no-unused-vars, react-hooks/exhaustive-deps, no-unescaped-entities and fix underlying issues
