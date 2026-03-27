const fs = require('fs');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NDQsImVtYWlsIjoidGVzdHVzZXJAdGVzdC5jb20iLCJpYXQiOjE3NzQ1Njc3MTksImV4cCI6MTc3NTE3MjUxOX0.rV9z8BiDZQL0-lU_18Pz_FEvVC6vrV8vgQYUiNOnaEU';
const filePath = 'C:/temp/test-avatar.png';

(async () => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('test avatar file not found: ' + filePath);
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const form = new FormData();
    form.append('avatar', new Blob([fileBuffer]), 'test-avatar.png');

    const uploadRes = await fetch('http://localhost:10000/api/auth/profile/avatar', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });

    const uploadJson = await uploadRes.json();
    console.log('Upload response', uploadJson);

    const profileRes = await fetch('http://localhost:10000/api/auth/profile', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const profileJson = await profileRes.json();
    console.log('Profile response', profileJson);

    const postsRes = await fetch('http://localhost:10000/api/posts?page=1', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const postsJson = await postsRes.json();
    console.log('First post', postsJson.posts?.[0]);
  } catch (err) {
    console.error('Error test:', err);
  }
})();