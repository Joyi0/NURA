export function AdminLoginClient() {
  return (
    <div className="admin-login-page">
      <section className="admin-login-card">
        <span className="eyebrow">NURA ADMIN</span>
        <h1>后台登录</h1>
        <form className="form-grid" action="/api/admin/login" method="post">
          <div className="field">
            <label>账号</label>
            <input name="username" autoComplete="username" required />
          </div>
          <div className="field">
            <label>密码</label>
            <input name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="btn" type="submit">
            登录后台
          </button>
        </form>
      </section>
    </div>
  );
}
