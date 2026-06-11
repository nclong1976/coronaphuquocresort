async function test() {
  try {
    const res = await fetch('https://coronaphuquocresort-two.vercel.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'leo1102', password: '121212' })
    });
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
test();
