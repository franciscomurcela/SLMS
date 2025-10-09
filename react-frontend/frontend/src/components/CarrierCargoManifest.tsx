import Header from "./Header";

const role: string = "Carrier";

function CarrierCargoManifest() {
  return (
    <>
      <Header role={role} />

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
