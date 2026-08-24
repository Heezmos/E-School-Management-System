import { requireUser } from "@/lib/auth";

export default async function NoRolePage() {
  const { user } = await requireUser();

  return (
    <main className="auth-form-wrap">
      <section className="auth-card">
        <h2>Account awaiting assignment</h2>
        <p>{user.email}</p>
        <div className="note">
          Your account is authenticated, but no active E-School role has been assigned yet.
          A platform or school administrator must assign your role before you can continue.
        </div>
      </section>
    </main>
  );
}
