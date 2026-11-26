import { Notice } from "../../components/ui.jsx";

/**
 * Shows the one-time temporary passwords for accounts just created.
 * Origyn is hosted locally, so the admin hands these over in person.
 */
export default function Credentials({ accounts, onClose }) {
  if (!accounts?.length) return null;
  return (
    <Notice onClose={onClose}>
      <p>
        <strong>{accounts.length === 1 ? "Account created." : `${accounts.length} accounts created.`}</strong>{" "}
        Share the temporary password with each person. It is shown only once; they can use it to sign in straight away.
      </p>
      <div className="table-wrap" style={{ marginTop: 8 }}>
        <table className="table credentials">
          <thead>
            <tr><th scope="col">Name</th><th scope="col">Email</th><th scope="col">Temporary password</th></tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.email}><td>{a.name}</td><td>{a.email}</td><td>{a.tempPassword}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </Notice>
  );
}
