npm run build
npx cap sync android
cd android
.\gradlew assembleDebug
cd ..
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "mushiqr-pro-whatsapp-style-v7.apk"
Write-Host "Build Complete! APK saved as mushiqr-pro-whatsapp-style-v7.apk"
