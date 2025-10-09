import Header from "./Header";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";

const role: string = Roles.ROLE_CARRIER_CARGO_MANIFEST;
const href: string = Paths.PATH_CARRIER_CARGO_MANIFEST;

function CarrierCargoManifest() {
  return (
    <>
      <Header role={role} href={href} />

      <div className="d-grid gap-2 col-6 mx-auto">
        <ul className="list-group">
          <li className="list-group-item">Pendentes</li>
          <li className="list-group-item">Entregues</li>
          <li className="list-group-item">A third item</li>
          <li className="list-group-item">A fourth item</li>
          <li className="list-group-item">And a fifth one</li>
        </ul>
      </div>
    </>
  );
}

export default CarrierCargoManifest;
