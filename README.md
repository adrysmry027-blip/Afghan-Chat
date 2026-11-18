# Afghan Chat (افغان چت)

A polished multilingual messaging app for Android and other devices, with a familiar and easy-to-use settings experience.

## Sign-in methods
- Afghanistan phone numbers (+93), verified by SMS one-time code (OTP)
- Iran phone numbers (+98), verified by SMS one-time code (OTP)
- Google account sign-in

After signing in, users can create and edit a profile with a display name, profile photo, and optional profile information.

## Contacts and finding friends
- Find existing Afghan Chat users by entering their full phone number, including country code (+93 or +98)
- With the user's explicit permission, optionally match phone numbers from the device contacts against registered Afghan Chat accounts
- Show matching registered users so the user can add them as friends and start a chat
- If a contact is not registered, offer a shareable invitation instead of pretending the person is already on Afghan Chat
- Provide manual phone-number search even if contact access is denied
- Protect contact data: request permission only when needed, explain its use, minimize retention, and never expose a user's address book to other users
- Let users control who can find them by phone number and who can add them to groups

## Planned messaging and social features
- One-to-one text messaging with real-time delivery
- Voice calls and video calls
- Send and receive photos, videos, voice messages, and files
- Create groups, add or remove group members, and manage group information
- Add friends and contacts by phone number
- User profiles with profile photos and display names
- 24-hour Status updates: share photos, videos, and text with friends; view friends' statuses; control status audience and privacy
- Status interactions: send emoji reactions and reply with text to a specific photo or video status; deliver the reaction or reply privately to the status owner only
- Status owner can view and manage replies and reactions; other viewers cannot see private replies
- Delete messages sent by the current user
- Message and call notifications
- Android-friendly installable experience

## Settings experience (WhatsApp-inspired)
Create a clean, attractive, easy-to-navigate Settings area, inspired by common messaging-app patterns without copying WhatsApp branding or interface assets. Include:
- Account: phone number, account details, privacy and security controls
- Profile: change profile photo, display name, and profile information
- Privacy: last-seen/online visibility, profile-photo visibility, about visibility, read receipts, blocked contacts, status audience, phone-number discoverability, and group-invite permissions
- Chats: chat wallpaper/theme, font or text size, chat backup options, chat history, and media visibility
- Notifications: message and group tones, vibration, previews, and call alerts
- Storage and data: storage usage, media auto-download over Wi-Fi/mobile data, and data-saving options
- Language: Pashto, Dari, and English
- Help: help center, contact support, app information, and privacy/terms
- Appearance: light/dark/system theme

Privacy-sensitive options must have clear explanations and sensible defaults. Settings should be grouped into readable sections, work well on small Android screens, and support right-to-left Dari and Pashto layouts as well as left-to-right English.

## Project status
The repository currently contains an initial React + Vite interface. The features above are requirements, not yet a completed production messaging service. Real messaging, authentication, contact matching, calls, media storage, status updates and interactions, notifications, backups, and deployment still need backend services and configuration.

## Development approach
Build in stages: multilingual app foundation and interface; phone OTP and Google authentication; user profiles and phone-number/contact discovery; privacy/settings screens; database and real-time messaging; groups; media uploads and 24-hour status with private reactions and replies; notifications and backup; voice/video calling; then Android packaging and testing.

## SMS provider requirement
SMS verification for +93 and +98 requires an authentication/SMS provider that supports delivery to both Afghanistan and Iran. Provider coverage, pricing, and required credentials must be checked before enabling live OTP. Never commit provider secrets or API keys to GitHub.

## Security
Never commit passwords, API keys, private service credentials, or Android signing keys. Store secrets in environment variables or provider-side secret settings.
