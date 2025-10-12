import Header from "./Header";
import { Sidebar, Menu, MenuItem } from "react-pro-sidebar";
import { useState } from "react";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import WarehouseCard from "./WarehouseCard";

const role: string = Roles.ROLE_WAREHOUSE;
const href: string = Paths.PATH_WAREHOUSE;

const pedido: string = "12345";

function Warehouse() {
  return (
    <>
      <Header role={role} href={href} />
      <Sidebar>
        <div className="d-grid gap-2 col-6 mx-auto">
          <button className="btn btn-primary" type="button">
            Rating Transportadoras
          </button>
          <button className="btn btn-primary" type="button">
            Gerar Relatórios
          </button>
          <button className="btn btn-primary" type="button">
            KPI
          </button>
        </div>
      </Sidebar>

      <div className="d-grid gap-2 col-6 mx-auto">
        <div
          className="btn-group"
          role="group"
          aria-label="Basic radio toggle button group"
        >
          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio1"
          />
          <label className="btn btn-outline-primary">Pending</label>

          <input
            type="radio"
            className="btn-check"
            name="btnradio"
            id="btnradio2"
          />
          <label className="btn btn-outline-primary">Sent</label>
        </div>
        <WarehouseCard requestID={pedido} />

        <ul className="list-group">
          <li className="list-group-item">Pedido #{pedido}</li>
          <li className="list-group-item">Entregues</li>
          <li className="list-group-item">A third item</li>
          <li className="list-group-item">A fourth item</li>
          <li className="list-group-item">And a fifth one</li>
        </ul>
      </div>
    </>
  );
}

export default Warehouse;
