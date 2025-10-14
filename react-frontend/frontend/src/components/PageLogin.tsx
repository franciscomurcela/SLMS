import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const role: string = Roles.ROLE_LOGIN;
const href: string = Paths.PATH_LOGIN;

function Login() {
  const navigate = useNavigate();
  const [isValidLogin, setIsValidLogin] = useState(false);

  if (isValidLogin) {
    navigate(Paths.PATH_PROFILE);
  }

  return (
    <>
      <Header role={role} href={href} />
      <div className="container mt-4">
        <h2 className="text-center mb-4" style={{ color: "#2c3e50" }}>
          SLMS {Roles.ROLE_LOGIN}
        </h2>
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
                />
              </div>
              <br />
              <div className="col">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Password"
                  aria-label="Password"
                />
              </div>
            </div>
            <div className="col" />
          </div>
          <br />
          <button
            type="submit"
            className="btn btn-primary"
            onClick={() => setIsValidLogin(true)}
          >
            Login
          </button>
        </div>
      </div>
    </>
  );
}

export default Login;
