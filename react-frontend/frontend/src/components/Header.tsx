function Header({ role }: { role: string }) {
  return (
    <>
      <nav className="navbar navbar-expand-lg bg-body-tertiary">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            SLMS {role}
          </a>
        </div>
        <button type="submit" className="btn btn-primary">
          Profile
        </button>
      </nav>
    </>
  );
}

export default Header;
