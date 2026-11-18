# Afghan Chat (افغان چت)

A multilingual messaging app for Android and other devices.

## Sign-in methods
- Afghanistan phone numbers (+93), verified by SMS one-time code (OTP)
- Iran phone numbers (+98), verified by SMS one-time code (OTP)
- Google account sign-in

After signing in, users can create a display name and profile photo.

## Planned features
- One-to-one text messaging with real-time delivery
- Voice calls and video calls
- Send and receive photos and videos
- Create groups and add or remove group members
- Add friends and contacts by phone number
- User profiles with profile photos and display names
- Pashto, Dari, and English interface languages
- Delete messages sent by the current user
- Android-friendly installable experience

## Project status
The repository currently contains an initial React + Vite interface. The features above are requirements, not yet a completed production messaging service. Real messaging, authentication, calls, media storage, and deployment still need backend services and configuration.

## Development approach
Build in stages: multilingual app foundation and interface; phone OTP and Google authentication; user profiles and contacts; database and real-time messaging; groups; media uploads; voice/video calling; then Android packaging and testing.

## SMS provider requirement
SMS verification for +93 and +98 requires an authentication/SMS provider that supports delivery to both Afghanistan and Iran. Provider coverage, pricing, and required credentials must be checked before enabling live OTP. Never commit provider secrets or API keys to GitHub.

## Security
Never commit passwords, API keys, private service credentials, or Android signing keys. Store secrets in environment variables or provider-side secret settings.
