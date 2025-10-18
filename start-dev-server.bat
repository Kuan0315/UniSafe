@echo off
echo Starting UniSafe Development Server...
echo.
cd frontend
echo Installing dependencies...
call npm install
echo.
echo Starting Expo development server...
echo Users can scan the QR code with Expo Go app to test UniSafe
echo.
call npx expo start
pause