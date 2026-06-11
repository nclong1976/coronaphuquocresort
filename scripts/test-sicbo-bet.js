async function test() {
  try {
    // 1. Đăng nhập tài khoản testuser
    const loginRes = await fetch('https://coronaphuquocresort-two.vercel.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@casino.com', password: 'password123' })
    });
    
    if (!loginRes.ok) {
      console.error('Login failed:', await loginRes.text());
      return;
    }
    
    const { token, user } = await loginRes.json();
    console.log('Login success, user ID:', user.id);
    
    // 2. Lấy trạng thái game Sic Bo xem có đang trong phase betting không
    const stateRes = await fetch('https://coronaphuquocresort-two.vercel.app/api/games/sicbo/state', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const state = await stateRes.json();
    console.log('Sic Bo current state:', state);
    
    if (state.phase !== 'betting') {
      console.warn('Game is not in betting phase. Current phase:', state.phase, 'Wait a moment...');
      return;
    }
    
    // 3. Đặt cược 10 BIG
    const betRes = await fetch('https://coronaphuquocresort-two.vercel.app/api/games/sicbo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        bets: { BIG: 10 }
      })
    });
    
    console.log('Bet Response Status:', betRes.status);
    const data = await betRes.json();
    console.log('Bet Response Data:', data);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
