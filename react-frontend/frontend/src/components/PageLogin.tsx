import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

const role: string = Roles.ROLE_LOGIN;
const href: string = Paths.PATH_LOGIN;

function Login() {
  return (
    <>
      <Header role={role} href={href} />

      <div className="container text-center">
        <div className="row align-items-start">
          <div className="col"></div>
          <div className="col">
            <div className="col">
              <input
                type="text"
                className="form-control"
                placeholder="Email"
                aria-label="Email"
              ></input>
            </div>
            <div className="col">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                aria-label="Password"
              ></input>
            </div>
          </div>
          <div className="col"></div>
        </div>
        <button type="submit" className="btn btn-primary">
          Login
        </button>
      </div>
    </>
  );
}

export default Login;
