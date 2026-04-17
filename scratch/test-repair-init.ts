import admin from 'firebase-admin';

// The key provided by the user (carefully captured from prompt)
const rawKey = `-----BEGIN PRIVATE KEY-----\\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDNY9hVxqaJ+BmV\\nUcX6xlvT1ne1fq76lkw/DcQjpTv/xBng4MWNbToDaOX3SsOpJxt4LODw71eWc3tP\\ngtIcMvh5Q2BIU76FO113pJgt/GvZI2lmPX3Sg4P4nYhw1cNObwWu4qpENsoHZkQp\\niqpyq5A8Bl1b4kvDuEsWfMSThy4vF9xVt4WDGnJw1gFJVNU0oSz3lKfGhhX30dsd\\newPzy/EU9TnxbQKM1vnbzUpbtQUY6VEZJymL1hiw8Wu//V5aVJrHFqa3XfSg1yvu\\nEauaf/iI1rsJL/u5qxs8ac7M/MCo/78Ut6DrwvSgKn4vqT+d+sMOnwUYVTCoMpIE\\ndXAO0jO/AgMBAAECggEAGLOrbxWHLgzCtuywzOpSXPXsS83Cqayt2t+C+W6D+szQ\\n9/TQjaPXWFWjYsyBH7TuXtO28gM3G4ckC3oGXxHaRGtQByLbRRbQtPT8wHsdVW4m\\n3P8ERO9ATgRURo3PAX3kxxXHuJCGV8F67SwaN9RecnmpfMWIqy9dCIVU9xFJAqy6\\no58EBLGlQJQrgthKM3YIxaDL2Lq1iiN8Osr4hr9K2eJ9W1Wl08p0NNJqbxQYZfS+\\nVyCgpVvr0XkFqPQADoH2VPz0rfQhKwcTPm8jQBV4tIXFdBe9tDvHsyBA0kHdilQy\\nWn/cOtesWW6B2vweWJ3XuEpsua+6a77Nu6V0X11+0QKBgQD4d2StlCW1hs50OLfg\\n9G8WBv8BGjW2jmvNHA2OKy47vlyO67RGy1Dt/g2vU8frfDde8PPAM7SbaI+ZOHJZ\\nS2HW06g8f2tV61tBhmi9Tzt2uJnMXNodU6dCgMeAIQtJEbyHR3XKIhzUpvj2W5ci\\nN8/YcrXDEsSwtiZqmNQenmHPRQKBgQDTnhdagjodb0cDIDWi/wj2qqOBE+d04qRn\\nDdxM/8V5zGMJisnHmLiE134FpMhqaxhPcOwo5/6iMtqK8kfBWwN/UwICtfCzIhYN\\buw82oqzgbArN/TkkgIo7UN4W7KYIOraTe6rPi/cxVQ9yumaSiogQpbLA8u89VIQ\\n3Yc0T7RVMwKBgAsCf1uRrPoWNx+/Q6acLi/zr2kFGEw2k2BLVe5uy2WqUb+jgiGA\\n8N0a3NBgDgPJRUrXsnVZ1S7tuy826Ro71OIIDvRfUQpFm42TvyBkWmYwV+BOXPvf\\nsRGpUy3CSRW7y3bTG80RJeXmYDHKbS/++R7GNnemZUDPUXR3wS56JithAoGBALmF\\nXHX1u1s4xinAYCWAruwJVwR/XahEVdse9KbwiMCp5Z1k9lcs1X9oqEvsVeOt9gcX\\nOYL3OG4cZSnxE+U4lE1YiWe098sjs++c8jC7a2PJ65dIHEMSmiAlOcRXp6/lE9/E\\n+NtZzn4e5SazMK8aG+piVm6u6jvDWmn8vF6pDbCvAoGAee8rnAk/7ME0zEhEwHOp\\nDLk2bgDiBuuddAx8TwI5OE+bs103dbR0aT1BM7NRW7LgFzJ2L+lo0OUcRBhO+qj7\\nFMaAsS7tyTkQwn8yrYBUPGN9ppGQhhMrikqW+DQuG5X2JL3Xxb/Xbcmvk0tePzrq\\n2ZCMd7rosSs78CNciO9pm/A=\\n-----END PRIVATE KEY-----\\n`;

// Fix the key:
// 1. Remove all real newlines
// 2. Replace literal \\n with actual newlines
const fixedKey = rawKey.replace(/[\\r\\n]/g, '').replace(/\\\\n/g, '\\n');
// Wait, my rawKey string above is a template literal.
// Let's use a more robust way to handle the literal \\n in the code.

console.log('--- DBG: FIXED KEY ---');
const privateKey = rawKey.replace(/[\\r\\n]/g, '').replace(/\\\\n/g, '\\n');
console.log('Fixed Key Length:', privateKey.length);

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'ipetluxestore',
      clientEmail: 'firebase-adminsdk-fbsvc@ipetluxestore.iam.gserviceaccount.com',
      privateKey: privateKey,
    }),
  });
  console.log('✅ Firebase Admin initialized successfully with FIXED KEY!');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed again:');
  console.error(error.message);
  process.exit(1);
}
