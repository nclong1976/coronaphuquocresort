async function test() {
  try {
    // 1. Đăng nhập
    const loginRes = await fetch('https://coronaphuquocresort-two.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'leo1102', password: '121212' })
    });
    
    if (!loginRes.ok) {
      console.error('Login failed:', await loginRes.text());
      return;
    }
    
    const { token } = await loginRes.json();
    console.log('Login success, token obtained.');
    
    // 2. Gọi API admin/users
    const usersRes = await fetch('https://coronaphuquocresort-two.vercel.app/api/admin/users', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('API Users Status:', usersRes.status);
    const text = await usersRes.text();
    console.log('API Users Response:', text.slice(0, 500));
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
