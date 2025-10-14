import Header from "./Header";
import { Sidebar } from "react-pro-sidebar";
import Roles from "./UtilsRoles";
import Paths from "./UtilsPaths";
import OrdersPanel from "./OrdersPanel";

const role: string = Roles.ROLE_WAREHOUSE;
const href: string = Paths.PATH_WAREHOUSE;

function Warehouse() {
  return (
    <>
      <Header role={role} href={href} />
      <div className="d-flex">
        <Sidebar className="bg-light border-end" style={{ minHeight: "100vh" }}>
          <div className="p-3">
            <h6 className="text-muted text-uppercase mb-3">Ferramentas</h6>
            <div className="d-grid gap-2">
              <button className="btn btn-outline-primary" type="button">
                <i className="bi bi-star me-2"></i>
                Rating Transportadoras
              </button>
              <button className="btn btn-outline-primary" type="button">
                <i className="bi bi-file-earmark-text me-2"></i>
                Gerar Relatórios
              </button>
              <button className="btn btn-outline-primary" type="button">
                <i className="bi bi-graph-up me-2"></i>
                KPI
              </button>
            </div>
          </div>
        </Sidebar>

        <main className="flex-grow-1 p-4" style={{ backgroundColor: "#f8f9fa" }}>
          <div className="container-fluid">
            <div className="row mb-4">
              <div className="col">
                <h2 className="mb-0">
                  <i className="bi bi-building me-2 text-primary"></i>
                  Warehouse - Gestão de Pedidos
                </h2>
                <p className="text-muted">Visualize e gerencie os pedidos recebidos</p>
              </div>
            </div>

            <div className="row">
              <div className="col-12">
                <OrdersPanel />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default Warehouse;
